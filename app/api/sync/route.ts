import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
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

  const cfHandle = searchParams.get('cf_handle') || process.env.DEFAULT_CODEFORCES_HANDLE || 'oggy_18';
  const lcHandle = searchParams.get('lc_handle') || process.env.DEFAULT_LEETCODE_USERNAME || 'txrun_18';
  const ccHandle = searchParams.get('cc_handle') || process.env.DEFAULT_CODECHEF_HANDLE || '';

  const results: Record<string, unknown> = {};

  try {
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({ id: DEFAULT_USER_ID, username: 'default_user' }, { onConflict: 'id' });

    if (userError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${userError.message}` },
        { status: 500 }
      );
    }

    const syncPromises: Promise<unknown>[] = [
      syncAccount(DEFAULT_USER_ID, 'codeforces', cfHandle, codeforcesFetcher, force),
      syncAccount(DEFAULT_USER_ID, 'leetcode', lcHandle, leetcodeFetcher, force),
    ];

    if (ccHandle) {
      syncPromises.push(syncAccount(DEFAULT_USER_ID, 'codechef', ccHandle, codechefFetcher, force));
    }

    const [cfResult, lcResult, ccResult] = await Promise.allSettled(syncPromises);

    results.codeforces = cfResult.status === 'fulfilled' ? cfResult.value : { status: 'error', error: (cfResult as PromiseRejectedResult).reason?.message };
    results.leetcode = lcResult.status === 'fulfilled' ? lcResult.value : { status: 'error', error: (lcResult as PromiseRejectedResult).reason?.message };
    if (ccHandle && ccResult) {
      results.codechef = ccResult.status === 'fulfilled' ? ccResult.value : { status: 'error', error: (ccResult as PromiseRejectedResult).reason?.message };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
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
          ignoreDuplicates: true,
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
