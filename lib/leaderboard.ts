import { supabaseAdmin } from '@/lib/db';
import { getDashboardStats } from '@/lib/aggregate';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarSeed: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  currentStreak: number;
  longestStreak: number;
  highestRating: number | null;
  bestPlatform: string;
  connectedPlatforms: string[];
}

export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // 1. Fetch all real registered users (exclude default/demo seed)
    const { data: users, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .neq('id', '00000000-0000-0000-0000-000000000001')
      .neq('username', 'default_user')
      .order('created_at', { ascending: true });

    if (userErr || !users || users.length === 0) {
      return [];
    }

    // 2. Fetch stats for each user
    const entries: LeaderboardEntry[] = await Promise.all(
      users.map(async (u) => {
        const stats = await getDashboardStats(u.id);

        let highestRating: number | null = null;
        let bestPlatform = 'Unrated';

        for (const acc of stats.accounts) {
          if (acc.latestSnapshot?.rating) {
            if (highestRating === null || acc.latestSnapshot.rating > highestRating) {
              highestRating = acc.latestSnapshot.rating;
              bestPlatform = acc.platform;
            }
          }
        }

        const connected = Array.from(new Set(stats.accounts.map((a) => a.platform.toLowerCase())));

        return {
          rank: 0,
          userId: u.id,
          username: u.username || 'Coder',
          avatarSeed: u.username || u.id,
          totalSolved: stats.totalSolved,
          easy: stats.difficultyBreakdown.easy,
          medium: stats.difficultyBreakdown.medium,
          hard: stats.difficultyBreakdown.hard,
          currentStreak: stats.streaks.currentStreak,
          longestStreak: stats.streaks.longestStreak,
          highestRating,
          bestPlatform,
          connectedPlatforms: connected,
        };
      })
    );

    // 3. Sort primarily by totalSolved descending, then by streak
    entries.sort((a, b) => {
      if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
      return b.currentStreak - a.currentStreak;
    });

    // 4. Assign ranks
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return entries;
  } catch (error) {
    console.error('[Leaderboard] Error compiling leaderboard:', error);
    return [];
  }
}
