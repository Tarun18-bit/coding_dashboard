import { supabaseAdmin } from './db';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

type SubmissionAggregateRow = {
  id: string;
  submitted_at: string;
  verdict: string;
  tags: string[] | null;
  difficulty: string | null;
  problem_id: string;
  title: string;
  accounts?: { platform?: string } | null;
};

type ContestAggregateRow = {
  date: string;
  rating_after: number | null;
  contest_name: string;
  accounts?: { platform?: string } | null;
};

export interface DashboardStats {
  user: {
    id: string;
    username: string;
  };
  totalSolved: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
  };
  heatmapData: HeatmapDay[];
  topicBreakdown: {
    tag: string;
    count: number;
  }[];
  allTopicCounts?: {
    tag: string;
    count: number;
  }[];
  strengths: {
    tag: string;
    count: number;
  }[];
  weaknesses: {
    tag: string;
    reason: string;
  }[];
  accounts: {
    id: string;
    platform: string;
    handle: string;
    lastSyncedAt: string | null;
    latestSnapshot: {
      solvedTotal: number;
      easy: number;
      medium: number;
      hard: number;
      rating: number | null;
      maxRating: number | null;
      takenAt: string;
    } | null;
  }[];
  ratingHistory: {
    date: string;
    rating: number;
    contestName: string;
    platform: string;
  }[];
  recentSubmissions: {
    id: string;
    platform: string;
    title: string;
    problemId: string;
    verdict: string;
    difficulty: string | null;
    submittedAt: string;
    tags: string[];
  }[];
}

