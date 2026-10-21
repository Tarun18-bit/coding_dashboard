import { PlatformFetcher, Snapshot, Contest, Submission } from './types';

/**
 * GeeksforGeeks Fetcher Template
 * Implements PlatformFetcher interface for seamless integration
 */
export class GeeksForGeeksFetcher implements PlatformFetcher {
  readonly platformName = 'gfg';

  async fetchProfile(handle: string): Promise<Snapshot> {
    try {
      const res = await fetch(`https://geeks-for-geeks-api.vercel.app/user/${encodeURIComponent(handle)}`, {
        next: { revalidate: 60 },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        return {
          solvedTotal: data.totalProblemsSolved || 0,
          easy: data.easySolved || 0,
          medium: data.mediumSolved || 0,
          hard: data.hardSolved || 0,
          rating: data.codingScore ? Number(data.codingScore) : null,
          maxRating: null,
          rawJson: data,
        };
      }

      return {
        solvedTotal: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        rating: null,
        maxRating: null,
        rawJson: null,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[GFG] Error in fetchProfile for ${handle}:`, message);
      throw error;
    }
  }

  async fetchContests(handle: string): Promise<Contest[]> {
    void handle;
    return [];
  }

  async fetchRecentSubmissions(handle: string, limit = 50): Promise<Submission[]> {
    void handle;
    void limit;
    return [];
  }
}

export const geeksforgeeksFetcher = new GeeksForGeeksFetcher();
