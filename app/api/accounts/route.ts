import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db';
import { codeforcesFetcher } from '@/lib/platforms/codeforces';
import { leetcodeFetcher } from '@/lib/platforms/leetcode';
import { codechefFetcher } from '@/lib/platforms/codechef';
import { PlatformFetcher } from '@/lib/platforms/types';
import { ensurePublicUser } from '@/lib/users';
import { clearStatsCache } from '@/lib/aggregate';

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

    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

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

    // Run platform API fetches and DB user/account preparation in parallel for maximum speed
    const [_, existingAccountsRes, profile, contests, submissions] = await Promise.all([
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
    const rawJson = profile?.rawJson as Record<string, any> | null | undefined;
    const canonicalHandle: string =
      rawJson?.matchedUser?.username ||
      rawJson?.userInfo?.handle ||
      cleanHandle;

    const existingAccounts = existingAccountsRes.data || [];
    const nowIso = new Date().toISOString();
    let account: any = null;

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

      // Remove old snapshots (and if handle changed, old submissions/contests) so stats never double up
      cleanupTasks.push(
        Promise.resolve(supabaseAdmin.from('snapshots').delete().eq('account_id', primary.id))
      );
      if (handleChanged) {
        cleanupTasks.push(
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

    if (profile) {
      writeTasks.push(
        Promise.resolve(
          supabaseAdmin.from('snapshots').insert({
            account_id: account.id,
            taken_at: nowIso,
            solved_total: profile.solvedTotal,
            easy: profile.easy,
            medium: profile.medium,
            hard: profile.hard,
            rating: profile.rating,
            max_rating: profile.maxRating,
            raw_json: profile.rawJson,
          })
        )
      );
    }

    if (submissions.length > 0) {
      const rows = submissions.map((submission) => ({
        account_id: account.id,
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
        account_id: account.id,
        contest_name: contest.contestName,
        date: contest.date,
        rank: contest.rank,
        rating_before: contest.ratingBefore,
        rating_after: contest.ratingAfter,
      }));
      writeTasks.push(
        Promise.resolve(supabaseAdmin.from('contests').delete().eq('account_id', account.id)).then(
          () => supabaseAdmin.from('contests').insert(contestRows)
        )
      );
    }

    await Promise.all(writeTasks);

    // Clear cached dashboard stats for this user so UI reflects changes immediately
    clearStatsCache(userId);

    return NextResponse.json({ success: true, account });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
