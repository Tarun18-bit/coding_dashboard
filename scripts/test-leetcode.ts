import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { leetcodeFetcher } from '../lib/platforms/leetcode';

async function runTest() {
  const username = process.argv[2] || process.env.DEFAULT_LEETCODE_USERNAME || 'txrun_18';
  console.log(`\n========================================`);
  console.log(`Testing LeetCode Fetcher for: "${username}"`);
  console.log(`========================================\n`);

  try {
    console.log('1. Fetching Profile & Problem Stats...');
    const startTime = Date.now();
    const profile = await leetcodeFetcher.fetchProfile(username);
    console.log(`✓ Fetched in ${Date.now() - startTime}ms`);
    console.log(`  - Rating: ${profile.rating ?? 'Unrated'}`);
    console.log(`  - Total Solved: ${profile.solvedTotal}`);
    console.log(`  - Breakdown: Easy=${profile.easy}, Medium=${profile.medium}, Hard=${profile.hard}\n`);

    console.log('2. Fetching Contest History...');
    const contestStartTime = Date.now();
    const contests = await leetcodeFetcher.fetchContests(username);
    console.log(`✓ Fetched ${contests.length} attended contests in ${Date.now() - contestStartTime}ms`);
    if (contests.length > 0) {
      console.log('  - Latest 3 Contests:');
      contests.slice(-3).reverse().forEach((c, idx) => {
        console.log(`    ${idx + 1}. [${c.date.slice(0, 10)}] ${c.contestName} | Rank: ${c.rank} | Rating: ${c.ratingBefore} -> ${c.ratingAfter}`);
      });
    }
    console.log('');

    console.log('3. Fetching Recent AC Submissions (Last 5)...');
    const subStartTime = Date.now();
    const submissions = await leetcodeFetcher.fetchRecentSubmissions(username, 5);
    console.log(`✓ Fetched ${submissions.length} AC submissions in ${Date.now() - subStartTime}ms`);
    submissions.forEach((s, idx) => {
      console.log(`  ${idx + 1}. [${s.verdict}] "${s.title}" (${s.problemId}) @ ${s.submittedAt}`);
    });

    console.log(`\n========================================`);
    console.log(`✓ LeetCode Fetcher Test PASSED!`);
    console.log(`========================================\n`);
  } catch (error: unknown) {
    console.error(`\n❌ Test Failed:`, error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

runTest();
