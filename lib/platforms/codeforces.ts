import { PlatformFetcher, Snapshot, Contest, Submission } from './types';

const CF_API_BASE = 'https://codeforces.com/api';
const TIMEOUT_MS = 20000;

type CodeforcesUserInfo = {
  rating?: number | null;
  maxRating?: number | null;
  [key: string]: unknown;
};

type CodeforcesProblem = {
  contestId?: number;
  index?: string;
  rating?: number;
  tags?: string[];
  name?: string;
};

type CodeforcesSubmission = {
  id?: number | string;
  verdict?: string;
  problem?: CodeforcesProblem;
  creationTimeSeconds?: number;
};

type CodeforcesContest = {
  contestName?: string;
  contestId?: number;
  ratingUpdateTimeSeconds?: number;
  rank?: number | null;
  oldRating?: number | null;
  newRating?: number | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

/**
 * Robust fetch with retries and timeout
 */
async function fetchWithTimeout(url: string, retries = 3, timeoutMs = TIMEOUT_MS): Promise<unknown> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Codeforces API responded with HTTP status ${res.status}`);
      }

      const data = (await res.json()) as { status?: string; result?: unknown; comment?: string };
      if (data.status !== 'OK') {
        throw new Error(`Codeforces API error: ${data.comment || 'Unknown error'}`);
      }

      return data.result;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw new Error(`Failed after ${retries} attempts. Last error: ${getErrorMessage(lastError) || 'Network error'}`);
}

export class CodeforcesFetcher implements PlatformFetcher {
  readonly platformName = 'codeforces';

  /**
   * Fetch Codeforces user profile & summary snapshot
   */
  async fetchProfile(handle: string): Promise<Snapshot> {
    try {
      const rawUserInfoList = (await fetchWithTimeout(
        `${CF_API_BASE}/user.info?handles=${encodeURIComponent(handle)}`
      )) as CodeforcesUserInfo[] | null;
      const userInfo = Array.isArray(rawUserInfoList) ? rawUserInfoList[0] : undefined;

      if (!userInfo) {
        throw new Error(`Codeforces user "${handle}" not found`);
      }

      const rawSubmissions = (await fetchWithTimeout(
        `${CF_API_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=5000`,
        2,
        15000
      ).catch((error: unknown) => {
        console.warn(`[Codeforces] Failed to fetch submissions for stats: ${getErrorMessage(error)}`);
        return [] as CodeforcesSubmission[];
      })) as CodeforcesSubmission[];

      const solvedProblems = new Map<string, { rating?: number; tags?: string[] }>();

      for (const sub of rawSubmissions) {
        if (sub.verdict === 'OK' && sub.problem) {
          const probId = `${sub.problem.contestId ?? ''}${sub.problem.index ?? ''}`;
          if (probId && !solvedProblems.has(probId)) {
            solvedProblems.set(probId, {
              rating: sub.problem.rating,
              tags: sub.problem.tags,
            });
          }
        }
      }

      let easy = 0;
      let medium = 0;
      let hard = 0;

      for (const prob of solvedProblems.values()) {
        const r = prob.rating;
        if (!r || r < 1400) {
          easy++;
        } else if (r < 1900) {
          medium++;
        } else {
          hard++;
        }
      }

      return {
        solvedTotal: solvedProblems.size,
        easy,
        medium,
        hard,
        rating: userInfo.rating ?? null,
        maxRating: userInfo.maxRating ?? null,
        rawJson: {
          userInfo,
          totalSubmissionsProcessed: rawSubmissions.length,
        },
      };
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error(`[Codeforces] Error in fetchProfile for ${handle}:`, message);
      throw error;
    }
  }

  /**
   * Fetch Codeforces rating contest history
   */
  async fetchContests(handle: string): Promise<Contest[]> {
    try {
      const contestResults = (await fetchWithTimeout(
        `${CF_API_BASE}/user.rating?handle=${encodeURIComponent(handle)}`
      )) as CodeforcesContest[] | null;

      if (!Array.isArray(contestResults)) {
        return [];
      }

      return contestResults.map((contest) => ({
        contestName: contest.contestName || `Contest #${contest.contestId ?? 'unknown'}`,
        date: new Date((contest.ratingUpdateTimeSeconds ?? 0) * 1000).toISOString(),
        rank: contest.rank ?? null,
        ratingBefore: contest.oldRating ?? null,
        ratingAfter: contest.newRating ?? null,
      }));
    } catch (error: unknown) {
      console.error(`[Codeforces] Error in fetchContests for ${handle}:`, getErrorMessage(error));
      return [];
    }
  }

  /**
   * Fetch recent submissions
   */
  async fetchRecentSubmissions(handle: string, limit = 100): Promise<Submission[]> {
    try {
      const subs = (await fetchWithTimeout(
        `${CF_API_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${limit}`
      )) as CodeforcesSubmission[] | null;

      if (!Array.isArray(subs)) {
        return [];
      }

      return subs.map((sub) => {
        const probId = `${sub.problem?.contestId ?? ''}${sub.problem?.index ?? ''}`;
        const title = sub.problem?.name || probId || 'Unknown Problem';
        const rating = sub.problem?.rating;
        const difficulty = rating ? `${rating}` : (sub.problem?.index || 'Unknown');

        let verdict = sub.verdict || 'UNKNOWN';
        if (verdict === 'OK') verdict = 'AC';
        else if (verdict === 'WRONG_ANSWER') verdict = 'WA';
        else if (verdict === 'TIME_LIMIT_EXCEEDED') verdict = 'TLE';
        else if (verdict === 'MEMORY_LIMIT_EXCEEDED') verdict = 'MLE';
        else if (verdict === 'COMPILATION_ERROR') verdict = 'CE';
        else if (verdict === 'RUNTIME_ERROR') verdict = 'RE';

        return {
          platformSubmissionId: String(sub.id ?? `${probId}-${Date.now()}`),
          problemId: probId,
          title,
          verdict,
          tags: Array.isArray(sub.problem?.tags) ? sub.problem.tags : [],
          difficulty,
          submittedAt: new Date((sub.creationTimeSeconds ?? 0) * 1000).toISOString(),
        };
      });
    } catch (error: unknown) {
      console.error(`[Codeforces] Error in fetchRecentSubmissions for ${handle}:`, getErrorMessage(error));
      return [];
    }
  }
}

export const codeforcesFetcher = new CodeforcesFetcher();
