import { PlatformFetcher, Snapshot, Contest, Submission } from './types';

const CODECHEF_BASE = 'https://www.codechef.com';
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return res;
    } catch {
      if (i === retries - 1) return null;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  return null;
}

/** Extracts Drupal.settings JSON from CodeChef profile page HTML */
function extractDrupalSettings(html: string): Record<string, any> | null {
  const match = html.match(/jQuery\.extend\(Drupal\.settings,\s*(\{[\s\S]*?\})\s*\)/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/** Parses AC submissions from CodeChef's /recent/user HTML response */
function parseSubmissionsHtml(html: string, handle: string): Submission[] {
  const submissions: Submission[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let match;

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];
    // Check if it's an AC row
    const isAC =
      row.includes('tick-icon') ||
      row.includes('100 pts') ||
      row.includes('answer_correct') ||
      row.includes('>AC<') ||
      row.includes('Correct Answer');

    if (!isAC) continue;

    // Extract problem code
    const problemMatch =
      row.match(/href=['"]\/problems\/([^'"]+)['"]/) ||
      row.match(/href=['"]\/[A-Z0-9_]+\/problems\/([^'"]+)['"]/);
    const problemCode = problemMatch?.[1] || '';

    // Problem code is the primary identifier on CodeChef
    const title = problemCode;

    // Extract timestamp
    const timeMatch = row.match(/title='([^']+)'\s*>\s*<span class='tooltips/);
    const rawTime = timeMatch?.[1] || '';

    // Parse CodeChef date format: "09:53 PM 22/01/26"
    let submittedAt = new Date().toISOString();
    if (rawTime) {
      try {
        const [timePart, datePart] = rawTime.split(' ').reduce<[string, string]>(
          (acc, part, i) => {
            if (i < 2) acc[0] += (i === 0 ? '' : ' ') + part;
            else acc[1] += (i === 2 ? '' : '/') + part;
            return acc;
          },
          ['', '']
        );
        const [day, month, year] = (rawTime.split(' ').pop() || '').split('/');
        const fullYear = year ? `20${year}` : new Date().getFullYear().toString();
        submittedAt = new Date(`${fullYear}-${month}-${day}`).toISOString();
      } catch {
        // Use current date as fallback
      }
    }

    if (problemCode) {
      submissions.push({
        platformSubmissionId: `cc_${handle}_${problemCode}_${submittedAt}`,
        problemId: problemCode,
        title: title.trim(),
        verdict: 'AC',
        tags: [],
        submittedAt,
      });
    }
  }

  return submissions;
}

export class CodeChefFetcher implements PlatformFetcher {
  readonly platformName = 'codechef';

  async fetchProfile(handle: string): Promise<Snapshot> {
    const empty: Snapshot = {
      solvedTotal: 0,
      easy: 0,
      medium: 0,
      hard: 0,
      rating: null,
      maxRating: null,
      rawJson: null,
    };

    try {
      const res = await fetchWithRetry(`${CODECHEF_BASE}/users/${encodeURIComponent(handle)}`, {
        headers: DEFAULT_HEADERS,
      });

      if (!res) {
        console.warn(`[CodeChef] Could not reach profile page for ${handle}`);
        return empty;
      }

      const html = await res.text();
      const settings = extractDrupalSettings(html);

      if (!settings) {
        console.warn(`[CodeChef] Could not parse Drupal.settings from profile page for ${handle}`);
        return empty;
      }

      // Extract rating history from "date_versus_rating"
      const ratingHistory: Array<{ rating: number; end_date: string }> =
        settings.date_versus_rating?.all || [];
      
      const currentRating =
        ratingHistory.length > 0
          ? ratingHistory[ratingHistory.length - 1].rating
          : null;
      
      const maxRating =
        ratingHistory.length > 0
          ? Math.max(...ratingHistory.map((r) => r.rating))
          : null;

      // Scrape solved count from modern & legacy CodeChef HTML
      const solvedMatch =
        html.match(/Total\s+Problems\s+Solved:\s*(\d+)/i) ||
        html.match(/Fully\s+Solved[\s\S]{0,200}?<[^>]*>(\d+)<\/[^>]+>/i);
      const solvedTotal = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

      return {
        solvedTotal,
        easy: 0,
        medium: 0,
        hard: 0,
        rating: currentRating,
        maxRating,
        rawJson: {
          date_versus_rating: settings.date_versus_rating,
          user_initial_ratings: settings.user_initial_ratings,
          solvedTotal,
        },
      };
    } catch (err: any) {
      console.error(`[CodeChef] fetchProfile error for ${handle}:`, err.message);
      return empty;
    }
  }

  async fetchContests(handle: string): Promise<Contest[]> {
    try {
      const res = await fetchWithRetry(`${CODECHEF_BASE}/users/${encodeURIComponent(handle)}`, {
        headers: DEFAULT_HEADERS,
      });

      if (!res) return [];

      const html = await res.text();
      const settings = extractDrupalSettings(html);
      if (!settings) return [];

      const ratingHistory: Array<{ rating: number; end_date: string; name?: string }> =
        settings.date_versus_rating?.all || [];

      const contests: Contest[] = [];
      for (let i = 0; i < ratingHistory.length; i++) {
        const entry = ratingHistory[i];
        const prevRating = i === 0
          ? (settings.user_initial_ratings?.all || 1000)
          : ratingHistory[i - 1].rating;

        contests.push({
          platform: 'codechef',
          contestName: entry.name || `CodeChef Round ${i + 1}`,
          date: entry.end_date
            ? new Date(entry.end_date).toISOString()
            : new Date().toISOString(),
          rank: null,
          ratingBefore: prevRating,
          ratingAfter: entry.rating,
          ratingChange: entry.rating - prevRating,
        } as Contest);
      }

      return contests;
    } catch (err: any) {
      console.error(`[CodeChef] fetchContests error for ${handle}:`, err.message);
      return [];
    }
  }

  async fetchRecentSubmissions(handle: string, limit = 50): Promise<Submission[]> {
    const submissions: Submission[] = [];
    const seenProblems = new Set<string>();

    try {
      // Fetch up to 2 pages (20 items per page)
      const pagesToFetch = Math.min(2, Math.ceil(limit / 10));
      for (let page = 1; page <= pagesToFetch; page++) {
        const res = await fetchWithRetry(
          `${CODECHEF_BASE}/recent/user?page=${page}&user_handle=${encodeURIComponent(handle)}`,
          {
            headers: {
              ...DEFAULT_HEADERS,
              Accept: 'application/json',
            },
          }
        );

        if (!res) break;

        const json = await res.json();
        const pageSubmissions = parseSubmissionsHtml(json.content || '', handle);

        for (const sub of pageSubmissions) {
          if (!seenProblems.has(sub.problemId)) {
            seenProblems.add(sub.problemId);
            submissions.push(sub);
          }
          if (submissions.length >= limit) break;
        }

        if (submissions.length >= limit) break;
      }
    } catch (err: any) {
      console.error(`[CodeChef] fetchRecentSubmissions error for ${handle}:`, err.message);
    }

    return submissions;
  }
}

export const codechefFetcher = new CodeChefFetcher();
