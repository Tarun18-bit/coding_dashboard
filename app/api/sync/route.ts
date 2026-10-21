import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { clearStatsCache } from '@/lib/aggregate';
import { codeforcesFetcher } from '@/lib/platforms/codeforces';
import { leetcodeFetcher } from '@/lib/platforms/leetcode';
import { codechefFetcher } from '@/lib/platforms/codechef';
import { PlatformFetcher } from '@/lib/platforms/types';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYNC_CACHE_WINDOW_MS = 60 * 1000; // 60 seconds throttle window

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET_TOKEN;
  if (!secret) return true;

  const authHeader = req.headers.get('authorization');
  const querySecret = new URL(req.url).searchParams.get('token');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === secret) return true;
  }

  if (querySecret === secret) return true;

  return false;
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing token' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  let targetUserId = DEFAULT_USER_ID;
  try {
    const serverSupabase = await createClient();
    const { data } = await serverSupabase.auth.getUser();
    if (data?.user?.id) {
      targetUserId = data.user.id;
    }
  } catch {
    // fallback
  }

  const queryUserId = searchParams.get('user_id');
  if (queryUserId) {
    targetUserId = queryUserId;
  }

  const cfHandle = searchParams.get('cf_handle') || process.env.DEFAULT_CODEFORCES_HANDLE || 'oggy_18';
  const lcHandle = searchParams.get('lc_handle') || process.env.DEFAULT_LEETCODE_USERNAME || 'txrun_18';
  const ccHandle = searchParams.get('cc_handle') || process.env.DEFAULT_CODECHEF_HANDLE || 'txrun_18';

  const results: Record<string, unknown> = {};

  try {
    // Ensure target user exists in users table
    await supabaseAdmin
      .from('users')
      .upsert({ id: targetUserId, username: targetUserId === DEFAULT_USER_ID ? 'default_user' : 'user' }, { onConflict: 'id' });

    // Look up accounts configured for this target user
    const { data: userAccounts } = await supabaseAdmin
      .from('accounts')
      .select('platform, handle')
      .eq('user_id', targetUserId);

    const syncPromises: Promise<unknown>[] = [];

    if (userAccounts && userAccounts.length > 0) {
      for (const acc of userAccounts) {
        if (acc.platform === 'codeforces') {
          syncPromises.push(syncAccount(targetUserId, 'codeforces', acc.handle, codeforcesFetcher, force));
        } else if (acc.platform === 'leetcode') {
          syncPromises.push(syncAccount(targetUserId, 'leetcode', acc.handle, leetcodeFetcher, force));
        } else if (acc.platform === 'codechef') {
          syncPromises.push(syncAccount(targetUserId, 'codechef', acc.handle, codechefFetcher, force));
        }
      }
    } else {
      // If user has no accounts table rows yet, use default handles
      syncPromises.push(syncAccount(targetUserId, 'codeforces', cfHandle, codeforcesFetcher, force));
      syncPromises.push(syncAccount(targetUserId, 'leetcode', lcHandle, leetcodeFetcher, force));
      if (ccHandle) {
        syncPromises.push(syncAccount(targetUserId, 'codechef', ccHandle, codechefFetcher, force));
      }
    }

    const settled = await Promise.allSettled(syncPromises);

    // Also sync DEFAULT_USER_ID if target was different, so demo profile stays updated
    if (targetUserId !== DEFAULT_USER_ID) {
      Promise.allSettled([
        syncAccount(DEFAULT_USER_ID, 'codeforces', cfHandle, codeforcesFetcher, force),
        syncAccount(DEFAULT_USER_ID, 'leetcode', lcHandle, leetcodeFetcher, force),
        syncAccount(DEFAULT_USER_ID, 'codechef', ccHandle, codechefFetcher, force),
      ]).catch(console.error);
    }

    // Invalidate stats cache so dashboard updates instantly
    clearStatsCache(targetUserId);
    clearStatsCache(DEFAULT_USER_ID);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      targetUserId,
      syncedAccounts: settled.length,
    });
  } catch (error: unknown) {
    console.error('[Sync] Global error during sync:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * Generic sync engine for any PlatformFetcher
 */
async function syncAccount(
  userId: string,
  platform: string,
  handle: string,
  fetcher: PlatformFetcher,
  force: boolean
) {
  try {
    const { data: accountData, error: accError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('handle', handle)
      .maybeSingle();

    if (accError) throw accError;

    let account = accountData;

    if (!account) {
      const { data: newAcc, error: insertError } = await supabaseAdmin
        .from('accounts')
        .insert({
          user_id: userId,
          platform,
          handle,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      account = newAcc;
    }

    if (!force && account.last_synced_at) {
      const timeSinceLastSync = Date.now() - new Date(account.last_synced_at).getTime();
      if (timeSinceLastSync < SYNC_CACHE_WINDOW_MS) {
        return {
          status: 'skipped',
          reason: `Rate limited. Last synced ${Math.round(timeSinceLastSync / 1000)}s ago (cache window is 60s). Use ?force=true to override.`,
          platform,
          handle,
        };
      }
    }

    const [profile, contests, submissions] = await Promise.all([
      fetcher.fetchProfile(handle),
      fetcher.fetchContests(handle),
      fetcher.fetchRecentSubmissions(handle, 100),
    ]);

    const { error: snapshotError } = await supabaseAdmin.from('snapshots').insert({
      account_id: account.id,
      taken_at: new Date().toISOString(),
      solved_total: profile.solvedTotal,
      easy: profile.easy,
      medium: profile.medium,
      hard: profile.hard,
      rating: profile.rating,
      max_rating: profile.maxRating,
      raw_json: profile.rawJson,
    });
    if (snapshotError) throw snapshotError;

    if (submissions.length > 0) {
      const submissionRows = submissions.map((sub) => ({
        account_id: account.id,
        platform_submission_id: sub.platformSubmissionId,
        problem_id: sub.problemId,
        title: sub.title,
        verdict: sub.verdict,
        tags: sub.tags,
        difficulty: sub.difficulty,
        submitted_at: sub.submittedAt,
      }));

      const { error: subError } = await supabaseAdmin
        .from('submissions')
        .upsert(submissionRows, {
          onConflict: 'account_id,platform_submission_id',
          ignoreDuplicates: false,
        });

      if (subError) throw subError;
    }

    if (contests.length > 0) {
      await supabaseAdmin.from('contests').delete().eq('account_id', account.id);
      const contestRows = contests.map((contest) => ({
        account_id: account.id,
        contest_name: contest.contestName,
        date: contest.date,
        rank: contest.rank,
        rating_before: contest.ratingBefore,
        rating_after: contest.ratingAfter,
      }));
      const { error: contestError } = await supabaseAdmin.from('contests').insert(contestRows);
      if (contestError) throw contestError;
    }

    await supabaseAdmin
      .from('accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', account.id);

    return {
      status: 'success',
      platform,
      handle,
      solvedTotal: profile.solvedTotal,
      rating: profile.rating,
      contestsSynced: contests.length,
      submissionsProcessed: submissions.length,
    };
  } catch (error: unknown) {
    console.error(`[Sync] Error syncing ${platform} for ${handle}:`, error);
    return {
      status: 'error',
      platform,
      handle,
      error: getErrorMessage(error),
    };
  }
}
