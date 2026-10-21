export interface UpcomingContest {
  id: string;
  name: string;
  platform: 'codeforces' | 'leetcode' | 'codechef';
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  durationMinutes: number;
  url: string;
  googleCalendarUrl: string;
}

/** Helper to generate a 1-click Google Calendar Event link */
function generateGoogleCalendarUrl(
  title: string,
  startTime: string,
  endTime: string,
  url: string,
  platform: string
): string {
  const formatTime = (iso: string) => {
    return new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const start = formatTime(startTime);
  const end = formatTime(endTime);
  const details = encodeURIComponent(`Participate in ${title} on ${platform}.\n\nContest Link: ${url}`);
  const encodedTitle = encodeURIComponent(`[${platform.toUpperCase()}] ${title}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${start}/${end}&details=${details}&location=${encodeURIComponent(url)}`;
}

let cachedContests: { timestamp: number; data: UpcomingContest[] } | null = null;
const CACHE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchUpcomingContests(): Promise<UpcomingContest[]> {
  if (cachedContests && Date.now() - cachedContests.timestamp < CACHE_WINDOW_MS) {
    return cachedContests.data;
  }

  const contests: UpcomingContest[] = [];

  const [cfRes, lcRes, ccRes] = await Promise.allSettled([
    // 1. Codeforces API
    fetch('https://codeforces.com/api/contest.list?gym=false', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    }).then((r) => r.json()),

    // 2. LeetCode GraphQL
    fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({
        query: 'query upcomingContests { upcomingContests { title titleSlug startTime duration } }',
      }),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    }).then((r) => r.json()),

    // 3. CodeChef API
    fetch('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    }).then((r) => r.json()),
  ]);

  // Parse Codeforces
  if (cfRes.status === 'fulfilled' && cfRes.value?.status === 'OK') {
    const rawList = cfRes.value.result || [];
    const upcoming = rawList.filter((c: any) => c.phase === 'BEFORE');
    for (const c of upcoming) {
      const startMs = c.startTimeSeconds * 1000;
      const durationMin = Math.round(c.durationSeconds / 60);
      const endMs = startMs + c.durationSeconds * 1000;
      const startTime = new Date(startMs).toISOString();
      const endTime = new Date(endMs).toISOString();
      const url = `https://codeforces.com/contest/${c.id}`;

      contests.push({
        id: `cf_${c.id}`,
        name: c.name,
        platform: 'codeforces',
        startTime,
        endTime,
        durationMinutes: durationMin,
        url,
        googleCalendarUrl: generateGoogleCalendarUrl(c.name, startTime, endTime, url, 'Codeforces'),
      });
    }
  }

  // Parse LeetCode
  if (lcRes.status === 'fulfilled' && lcRes.value?.data?.upcomingContests) {
    const rawList = lcRes.value.data.upcomingContests || [];
    for (const c of rawList) {
      const startMs = c.startTime * 1000;
      const durationMin = Math.round(c.duration / 60);
      const endMs = startMs + c.duration * 1000;
      const startTime = new Date(startMs).toISOString();
      const endTime = new Date(endMs).toISOString();
      const url = `https://leetcode.com/contest/${c.titleSlug}/`;

      contests.push({
        id: `lc_${c.titleSlug}`,
        name: c.title,
        platform: 'leetcode',
        startTime,
        endTime,
        durationMinutes: durationMin,
        url,
        googleCalendarUrl: generateGoogleCalendarUrl(c.title, startTime, endTime, url, 'LeetCode'),
      });
    }
  }

  // Parse CodeChef
  if (ccRes.status === 'fulfilled' && ccRes.value?.future_contests) {
    const rawList = ccRes.value.future_contests || [];
    for (const c of rawList) {
      const startTime = c.contest_start_date_iso ? new Date(c.contest_start_date_iso).toISOString() : new Date().toISOString();
      const endTime = c.contest_end_date_iso ? new Date(c.contest_end_date_iso).toISOString() : new Date().toISOString();
      const durationMin = parseInt(c.contest_duration || '120', 10);
      const url = `https://www.codechef.com/${c.contest_code}`;

      contests.push({
        id: `cc_${c.contest_code}`,
        name: c.contest_name,
        platform: 'codechef',
        startTime,
        endTime,
        durationMinutes: durationMin,
        url,
        googleCalendarUrl: generateGoogleCalendarUrl(c.contest_name, startTime, endTime, url, 'CodeChef'),
      });
    }
  }

  // Sort chronologically (earliest contest first)
  contests.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  cachedContests = {
    timestamp: Date.now(),
    data: contests,
  };

  return contests;
}
