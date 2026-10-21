import { PlatformFetcher, Snapshot, Contest, Submission } from './types';
import { CURATED_PROBLEMS } from '../sheets-data';

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';
const TIMEOUT_MS = 20000;

type LeetCodeDifficultyCount = { difficulty?: string; count?: number };
type LeetCodeContestHistoryItem = {
  attended?: boolean;
  rating?: number;
  ranking?: number | null;
  contest?: {
    title?: string;
    startTime?: number;
  };
};
type LeetCodeRecentSubmission = {
  id?: number | string;
  title?: string;
  titleSlug?: string;
  timestamp?: number | string;
};
type GraphQLError = { message?: string };

type GraphQLResult = {
  data?: Record<string, unknown>;
  errors?: GraphQLError[];
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

/**
 * Helper to query LeetCode's public GraphQL endpoint
 */
async function fetchLeetCodeGraphQL(
  query: string,
  variables: Record<string, unknown>,
  retries = 3
): Promise<Record<string, unknown>> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://leetcode.com',
          Origin: 'https://leetcode.com',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`LeetCode GraphQL responded with HTTP status ${res.status}`);
      }

      const data = (await res.json()) as GraphQLResult;
      if (data.errors && data.errors.length > 0) {
        throw new Error(`LeetCode GraphQL error: ${data.errors[0]?.message || 'Query failed'}`);
      }

      return (data.data || {}) as Record<string, unknown>;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw new Error(`LeetCode request failed after ${retries} attempts. Last error: ${getErrorMessage(lastError) || 'Network error'}`);
}

export class LeetCodeFetcher implements PlatformFetcher {
  readonly platformName = 'leetcode';

