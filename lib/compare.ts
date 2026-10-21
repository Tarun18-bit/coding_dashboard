import { supabaseAdmin } from '@/lib/db';
import { getDashboardStats } from '@/lib/aggregate';

export interface CompareProfile {
  username: string;
  totalSolved: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  currentStreak: number;
  longestStreak: number;
  highestRating: number | null;
  bestPlatform: string;
  platforms: string[];
  topicBreakdown: Record<string, number>;
}

// Built-in benchmark profiles for instant 1v1 comparisons
const BENCHMARK_PROFILES: Record<string, CompareProfile> = {
  striver: {
    username: 'striver',
    totalSolved: 1450,
    difficulty: { easy: 450, medium: 720, hard: 280 },
    currentStreak: 120,
    longestStreak: 365,
    highestRating: 2280,
    bestPlatform: 'codeforces',
    platforms: ['leetcode', 'codeforces', 'codechef'],
    topicBreakdown: {
      'Dynamic Programming': 190,
      'Graphs': 140,
      'Binary Search': 110,
      'Trees': 130,
      'Arrays': 280,
      'Hash Tables': 170,
      'Greedy': 120,
      'Backtracking': 75,
    },
  },
  tourist: {
    username: 'tourist',
    totalSolved: 3820,
    difficulty: { easy: 600, medium: 1420, hard: 1800 },
    currentStreak: 410,
    longestStreak: 980,
    highestRating: 3979,
    bestPlatform: 'codeforces',
    platforms: ['codeforces', 'codechef', 'leetcode'],
    topicBreakdown: {
      'Dynamic Programming': 620,
      'Graphs': 580,
      'Binary Search': 310,
      'Trees': 450,
      'Math': 510,
      'Data Structures': 490,
      'Greedy': 430,
      'String Algorithms': 280,
    },
  },
  neal_wu: {
    username: 'neal_wu',
    totalSolved: 2150,
    difficulty: { easy: 410, medium: 980, hard: 760 },
    currentStreak: 180,
    longestStreak: 540,
    highestRating: 2980,
    bestPlatform: 'codeforces',
    platforms: ['leetcode', 'codeforces'],
    topicBreakdown: {
      'Dynamic Programming': 320,
      'Graphs': 290,
      'Trees': 240,
      'Arrays': 410,
      'Binary Search': 190,
      'Greedy': 210,
      'Backtracking': 140,
    },
  },
};

export async function getCompareProfile(identifier: string): Promise<CompareProfile | null> {
  const cleanId = identifier.trim().toLowerCase();

  // 1. Check built-in benchmarks first
  if (BENCHMARK_PROFILES[cleanId]) {
    return BENCHMARK_PROFILES[cleanId];
  }

  try {
    // 2. Check users table
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .ilike('username', cleanId)
      .maybeSingle();

    // 3. Fallback to accounts table handle match
    if (!user) {
      const { data: account } = await supabaseAdmin
        .from('accounts')
        .select('user_id, users(id, username)')
        .ilike('handle', cleanId)
        .limit(1)
        .maybeSingle();

      if (account?.users) {
        const u = account.users as unknown as { id: string; username: string };
        user = { id: u.id, username: u.username };
      }
    }

    // 4. Default user fallback if cleanId matches default / demo or txrun_18
    if (!user && (cleanId === 'default' || cleanId === 'demo' || cleanId === 'txrun_18' || cleanId === 'default_user')) {
      user = { id: '00000000-0000-0000-0000-000000000001', username: cleanId };
    }

    if (!user) {
      return null;
    }

    const stats = await getDashboardStats(user.id);

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

    const platforms = Array.from(new Set(stats.accounts.map((a) => a.platform.toLowerCase())));

    const topicMap: Record<string, number> = {};
    if (stats.topicBreakdown && Array.isArray(stats.topicBreakdown)) {
      for (const item of stats.topicBreakdown) {
        topicMap[item.tag] = item.count;
      }
    }

    return {
      username: user.username || cleanId,
      totalSolved: stats.totalSolved,
      difficulty: {
        easy: stats.difficultyBreakdown.easy,
        medium: stats.difficultyBreakdown.medium,
        hard: stats.difficultyBreakdown.hard,
      },
      currentStreak: stats.streaks.currentStreak,
      longestStreak: stats.streaks.longestStreak,
      highestRating,
      bestPlatform,
      platforms,
      topicBreakdown: topicMap,
    };
  } catch (err) {
    console.error('[Compare] Error resolving profile:', err);
    return null;
  }
}
