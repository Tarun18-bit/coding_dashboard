import { codeforcesFetcher } from '../lib/platforms/codeforces';

async function runTest() {
  const handle = process.argv[2] || process.env.DEFAULT_CODEFORCES_HANDLE || 'tourist';
  console.log(`\n========================================`);
  console.log(`Testing Codeforces Fetcher for: "${handle}"`);
  console.log(`========================================\n`);

  try {
    console.log('1. Fetching Profile & Problem Stats...');
    const startTime = Date.now();
    const profile = await codeforcesFetcher.fetchProfile(handle);
    console.log(`✓ Fetched in ${Date.now() - startTime}ms`);
    console.log(`  - Rating: ${profile.rating} (Max: ${profile.maxRating})`);
    console.log(`  - Total Solved: ${profile.solvedTotal}`);
    console.log(`  - Breakdown: Easy=${profile.easy}, Medium=${profile.medium}, Hard=${profile.hard}\n`);

    console.log('2. Fetching Contest History...');
    const contestStartTime = Date.now();
    const contests = await codeforcesFetcher.fetchContests(handle);
    console.log(`✓ Fetched ${contests.length} contests in ${Date.now() - contestStartTime}ms`);
    if (contests.length > 0) {
      console.log('  - Latest 3 Contests:');
      contests.slice(-3).reverse().forEach((c, idx) => {
        console.log(`    ${idx + 1}. [${c.date.slice(0, 10)}] ${c.contestName} | Rank: ${c.rank} | Rating: ${c.ratingBefore} -> ${c.ratingAfter}`);
      });
    }
    console.log('');

    console.log('3. Fetching Recent Submissions (Last 5)...');
    const subStartTime = Date.now();
    const submissions = await codeforcesFetcher.fetchRecentSubmissions(handle, 5);
    console.log(`✓ Fetched ${submissions.length} submissions in ${Date.now() - subStartTime}ms`);
    submissions.forEach((s, idx) => {
      console.log(`  ${idx + 1}. [${s.verdict}] "${s.title}" (${s.problemId}) - ${s.difficulty} rating [${s.tags.join(', ')}] @ ${s.submittedAt}`);
    });

    console.log(`\n========================================`);
    console.log(`✓ Codeforces Fetcher Test PASSED!`);
    console.log(`========================================\n`);
  } catch (error: unknown) {
    console.error(`\n❌ Test Failed:`, error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

runTest();