  /**
   * Fetch profile stats, solved problem counts, and submission calendar
   */
  async fetchProfile(handle: string): Promise<Snapshot> {
    const query = `
      query userProfileData($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
          }
          submissionCalendar
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
        userContestRanking(username: $username) {
          rating
          globalRanking
          topPercentage
          attendedContestsCount
        }
      }
    `;

    try {
      const data = await fetchLeetCodeGraphQL(query, { username: handle });
      const matchedUser = data.matchedUser as { submitStatsGlobal?: { acSubmissionNum?: LeetCodeDifficultyCount[] }; [key: string]: unknown } | undefined;

      if (!matchedUser) {
        throw new Error(`LeetCode user "${handle}" not found`);
      }

      const acCounts = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
      const allCount = acCounts.find((item) => item.difficulty === 'All')?.count || 0;
      const easyCount = acCounts.find((item) => item.difficulty === 'Easy')?.count || 0;
      const mediumCount = acCounts.find((item) => item.difficulty === 'Medium')?.count || 0;
      const hardCount = acCounts.find((item) => item.difficulty === 'Hard')?.count || 0;

      const userContestRanking = data.userContestRanking as { rating?: number } | undefined;
      const contestRating = userContestRanking?.rating ? Math.round(userContestRanking.rating) : null;

      return {
        solvedTotal: allCount,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
        rating: contestRating,
        maxRating: contestRating,
        rawJson: {
          matchedUser,
          userContestRanking,
        },
      };
    } catch (error: unknown) {
      console.error(`[LeetCode] Error in fetchProfile for ${handle}:`, getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Fetch contest ranking and participation history
   */
  async fetchContests(handle: string): Promise<Contest[]> {
    const query = `
      query userContestHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;

    try {
      const data = await fetchLeetCodeGraphQL(query, { username: handle });
      const history = data.userContestRankingHistory as LeetCodeContestHistoryItem[] | undefined;

      if (!Array.isArray(history)) {
        return [];
      }

      const attendedContests = history.filter((contest) => contest.attended === true && contest.contest);

      return attendedContests.map((contest, idx) => {
        const ratingAfter = Math.round(contest.rating ?? 0);
        const prevRating = idx > 0 ? Math.round(attendedContests[idx - 1].rating ?? 0) : null;

        return {
          contestName: contest.contest?.title || 'LeetCode Weekly/Biweekly Contest',
          date: new Date((contest.contest?.startTime ?? 0) * 1000).toISOString(),
          rank: contest.ranking || null,
          ratingBefore: prevRating,
          ratingAfter: ratingAfter,
        };
      });
    } catch (error: unknown) {
      console.error(`[LeetCode] Error in fetchContests for ${handle}:`, getErrorMessage(error));
      return [];
    }
  }

  /**
   * Fetch recent accepted submissions
   */
  async fetchRecentSubmissions(handle: string, limit = 50): Promise<Submission[]> {
    const query = `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
        }
      }
    `;

    try {
      const data = await fetchLeetCodeGraphQL(query, { username: handle, limit });
      const subs = data.recentAcSubmissionList as LeetCodeRecentSubmission[] | undefined;

      if (!Array.isArray(subs)) {
        return [];
      }

      return subs.map((submission) => {
        const slug = (submission.titleSlug || '').toLowerCase().trim();
        const title = (submission.title || '').toLowerCase().trim();

        // Check curated sheets dataset for exact match
        const match = CURATED_PROBLEMS.find(
          (p) => p.id.toLowerCase() === slug || p.title.toLowerCase() === title
        );

        const tags: string[] = [];
        let difficulty: 'Easy' | 'Medium' | 'Hard' | null = null;

        if (match) {
          tags.push(match.category.toLowerCase());
          difficulty = match.difficulty;
        }

        // Infer tags from problem slug / title keywords
        const combined = `${slug} ${title}`;
        if (combined.includes('tree') || combined.includes('bst') || combined.includes('trie')) {
          if (!tags.includes('trees')) tags.push('trees');
        }
        if (combined.includes('graph') || combined.includes('island') || combined.includes('network') || combined.includes('clone-graph')) {
          if (!tags.includes('graphs')) tags.push('graphs');
        }
        if (combined.includes('binary-search') || (combined.includes('search') && !combined.includes('word-search')) || combined.includes('find-minimum') || combined.includes('peak')) {
          if (!tags.includes('binary search')) tags.push('binary search');
        }
        if (combined.includes('dp') || combined.includes('subsequence') || combined.includes('palindrome') || combined.includes('robber') || combined.includes('coin-change') || combined.includes('climbing')) {
          if (!tags.includes('dynamic programming')) tags.push('dynamic programming');
        }
        if (combined.includes('two-sum') || combined.includes('three-sum') || combined.includes('pointer') || combined.includes('container-with-most-water') || combined.includes('trap')) {
          if (!tags.includes('two pointers')) tags.push('two pointers');
        }
        if (combined.includes('window') || combined.includes('substring') || combined.includes('longest-substring')) {
          if (!tags.includes('sliding window')) tags.push('sliding window');
        }
        if (combined.includes('array') || combined.includes('matrix') || combined.includes('duplicate') || combined.includes('product-of-array')) {
          if (!tags.includes('arrays')) tags.push('arrays');
        }
        if (combined.includes('string') || combined.includes('parentheses') || combined.includes('anagram')) {
          if (!tags.includes('strings')) tags.push('strings');
        }
        if (combined.includes('linked-list') || combined.includes('reverse-list') || combined.includes('cycle') || combined.includes('lru')) {
          if (!tags.includes('linked list')) tags.push('linked list');
        }

        // Default tag if none matched
        if (tags.length === 0) {
          tags.push('algorithms');
        }

        return {
          platformSubmissionId: String(submission.id ?? `${submission.titleSlug ?? submission.title ?? 'leetcode'}-${submission.timestamp ?? Date.now()}`),
          problemId: submission.titleSlug || submission.title || 'unknown-problem',
          title: submission.title || 'Unknown Problem',
          verdict: 'AC',
          tags,
          difficulty,
          submittedAt: new Date(Number(submission.timestamp ?? 0) * 1000).toISOString(),
        };
      });
    } catch (error: unknown) {
      console.error(`[LeetCode] Error in fetchRecentSubmissions for ${handle}:`, getErrorMessage(error));
      return [];
    }
  }
}

export const leetcodeFetcher = new LeetCodeFetcher();
