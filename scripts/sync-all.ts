import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseAdmin } from '../lib/db';
import { codeforcesFetcher } from '../lib/platforms/codeforces';
import { leetcodeFetcher } from '../lib/platforms/leetcode';
import { codechefFetcher } from '../lib/platforms/codechef';
import { PlatformFetcher } from '../lib/platforms/types';

const userId = '00000000-0000-0000-0000-000000000001';

async function syncOne(platform: string, handle: string, fetcher: PlatformFetcher) {
  console.log(`\n--- Syncing ${platform}: "${handle}" ---`);
  
  // 1. Account
  let { data: account } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('handle', handle)
    .maybeSingle();

  if (!account) {
    const { data: newAcc, error } = await supabaseAdmin
      .from('accounts')
      .insert({ user_id: userId, platform, handle })
      .select()
      .single();
    if (error) throw error;
    account = newAcc;
  }

  // 2. Fetch
  const [profile, contests, submissions] = await Promise.all([
    fetcher.fetchProfile(handle),
    fetcher.fetchContests(handle),
    fetcher.fetchRecentSubmissions(handle, 100),
  ]);

  // 3. Snapshot
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

  // 4. Submissions
  if (submissions.length > 0) {
    const rows = submissions.map((s) => ({
      account_id: account.id,
      platform_submission_id: s.platformSubmissionId,
      problem_id: s.problemId,
      title: s.title,
      verdict: s.verdict,
      tags: s.tags,
      difficulty: s.difficulty,
      submitted_at: s.submittedAt,
    }));
    await supabaseAdmin.from('submissions').upsert(rows, { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: true });
  }

  // 5. Contests
  if (contests.length > 0) {
    await supabaseAdmin.from('contests').delete().eq('account_id', account.id);
    const cRows = contests.map((c) => ({
      account_id: account.id,
      contest_name: c.contestName,
      date: c.date,
      rank: c.rank,
      rating_before: c.ratingBefore,
      rating_after: c.ratingAfter,
    }));
    await supabaseAdmin.from('contests').insert(cRows);
  }

  // 6. Update last synced
  await supabaseAdmin.from('accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);

  console.log(`✓ ${platform} synced: ${profile.solvedTotal} solved (Rating: ${profile.rating ?? 'Unrated'}), ${submissions.length} submissions.`);
}

async function main() {
  const cfHandle = process.env.DEFAULT_CODEFORCES_HANDLE || 'oggy_18';
  const lcHandle = process.env.DEFAULT_LEETCODE_USERNAME || 'txrun_18';
  const ccHandle = process.env.DEFAULT_CODECHEF_HANDLE || '';

  await supabaseAdmin.from('users').upsert({ id: userId, username: 'default_user' }, { onConflict: 'id' });

  await syncOne('codeforces', cfHandle, codeforcesFetcher);
  await syncOne('leetcode', lcHandle, leetcodeFetcher);
  if (ccHandle) {
    await syncOne('codechef', ccHandle, codechefFetcher);
  }

  console.log('\n========================================');
  console.log('✓ ALL PLATFORMS SYNCED TO SUPABASE!');
  console.log('========================================\n');
}

main().catch(console.error);

