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

const compareCache = new Map<string, { timestamp: number; data: CompareProfile }>();
const COMPARE_CACHE_TTL_MS = 60 * 1000;

export async function getCompareProfile(identifier: string): Promise<CompareProfile | null> {
  const cleanId = identifier.trim();
  if (!cleanId) return null;

  const cacheKey = cleanId.toLowerCase();
  const cached = compareCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < COMPARE_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // 1. Check local users table and accounts table in parallel (1 round-trip instead of 2)
    const [{ data: directUser }, { data: account }] = await Promise.all([
      supabaseAdmin.from('users').select('id, username').ilike('username', cleanId).maybeSingle(),
      supabaseAdmin
        .from('accounts')
        .select('user_id, users(id, username)')
        .ilike('handle', cleanId)
        .limit(1)
        .maybeSingle(),
    ]);

    let user = directUser;
    if (!user && account?.users) {
      const u = account.users as unknown as { id: string; username: string };
      user = { id: u.id, username: u.username };
    }

    // 2. If found in database, return aggregated profile
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

      const resolved: CompareProfile = {
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
      compareCache.set(cacheKey, { timestamp: Date.now(), data: resolved });
      return resolved;
    }

    // 3. If not registered locally, fetch live public profile from LeetCode or Codeforces!
    const [lcResult, cfResult] = await Promise.allSettled([
      leetcodeFetcher.fetchProfile(cleanId),
      codeforcesFetcher.fetchProfile(cleanId),
    ]);

    const lcProfile = lcResult.status === 'fulfilled' ? lcResult.value : null;
    const cfProfile = cfResult.status === 'fulfilled' ? cfResult.value : null;

    if (lcProfile && lcProfile.solvedTotal > 0) {
      const resolved: CompareProfile = {
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
      compareCache.set(cacheKey, { timestamp: Date.now(), data: resolved });
      return resolved;
    }

    if (cfProfile && (cfProfile.solvedTotal > 0 || cfProfile.rating)) {
      const resolved: CompareProfile = {
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
      compareCache.set(cacheKey, { timestamp: Date.now(), data: resolved });
      return resolved;
    }

    return null;
  } catch (err) {
    console.error('[Compare] Error resolving profile for', cleanId, err);
    return null;
  }
}
