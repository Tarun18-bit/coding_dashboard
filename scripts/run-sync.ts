import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseAdmin } from '../lib/db';
import { codeforcesFetcher } from '../lib/platforms/codeforces';

async function runSyncTest() {
  const handle = process.env.DEFAULT_CODEFORCES_HANDLE || 'oggy_18';
  const userId = '00000000-0000-0000-0000-000000000001';

  console.log(`\n========================================`);
  console.log(`Running Sync for Codeforces: "${handle}"`);
  console.log(`========================================\n`);

  try {
    // 1. Ensure user
    await supabaseAdmin.from('users').upsert({ id: userId, username: 'default_user' }, { onConflict: 'id' });

    // 2. Ensure account
    let { data: account } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'codeforces')
      .eq('handle', handle)
      .maybeSingle();

    if (!account) {
      const { data: newAcc, error: accErr } = await supabaseAdmin
        .from('accounts')
        .insert({ user_id: userId, platform: 'codeforces', handle })
        .select()
        .single();
      if (accErr) throw accErr;
      account = newAcc;
    }
    console.log(`✓ Account verified (ID: ${account.id})`);

    // 3. Fetch data from Codeforces
    console.log('Fetching live profile & submissions from Codeforces...');
    const [profile, contests, submissions] = await Promise.all([
      codeforcesFetcher.fetchProfile(handle),
      codeforcesFetcher.fetchContests(handle),
      codeforcesFetcher.fetchRecentSubmissions(handle, 100),
    ]);

    // 4. Save Snapshot
    const { error: snapErr } = await supabaseAdmin.from('snapshots').insert({
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
    if (snapErr) throw snapErr;
    console.log(`✓ Snapshot saved: ${profile.solvedTotal} solved (Rating: ${profile.rating ?? 'Unrated'})`);

    // 5. Save Contests
    if (contests.length > 0) {
      await supabaseAdmin.from('contests').delete().eq('account_id', account.id);
      const contestRows = contests.map((c) => ({
        account_id: account.id,
        contest_name: c.contestName,
        date: c.date,
        rank: c.rank,
        rating_before: c.ratingBefore,
        rating_after: c.ratingAfter,
      }));
      const { error: cErr } = await supabaseAdmin.from('contests').insert(contestRows);
      if (cErr) throw cErr;
      console.log(`✓ Saved ${contests.length} contest entries`);
    } else {
      console.log(`✓ 0 contests found`);
    }

    // 6. Save Submissions
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

      const { error: subErr } = await supabaseAdmin
        .from('submissions')
        .upsert(submissionRows, { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: true });
      if (subErr) throw subErr;
      console.log(`✓ Saved ${submissions.length} submissions`);
    } else {
      console.log(`✓ 0 submissions found`);
    }

    // 7. Update last synced
    await supabaseAdmin.from('accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);

    console.log(`\n========================================`);
    console.log(`✓ SYNC TO SUPABASE COMPLETED SUCCESSFULLY!`);
    console.log(`========================================\n`);
  } catch (error: unknown) {
    console.error(`❌ Sync error:`, error instanceof Error ? error.message : 'Unknown error');
  }
}

runSyncTest();
