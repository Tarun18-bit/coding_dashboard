async function test() {
  const profileRes = await fetch('https://www.codechef.com/users/txrun_18', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(12000),
  });
  const html = await profileRes.text();

  // Look for JSON data embedded in script tags (CodeChef stores user data as JSON in page)
  const jsonMatch = html.match(/var\s+userRatingData\s*=\s*(\[.*?\]);/s)
    || html.match(/rating-header.*?>(\d+)/s)
    || html.match(/"currentRating":(\d+)/)
    || html.match(/"rating":(\d+)/);

  console.log('JSON rating match:', jsonMatch?.[1]?.slice(0, 200));

  // Find script tags with user data
  const scriptMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  for (const sm of scriptMatches) {
    const s = sm[1];
    if (s.includes('rating') && s.includes('txrun') || s.includes('Fully Solved') || s.includes('fullySolved')) {
      console.log('\n=== Relevant Script Tag ===');
      console.log(s.slice(0, 800));
    }
  }

  // Extract submissions from recent/user API
  const subsRes = await fetch('https://www.codechef.com/recent/user?page=1&user_handle=txrun_18', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  const subsJson = await subsRes.json();
  const html2 = subsJson.content;

  // Parse AC problems from HTML table
  const rows = [...html2.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const solved = [];
  for (const row of rows) {
    const r = row[1];
    const isAC = r.includes('answer_correct') || r.includes('>AC<') || r.includes('>Correct<');
    const problem = r.match(/href="\/problems\/([^"]+)"/)?.[1]
      || r.match(/title='([^']+)'/)?.[1];
    const time = r.match(/title='([^']+?)'\s*>/)?.[1];
    if (isAC && problem) {
      solved.push({ problem, time, verdict: 'AC' });
    }
  }
  console.log('\n=== AC Submissions ===');
  console.log(solved.slice(0, 10));
  console.log('Total AC on page 1:', solved.length);
}

test().catch(console.error);