function calculateStreaks(activeDatesSet: Set<string>) {
  if (activeDatesSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const sortedDates = Array.from(activeDatesSet).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currDate = new Date(dateStr + 'T00:00:00Z');

    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currDate;
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (activeDatesSet.has(today) || activeDatesSet.has(yesterday)) {
    let checkDate = activeDatesSet.has(today) ? new Date(today + 'T00:00:00Z') : new Date(yesterday + 'T00:00:00Z');
    currentStreak = 0;
    while (activeDatesSet.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDatesSet.size,
  };
}

const statsCache = new Map<string, { timestamp: number; data: DashboardStats }>();
const STATS_CACHE_TTL_MS = 60 * 1000; // 60 seconds fast in-memory cache

export function clearStatsCache(userId?: string) {
  if (userId) {
    statsCache.delete(userId);
  } else {
    statsCache.clear();
  }
}

export async function getDashboardStats(
  userId = '00000000-0000-0000-0000-000000000001',
  forceRefresh = false
): Promise<DashboardStats> {
  if (!forceRefresh) {
    const cached = statsCache.get(userId);
    if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();

  const { data: accountsData } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  const accounts = accountsData || [];
  const accountIds = accounts.map((a) => a.id);

  let totalSolved = 0;
  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;

  const activityMap: Record<string, number> = {};

  const accountsWithSnapshots = await Promise.all(
    accounts.map(async (acc) => {
      const { data: latestSnap } = await supabaseAdmin
        .from('snapshots')
        .select('*')
        .eq('account_id', acc.id)
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestSnap) {
        totalSolved += latestSnap.solved_total || 0;
        totalEasy += latestSnap.easy || 0;
        totalMedium += latestSnap.medium || 0;
        totalHard += latestSnap.hard || 0;

        if (acc.platform === 'leetcode' && latestSnap.raw_json?.matchedUser?.submissionCalendar) {
          try {
            const cal = JSON.parse(latestSnap.raw_json.matchedUser.submissionCalendar);
            for (const [timestampStr, count] of Object.entries(cal)) {
              const d = new Date(Number(timestampStr) * 1000).toISOString().slice(0, 10);
              activityMap[d] = (activityMap[d] || 0) + Number(count);
            }
          } catch {
            // Ignore parse error
          }
        }
      }

      return {
        id: acc.id,
        platform: acc.platform,
        handle: acc.handle,
        lastSyncedAt: acc.last_synced_at,
        latestSnapshot: latestSnap
          ? {
              solvedTotal: latestSnap.solved_total,
              easy: latestSnap.easy,
              medium: latestSnap.medium,
              hard: latestSnap.hard,
              rating: latestSnap.rating,
              maxRating: latestSnap.max_rating,
              takenAt: latestSnap.taken_at,
            }
          : null,
      };
    })
  );

  const tagCounts: Record<string, number> = {};
  const failedTagCounts: Record<string, number> = {};
  let recentSubmissions: DashboardStats['recentSubmissions'] = [];

  if (accountIds.length > 0) {
    const { data: allSubs } = await supabaseAdmin
      .from('submissions')
      .select('id, platform_submission_id, problem_id, title, verdict, tags, difficulty, submitted_at, account_id, accounts!inner(platform)')
      .in('account_id', accountIds)
      .order('submitted_at', { ascending: false })
      .limit(500);

    if (allSubs) {
      const typedSubs = allSubs as SubmissionAggregateRow[];

      for (const sub of typedSubs) {
        const dateKey = new Date(sub.submitted_at).toISOString().slice(0, 10);
        activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;

        let effectiveTags = Array.isArray(sub.tags) && sub.tags.length > 0 ? [...sub.tags] : [];

        // Fallback: Infer standard algorithmic tags from problem title and slug if empty
        if (effectiveTags.length === 0) {
          const combined = `${sub.title || ''} ${sub.problem_id || ''}`.toLowerCase();
          if (combined.includes('tree') || combined.includes('bst') || combined.includes('trie')) {
            effectiveTags.push('trees');
          }
          if (combined.includes('graph') || combined.includes('island') || combined.includes('network')) {
            effectiveTags.push('graphs');
          }
          if (combined.includes('search') || combined.includes('find-minimum') || combined.includes('peak')) {
            effectiveTags.push('binary search');
          }
          if (combined.includes('dp') || combined.includes('subsequence') || combined.includes('palindrome') || combined.includes('robber') || combined.includes('coin-change')) {
            effectiveTags.push('dynamic programming');
          }
          if (combined.includes('two-sum') || combined.includes('three-sum') || combined.includes('pointer') || combined.includes('water')) {
            effectiveTags.push('two pointers');
          }
          if (combined.includes('array') || combined.includes('matrix') || combined.includes('duplicate') || combined.includes('sum')) {
            effectiveTags.push('arrays');
          }
          if (combined.includes('string') || combined.includes('parentheses') || combined.includes('anagram') || combined.includes('word')) {
            effectiveTags.push('strings');
          }
          if (combined.includes('list') || combined.includes('linked')) {
            effectiveTags.push('linked list');
          }
        }

        for (const tag of effectiveTags) {
          if (tag) {
            if (sub.verdict === 'AC') {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            } else {
              failedTagCounts[tag] = (failedTagCounts[tag] || 0) + 1;
            }
          }
        }
      }

      recentSubmissions = typedSubs.slice(0, 15).map((sub) => ({
        id: sub.id,
        platform: sub.accounts?.platform || 'unknown',
        title: sub.title,
        problemId: sub.problem_id,
        verdict: sub.verdict,
        difficulty: sub.difficulty,
        submittedAt: sub.submitted_at,
        tags: sub.tags || [],
      }));
    }
  }

  const activeDatesSet = new Set(Object.keys(activityMap).filter((d) => activityMap[d] > 0));
  const streaks = calculateStreaks(activeDatesSet);

  const heatmapData: HeatmapDay[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    heatmapData.push({
      date: key,
      count: activityMap[key] || 0,
    });
  }

  const allTopicCounts = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const topicBreakdown = allTopicCounts.slice(0, 10);

  // Derive Strengths (top 3 solved topics)
  const strengths = topicBreakdown.slice(0, 3);

  // Derive Weaknesses / Recommended Topics (standard competitive programming pillars with low coverage or high non-AC rate)
  const coreTopics = ['dynamic programming', 'trees', 'graphs', 'binary search', 'greedy', 'math', 'data structures'];
  const weaknesses: { tag: string; reason: string }[] = [];

  for (const core of coreTopics) {
    const solved = tagCounts[core] || 0;
    const fails = failedTagCounts[core] || 0;

    if (fails > 0 && fails >= solved) {
      weaknesses.push({ tag: core, reason: `${fails} incorrect attempts recorded recently` });
    } else if (solved < 3) {
      weaknesses.push({ tag: core, reason: `Low coverage (${solved} solved). Essential for contest rating.` });
    }
    if (weaknesses.length >= 3) break;
  }

  let ratingHistory: DashboardStats['ratingHistory'] = [];
  if (accountIds.length > 0) {
    const { data: contests } = await supabaseAdmin
      .from('contests')
      .select('*, accounts!inner(platform)')
      .in('account_id', accountIds)
      .order('date', { ascending: true });

    if (contests) {
      const typedContests = contests as ContestAggregateRow[];
      ratingHistory = typedContests
        .filter((contest): contest is ContestAggregateRow & { rating_after: number } => contest.rating_after !== null)
        .map((contest) => ({
          date: new Date(contest.date).toISOString().slice(0, 10),
          rating: contest.rating_after,
          contestName: contest.contest_name,
          platform: contest.accounts?.platform || 'codeforces',
        }));
    }
  }

    const result: DashboardStats = {
      user: user || { id: userId, username: 'default_user' },
      totalSolved,
      difficultyBreakdown: {
        easy: totalEasy,
        medium: totalMedium,
        hard: totalHard,
      },
      streaks,
      heatmapData,
      topicBreakdown,
      allTopicCounts,
      strengths,
      weaknesses,
      accounts: accountsWithSnapshots,
      ratingHistory,
      recentSubmissions,
    };

    statsCache.set(userId, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: any) {
    console.error('[Aggregate] Database query error:', err.message);
    return {
      user: { id: userId, username: 'default_user' },
      totalSolved: 0,
      difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
      streaks: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
      heatmapData: [],
      topicBreakdown: [],
      strengths: [],
      weaknesses: [],
      accounts: [],
      ratingHistory: [],
      recentSubmissions: [],
    };
  }
}
