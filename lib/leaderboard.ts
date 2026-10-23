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

let cachedLeaderboard: { timestamp: number; data: LeaderboardEntry[] } | null = null;
const LEADERBOARD_CACHE_TTL_MS = 60 * 1000; // 60s cache for sub-millisecond response

export function clearLeaderboardCache() {
  cachedLeaderboard = null;
}

export async function getGlobalLeaderboard(forceRefresh = false): Promise<LeaderboardEntry[]> {
  if (!forceRefresh && cachedLeaderboard && Date.now() - cachedLeaderboard.timestamp < LEADERBOARD_CACHE_TTL_MS) {
    return cachedLeaderboard.data;
  }

  try {
    // 1. Check active Supabase Auth users to prune deleted/orphaned accounts
    let activeAuthIds: Set<string> | null = null;
    try {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
      if (authList?.users) {
        activeAuthIds = new Set(authList.users.map((u) => u.id));
      }
    } catch {
      // Graceful fallback if auth admin API is unavailable
    }

    // 2. Fetch all real registered users (exclude default/demo seed)
    const { data: users, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .neq('id', '00000000-0000-0000-0000-000000000001')
      .neq('username', 'default_user')
      .order('created_at', { ascending: true });

    if (userErr || !users || users.length === 0) {
      return [];
    }

    // Filter out deleted accounts and auto-clean orphans from public.users
    const validUsers = users.filter((u) => {
      if (activeAuthIds && !activeAuthIds.has(u.id)) {
        Promise.resolve(supabaseAdmin.from('users').delete().eq('id', u.id)).catch(() => {});
        return false;
      }
      return true;
    });

    if (validUsers.length === 0) {
      return [];
    }

    // 3. Fetch stats for each user
    const entries: LeaderboardEntry[] = await Promise.all(
      validUsers.map(async (u) => {
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

    cachedLeaderboard = {
      timestamp: Date.now(),
      data: entries,
    };

    return entries;
  } catch (error) {
    console.error('[Leaderboard] Error compiling leaderboard:', error);
    return [];
  }
}
