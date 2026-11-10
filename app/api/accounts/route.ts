import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db';
import { codeforcesFetcher } from '@/lib/platforms/codeforces';
import { leetcodeFetcher } from '@/lib/platforms/leetcode';
import { codechefFetcher } from '@/lib/platforms/codechef';
import { PlatformFetcher } from '@/lib/platforms/types';
import { ensurePublicUser } from '@/lib/users';
import { clearStatsCache } from '@/lib/aggregate';
import { updateUserLeaderboardCache } from '@/lib/leaderboard';
import { saveSnapshot } from '@/lib/snapshots';
import { consumeDailyQuota, quotaMessage } from '@/lib/usage';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

function getFetcher(platform: string): PlatformFetcher | null {
  if (platform === 'codeforces') return codeforcesFetcher;
  if (platform === 'leetcode') return leetcodeFetcher;
  if (platform === 'codechef') return codechefFetcher;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to link an account' },
        { status: 401 }
      );
    }
    const userId = user.id;

    const body = await req.json();
    const { platform, handle } = body;

    if (!platform || !handle) {
      return NextResponse.json(
        { success: false, error: 'Platform and handle are required' },
        { status: 400 }
      );
    }

    const cleanPlatform = platform.toLowerCase().trim();
    const cleanHandle = handle.trim();
    const fetcher = getFetcher(cleanPlatform);

    if (!fetcher) {
      return NextResponse.json(
        { success: false, error: `Unsupported platform: ${cleanPlatform}` },
        { status: 400 }
      );
    }
    if (cleanHandle.length < 2 || cleanHandle.length > 40 || !/^[A-Za-z0-9_.\-]+$/.test(cleanHandle)) {
      return NextResponse.json({ success: false, error: 'That handle looks invalid.' }, { status: 400 });
    }

    // Each link fetches from external platforms, so cap it per user per day
    const quota = await consumeDailyQuota(userId, 'account_link');
    if (!quota.allowed) {
      return NextResponse.json({ success: false, error: quotaMessage('account_link') }, { status: 429 });
    }

    // Run platform API fetches and DB user/account preparation in parallel for maximum speed
    const [, existingAccountsRes, profile, contests, submissions] = await Promise.all([
      ensurePublicUser(
        userId,
        user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'user'
      ),
      supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', cleanPlatform)
        .order('created_at', { ascending: true }),
      fetcher.fetchProfile(cleanHandle).catch((err) => {
        console.warn(`[Accounts API] Failed to fetch ${cleanPlatform} profile:`, err);
        return null;
      }),
      fetcher.fetchContests(cleanHandle).catch(() => []),
      fetcher.fetchRecentSubmissions(cleanHandle, 50).catch(() => []),
    ]);

    // Resolve canonical handle casing from platform response if available
    const rawJson = profile?.rawJson as
      | { matchedUser?: { username?: string }; userInfo?: { handle?: string } }
      | null
      | undefined;
    const canonicalHandle: string =
      rawJson?.matchedUser?.username ||
      rawJson?.userInfo?.handle ||
      cleanHandle;

    const existingAccounts = existingAccountsRes.data || [];
    const nowIso = new Date().toISOString();
    let account: { id: string } | null = null;

    if (existingAccounts.length > 0) {
      // Reuse the primary account for this platform so linking twice NEVER creates duplicate accounts
      const primary = existingAccounts[0];
      const duplicateIds = existingAccounts.slice(1).map((a) => a.id);
      const handleChanged = primary.handle.toLowerCase() !== canonicalHandle.toLowerCase();

      const cleanupTasks: Promise<unknown>[] = [];

      // Delete any legacy duplicate rows for the same user + platform
      if (duplicateIds.length > 0) {
        cleanupTasks.push(
          Promise.resolve(supabaseAdmin.from('accounts').delete().in('id', duplicateIds))
        );
      }

      // A different handle means a different person's data: clear the old history so stats never mix.
      // Re-linking the same handle keeps the daily snapshot history intact.
      if (handleChanged) {
        cleanupTasks.push(
          Promise.resolve(supabaseAdmin.from('snapshots').delete().eq('account_id', primary.id)),
          Promise.resolve(supabaseAdmin.from('submissions').delete().eq('account_id', primary.id)),
          Promise.resolve(supabaseAdmin.from('contests').delete().eq('account_id', primary.id))
        );
      }

      const [updatedRes] = await Promise.all([
        supabaseAdmin
          .from('accounts')
          .update({ handle: canonicalHandle, last_synced_at: nowIso })
          .eq('id', primary.id)
          .select()
          .single(),
        ...cleanupTasks,
      ]);

      if (updatedRes.error) throw updatedRes.error;
      account = updatedRes.data;
    } else {
      const { data: inserted, error: accErr } = await supabaseAdmin
        .from('accounts')
        .upsert(
          {
            user_id: userId,
            platform: cleanPlatform,
            handle: canonicalHandle,
            last_synced_at: nowIso,
          },
          { onConflict: 'user_id,platform,handle' }
        )
        .select()
        .single();

      if (accErr) throw accErr;
      account = inserted;
    }

    // Persist snapshot, submissions, and contests in parallel
    const writeTasks: Promise<unknown>[] = [];

    if (!account) throw new Error('Could not save the account');
    const accountId = account.id;

    if (profile) {
      writeTasks.push(saveSnapshot(accountId, profile));
    }

    if (submissions.length > 0) {
      const rows = submissions.map((submission) => ({
        account_id: accountId,
        platform_submission_id: submission.platformSubmissionId,
        problem_id: submission.problemId,
        title: submission.title,
        verdict: submission.verdict,
        tags: submission.tags,
        difficulty: submission.difficulty,
        submitted_at: submission.submittedAt,
      }));
      writeTasks.push(
        Promise.resolve(
          supabaseAdmin
            .from('submissions')
            .upsert(rows, { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: true })
        )
      );
    }

    if (contests.length > 0) {
      const contestRows = contests.map((contest) => ({
        account_id: accountId,
        contest_name: contest.contestName,
        date: contest.date,
        rank: contest.rank,
        rating_before: contest.ratingBefore,
        rating_after: contest.ratingAfter,
      }));
      writeTasks.push(
        Promise.resolve(supabaseAdmin.from('contests').delete().eq('account_id', accountId)).then(
          () => supabaseAdmin.from('contests').insert(contestRows)
        )
      );
    }

    await Promise.all(writeTasks);

    // Clear cached dashboard stats for this user so UI reflects changes immediately
    clearStatsCache(userId);
    after(() => updateUserLeaderboardCache(userId).catch(console.error));

    return NextResponse.json({ success: true, account });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to unlink an account' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform')?.toLowerCase().trim();
    const accountId = searchParams.get('id')?.trim();

    if (!platform && !accountId) {
      return NextResponse.json(
        { success: false, error: 'Platform or account ID is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from('accounts').select('id').eq('user_id', user.id);
    if (accountId) {
      query = query.eq('id', accountId);
    } else if (platform) {
      query = query.ilike('platform', platform);
    }

    const { data: matchingAccounts, error: findErr } = await query;
    if (findErr) throw findErr;

    const idsToDelete = (matchingAccounts || []).map((a) => a.id);
    if (idsToDelete.length > 0) {
      await Promise.all([
        supabaseAdmin.from('snapshots').delete().in('account_id', idsToDelete),
        supabaseAdmin.from('submissions').delete().in('account_id', idsToDelete),
        supabaseAdmin.from('contests').delete().in('account_id', idsToDelete),
      ]);
      const { error: delErr } = await supabaseAdmin
        .from('accounts')
        .delete()
        .in('id', idsToDelete)
        .eq('user_id', user.id);
      if (delErr) throw delErr;
    }

    clearStatsCache(user.id);
    const uid = user.id;
    after(() => updateUserLeaderboardCache(uid).catch(console.error));
    return NextResponse.json({ success: true, deletedCount: idsToDelete.length });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
