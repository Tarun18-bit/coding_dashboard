async function check() {
  for (let page = 1; page <= 2; page++) {
    const r = await fetch(`https://www.codechef.com/recent/user?page=${page}&user_handle=txrun_18`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    const d = await r.json();
    const rows = [...d.content.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
    console.log(`Page ${page} rows:`, rows.length);
    for (const row of rows) {
      const text = row[1];
      const probMatch = text.match(/href=['"]\/problems\/([^'"]+)['"]/);
      const prob = probMatch ? probMatch[1] : 'unknown';
      const isTick = text.includes('tick-icon') || text.includes('100 pts') || text.includes('correct');
      const isCross = text.includes('cross-icon') || text.includes('wrong');
      const timeMatch = text.match(/title='([0-9:AMP\s\/]+)'/);
      console.log(`  -> ${prob} | AC: ${isTick} | WA: ${isCross} | Time: ${timeMatch?.[1]}`);
    }
  }
}
check().catch(console.error);
