export interface Snapshot {
  solvedTotal: number;
  easy: number;
  medium: number;
  hard: number;
  rating?: number | null;
  maxRating?: number | null;
  rawJson?: Record<string, unknown> | null;
}

export interface Contest {
  contestName: string;
  date: string; // ISO 8601 UTC string
  rank?: number | null;
  ratingBefore?: number | null;
  ratingAfter?: number | null;
}

export interface Submission {
  platformSubmissionId: string;
  problemId: string;
  title: string;
  verdict: string; // 'AC', 'WA', 'TLE', etc.
  tags: string[];
  difficulty?: string | null;
  submittedAt: string; // ISO 8601 UTC string
}

export interface PlatformFetcher {
  platformName: string;
  fetchProfile(handle: string): Promise<Snapshot>;
  fetchContests(handle: string): Promise<Contest[]>;
  fetchRecentSubmissions(handle: string, limit?: number): Promise<Submission[]>;
}
