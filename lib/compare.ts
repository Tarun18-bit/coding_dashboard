import { supabaseAdmin } from '@/lib/db';
import { getDashboardStats } from '@/lib/aggregate';
import { codeforcesFetcher } from '@/lib/platforms/codeforces';
import { leetcodeFetcher } from '@/lib/platforms/leetcode';

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

export async function getCompareProfile(identifier: string): Promise<CompareProfile | null> {
  const cleanId = identifier.trim();
  if (!cleanId) return null;

  try {
    // 1. Check local users table
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .ilike('username', cleanId)
      .maybeSingle();

    // 2. Check accounts table by handle
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

    // 3. If found in database, return aggregated profile
    if (user) {
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
      const tagList = stats.allTopicCounts || stats.topicBreakdown || [];
      for (const item of tagList) {
        topicMap[item.tag] = item.count;
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
    }

    // 4. If not registered locally, fetch live public profile from LeetCode or Codeforces!
    const [lcResult, cfResult] = await Promise.allSettled([
      leetcodeFetcher.fetchProfile(cleanId),
      codeforcesFetcher.fetchProfile(cleanId),
    ]);

    const lcProfile = lcResult.status === 'fulfilled' ? lcResult.value : null;
    const cfProfile = cfResult.status === 'fulfilled' ? cfResult.value : null;

    if (lcProfile && lcProfile.solvedTotal > 0) {
      return {
        username: cleanId,
        totalSolved: lcProfile.solvedTotal,
        difficulty: {
          easy: lcProfile.easy,
          medium: lcProfile.medium,
          hard: lcProfile.hard,
        },
        currentStreak: 0,
        longestStreak: 0,
        highestRating: lcProfile.rating || null,
        bestPlatform: 'LeetCode',
        platforms: ['LeetCode'],
        topicBreakdown: {},
      };
    }

    if (cfProfile && (cfProfile.solvedTotal > 0 || cfProfile.rating)) {
      return {
        username: cleanId,
        totalSolved: cfProfile.solvedTotal,
        difficulty: {
          easy: cfProfile.easy,
          medium: cfProfile.medium,
          hard: cfProfile.hard,
        },
        currentStreak: 0,
        longestStreak: 0,
        highestRating: cfProfile.rating || null,
        bestPlatform: 'Codeforces',
        platforms: ['Codeforces'],
        topicBreakdown: {},
      };
    }

    return null;
  } catch (err) {
    console.error('[Compare] Error resolving profile for', cleanId, err);
    return null;
  }
}
