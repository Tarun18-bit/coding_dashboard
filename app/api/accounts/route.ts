import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db';
import { codeforcesFetcher } from '@/lib/platforms/codeforces';
import { leetcodeFetcher } from '@/lib/platforms/leetcode';
import { codechefFetcher } from '@/lib/platforms/codechef';
import { ensurePublicUser } from '@/lib/users';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || '00000000-0000-0000-0000-000000000001';

    const body = await req.json();
    const { platform, handle } = body;

    if (!platform || !handle) {
      return NextResponse.json({ success: false, error: 'Platform and handle are required' }, { status: 400 });
    }

    const cleanPlatform = platform.toLowerCase().trim();
    const cleanHandle = handle.trim();

    // Safely ensure user exists without unique constraint collision crashes
    await ensurePublicUser(
      userId,
      user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'user'
    );

    const { data: account, error: accErr } = await supabaseAdmin
      .from('accounts')
      .upsert(
        { user_id: userId, platform: cleanPlatform, handle: cleanHandle },
        { onConflict: 'user_id,platform,handle' }
      )
      .select()
      .single();

    if (accErr) throw accErr;

    if (cleanPlatform === 'codeforces') {
      const [profile, contests, submissions] = await Promise.all([
        codeforcesFetcher.fetchProfile(cleanHandle).catch((err) => {
          console.warn('[Accounts API] Failed to fetch Codeforces profile:', err);
          return null;
        }),
        codeforcesFetcher.fetchContests(cleanHandle).catch(() => []),
        codeforcesFetcher.fetchRecentSubmissions(cleanHandle, 50).catch(() => []),
      ]);

      if (profile) {
        await supabaseAdmin.from('snapshots').insert({
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
        await supabaseAdmin.from('submissions').upsert(rows, { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: true });
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
        await supabaseAdmin.from('contests').insert(contestRows);
      }
    } else if (cleanPlatform === 'leetcode') {
      const [profile, contests, submissions] = await Promise.all([
        leetcodeFetcher.fetchProfile(cleanHandle).catch(() => null),
        leetcodeFetcher.fetchContests(cleanHandle).catch(() => []),
        leetcodeFetcher.fetchRecentSubmissions(cleanHandle, 50).catch(() => []),
      ]);

      if (profile) {
        await supabaseAdmin.from('snapshots').insert({
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
        await supabaseAdmin.from('submissions').upsert(rows, { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: true });
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
        await supabaseAdmin.from('contests').insert(contestRows);
      }
    } else if (cleanPlatform === 'codechef') {
      const [profile, contests, submissions] = await Promise.all([
        codechefFetcher.fetchProfile(cleanHandle).catch(() => null),
        codechefFetcher.fetchContests(cleanHandle).catch(() => []),
        codechefFetcher.fetchRecentSubmissions(cleanHandle, 50).catch(() => []),
      ]);

      if (profile) {
        await supabaseAdmin.from('snapshots').insert({
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
        await supabaseAdmin.from('submissions').upsert(rows, { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: true });
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
        await supabaseAdmin.from('contests').insert(contestRows);
      }
    }

    await supabaseAdmin
      .from('accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', account.id);

    return NextResponse.json({ success: true, account });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
