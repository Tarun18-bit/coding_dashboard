import { supabaseAdmin } from './db';
import { problemUrl } from './problem-links';
import { clearSheetsCache } from './sheets';
import { clearPotdCache } from './potd';
import { clearLeaderboardCache } from './leaderboard';

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
  account_id: string;
  accounts?: { platform?: string } | null;
};

type ActivityRow = { submitted_at: string; account_id: string };
type ProblemRow = {
  problem_id: string;
  title: string;
  tags: string[] | null;
  difficulty: string | null;
  verdict: string;
  submitted_at: string;
  account_id: string;
};
type SnapshotRow = {
  account_id: string;
  taken_at: string;
  solved_total: number | null;
  easy: number | null;
  medium: number | null;
  hard: number | null;
  rating: number | null;
  max_rating: number | null;
  raw_json: { matchedUser?: { submissionCalendar?: string } } | null;
};
type AccountRow = { id: string; platform: string; handle: string; last_synced_at: string | null };

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
    url?: string | null;
  }[];
  /** Total solved per day (from daily snapshots), oldest first */
  progressHistory?: { date: string; totalSolved: number }[];
  /** Problems solved a while ago that are worth re-solving for interview retention */
  revisionQueue?: {
    platform: string;
    problemId: string;
    title: string;
    difficulty: string | null;
    tags: string[];
    solvedAt: string;
    daysAgo: number;
    url: string | null;
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
const DAY_MS = 86_400_000;
const PAGE_SIZE = 1000; // Supabase caps a single request at 1000 rows
const MAX_PAGES = 10;

export function clearStatsCache(userId?: string) {
  if (userId) {
    statsCache.delete(userId);
  } else {
    statsCache.clear();
  }
  clearSheetsCache(userId);
  clearPotdCache(userId);
  clearLeaderboardCache();
}

/** Fetches every row of a query in pages of 1000 (capped at MAX_PAGES pages). */
async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  maxPages = MAX_PAGES
): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await page(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1);
    if (error || !data) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Infers standard algorithmic tags from a problem title/slug when the platform gave none. */
function inferTags(title: string, problemId: string): string[] {
  const combined = `${title || ''} ${problemId || ''}`.toLowerCase();
  const tags: string[] = [];
  if (/tree|bst|trie/.test(combined)) tags.push('trees');
  if (/graph|island|network|course-schedule/.test(combined)) tags.push('graphs');
  if (/search|find-minimum|peak/.test(combined)) tags.push('binary search');
  if (/\bdp\b|subsequence|robber|coin-change|climbing/.test(combined)) tags.push('dynamic programming');
  if (/two-sum|three-sum|3sum|pointer|water/.test(combined)) tags.push('two pointers');
  if (/array|matrix|duplicate|sum/.test(combined)) tags.push('arrays');
  if (/string|parenthes|anagram|word/.test(combined)) tags.push('strings');
  if (/list|linked/.test(combined)) tags.push('linked list');
  return tags;
}

function emptyStats(userId: string): DashboardStats {
  return {
    user: { id: userId, username: 'default_user' },
    totalSolved: 0,
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    streaks: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
    heatmapData: [],
    topicBreakdown: [],
    allTopicCounts: [],
    strengths: [],
    weaknesses: [],
    accounts: [],
    ratingHistory: [],
    recentSubmissions: [],
    progressHistory: [],
    revisionQueue: [],
  };
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
    const [{ data: user }, { data: accountsData }] = await Promise.all([
      supabaseAdmin.from('users').select('id, username').eq('id', userId).maybeSingle(),
      supabaseAdmin
        .from('accounts')
        .select('id, platform, handle, last_synced_at')
        .eq('user_id', userId)
        .order('last_synced_at', { ascending: false, nullsFirst: false }),
    ]);

    // Deduplicate accounts by platform (keep the most recently synced row so linking twice never double-counts)
    const seenPlatforms = new Set<string>();
    const accounts: AccountRow[] = [];
    for (const acc of (accountsData || []) as AccountRow[]) {
      const platKey = String(acc.platform || '').toLowerCase().trim();
      if (!seenPlatforms.has(platKey)) {
        seenPlatforms.add(platKey);
        accounts.push(acc);
      }
    }

    if (accounts.length === 0) {
      const result = { ...emptyStats(userId), user: user || { id: userId, username: 'default_user' } };
      result.heatmapData = buildHeatmap({});
      statsCache.set(userId, { timestamp: Date.now(), data: result });
      return result;
    }

    const accountIds = accounts.map((a) => a.id);
    const platformByAccount = new Map(accounts.map((a) => [a.id, a.platform]));
    const yearAgoIso = new Date(Date.now() - 366 * DAY_MS).toISOString();
    const historyStartIso = new Date(Date.now() - 180 * DAY_MS).toISOString();

    // All independent queries in parallel
    const [latestSnapshots, recentRes, activityRows, acRows, failedRes, contestsRes, historyRows] = await Promise.all([
      Promise.all(
        accounts.map((acc) =>
          supabaseAdmin
            .from('snapshots')
            .select('account_id, taken_at, solved_total, easy, medium, hard, rating, max_rating, raw_json')
            .eq('account_id', acc.id)
            .order('taken_at', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then((r) => r.data as SnapshotRow | null)
        )
      ),
      supabaseAdmin
        .from('submissions')
        .select('id, problem_id, title, verdict, tags, difficulty, submitted_at, account_id, accounts!inner(platform)')
        .in('account_id', accountIds)
        .order('submitted_at', { ascending: false })
        .limit(15),
      // Every submission in the last year, for the heatmap and streaks
      fetchAllPages<ActivityRow>((from, to) =>
        supabaseAdmin
          .from('submissions')
          .select('submitted_at, account_id')
          .in('account_id', accountIds)
          .gte('submitted_at', yearAgoIso)
          .order('submitted_at', { ascending: false })
          .range(from, to)
      ),
      // Every accepted submission, for unique-problem topic counts and the revision queue
      fetchAllPages<ProblemRow>((from, to) =>
        supabaseAdmin
          .from('submissions')
          .select('problem_id, title, tags, difficulty, verdict, submitted_at, account_id')
          .in('account_id', accountIds)
          .eq('verdict', 'AC')
          .order('submitted_at', { ascending: false })
          .range(from, to)
      ),
      // Recent failed attempts, for weakness detection
      supabaseAdmin
        .from('submissions')
        .select('problem_id, title, tags, difficulty, verdict, submitted_at, account_id')
        .in('account_id', accountIds)
        .neq('verdict', 'AC')
        .order('submitted_at', { ascending: false })
        .limit(500),
      supabaseAdmin
        .from('contests')
        .select('date, rating_after, contest_name, accounts!inner(platform)')
        .in('account_id', accountIds)
        .order('date', { ascending: true }),
      // Snapshot history for the progress chart (no raw_json: keeps the payload small).
      // Newest first so the recent end is never cut off by the row cap (matters before the
      // cleanup migration, when old hourly snapshots still exist); reversed below.
      fetchAllPages<{ account_id: string; taken_at: string; solved_total: number | null }>(
        (from, to) =>
          supabaseAdmin
            .from('snapshots')
            .select('account_id, taken_at, solved_total')
            .in('account_id', accountIds)
            .gte('taken_at', historyStartIso)
            .order('taken_at', { ascending: false })
            .range(from, to),
        3
      ).then((rows) => rows.reverse()),
    ]);

    // ── Totals & LeetCode submission calendar ──
    let totalSolved = 0;
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;
    const activityMap: Record<string, number> = {};
    const accountsWithCalendar = new Set<string>();

    const accountsWithSnapshots = accounts.map((acc, idx) => {
      const latestSnap = latestSnapshots[idx];
      if (latestSnap) {
        totalSolved += latestSnap.solved_total || 0;
        totalEasy += latestSnap.easy || 0;
        totalMedium += latestSnap.medium || 0;
        totalHard += latestSnap.hard || 0;

        const calendar = latestSnap.raw_json?.matchedUser?.submissionCalendar;
        if (acc.platform === 'leetcode' && calendar) {
          try {
            const cal = JSON.parse(calendar) as Record<string, number>;
            for (const [timestampStr, count] of Object.entries(cal)) {
              const d = new Date(Number(timestampStr) * 1000).toISOString().slice(0, 10);
              activityMap[d] = (activityMap[d] || 0) + Number(count);
            }
            accountsWithCalendar.add(acc.id);
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
              solvedTotal: latestSnap.solved_total || 0,
              easy: latestSnap.easy || 0,
              medium: latestSnap.medium || 0,
              hard: latestSnap.hard || 0,
              rating: latestSnap.rating,
              maxRating: latestSnap.max_rating,
              takenAt: latestSnap.taken_at,
            }
          : null,
      };
    });

    // ── Heatmap activity (LeetCode's own calendar is authoritative, so skip its rows to avoid double counting) ──
    for (const row of activityRows) {
      if (accountsWithCalendar.has(row.account_id)) continue;
      const dateKey = new Date(row.submitted_at).toISOString().slice(0, 10);
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    }

    // ── Unique solved problems → topic counts + revision queue ──
    const tagCounts: Record<string, number> = {};
    const solvedKeys = new Set<string>();
    const firstSolve = new Map<string, ProblemRow>(); // rows are newest-first, so the last write is the earliest solve
    for (const row of acRows) {
      const key = `${platformByAccount.get(row.account_id)}:${row.problem_id}`;
      firstSolve.set(key, row);
      if (solvedKeys.has(key)) continue;
      solvedKeys.add(key);
      const tags = row.tags && row.tags.length > 0 ? row.tags : inferTags(row.title, row.problem_id);
      for (const tag of tags) {
        if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // ── Failed attempts on problems that are still unsolved ──
    const failedTagCounts: Record<string, number> = {};
    const failedSeen = new Set<string>();
    for (const row of (failedRes.data || []) as ProblemRow[]) {
      const key = `${platformByAccount.get(row.account_id)}:${row.problem_id}`;
      if (solvedKeys.has(key) || failedSeen.has(key)) continue;
      failedSeen.add(key);
      const tags = row.tags && row.tags.length > 0 ? row.tags : inferTags(row.title, row.problem_id);
      for (const tag of tags) {
        if (tag) failedTagCounts[tag] = (failedTagCounts[tag] || 0) + 1;
      }
    }

    const recentSubmissions: DashboardStats['recentSubmissions'] = ((recentRes.data || []) as SubmissionAggregateRow[]).map(
      (sub) => {
        const platform = sub.accounts?.platform || platformByAccount.get(sub.account_id) || 'unknown';
        return {
          id: sub.id,
          platform,
          title: sub.title,
          problemId: sub.problem_id,
          verdict: sub.verdict,
          difficulty: sub.difficulty,
          submittedAt: sub.submitted_at,
          tags: sub.tags || [],
          url: problemUrl(platform, sub.problem_id),
        };
      }
    );

    const activeDatesSet = new Set(Object.keys(activityMap).filter((d) => activityMap[d] > 0));
    const streaks = calculateStreaks(activeDatesSet);
    const heatmapData = buildHeatmap(activityMap);

    const allTopicCounts = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    const topicBreakdown = allTopicCounts.slice(0, 10);
    const strengths = topicBreakdown.slice(0, 3);

    // Weaknesses: core pillars with low coverage or more unsolved attempts than solves
    const coreTopics = ['dynamic programming', 'trees', 'graphs', 'binary search', 'greedy', 'math', 'data structures'];
    const weaknesses: { tag: string; reason: string }[] = [];
    for (const core of coreTopics) {
      const solved = tagCounts[core] || 0;
      const fails = failedTagCounts[core] || 0;
      if (fails > 0 && fails >= solved) {
        weaknesses.push({ tag: core, reason: `${fails} unsolved problem${fails === 1 ? '' : 's'} with failed attempts` });
      } else if (solved < 3) {
        weaknesses.push({ tag: core, reason: `Low coverage (${solved} solved). Essential for contest rating.` });
      }
      if (weaknesses.length >= 3) break;
    }

    const ratingHistory: DashboardStats['ratingHistory'] = ((contestsRes.data || []) as ContestAggregateRow[])
      .filter((contest): contest is ContestAggregateRow & { rating_after: number } => contest.rating_after !== null)
      .map((contest) => ({
        date: new Date(contest.date).toISOString().slice(0, 10),
        rating: contest.rating_after,
        contestName: contest.contest_name,
        platform: contest.accounts?.platform || 'codeforces',
      }));

    const result: DashboardStats = {
      user: user || { id: userId, username: 'default_user' },
      totalSolved,
      difficultyBreakdown: { easy: totalEasy, medium: totalMedium, hard: totalHard },
      streaks,
      heatmapData,
      topicBreakdown,
      allTopicCounts,
      strengths,
      weaknesses,
      accounts: accountsWithSnapshots,
      ratingHistory,
      recentSubmissions,
      progressHistory: buildProgressHistory(historyRows, totalSolved),
      revisionQueue: buildRevisionQueue(firstSolve, platformByAccount, weaknesses.map((w) => w.tag)),
    };

    statsCache.set(userId, { timestamp: Date.now(), data: result });
    return result;
  } catch (err: unknown) {
    console.error('[Aggregate] Database query error:', err instanceof Error ? err.message : err);
    return emptyStats(userId);
  }
}

function buildHeatmap(activityMap: Record<string, number>): HeatmapDay[] {
  const heatmapData: HeatmapDay[] = [];
  const now = Date.now();
  for (let i = 364; i >= 0; i--) {
    const key = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    heatmapData.push({ date: key, count: activityMap[key] || 0 });
  }
  return heatmapData;
}

/**
 * Daily total-solved series: for each day, sums the last known solved_total of every account.
 * The final point always reflects the live total.
 */
function buildProgressHistory(
  rows: { account_id: string; taken_at: string; solved_total: number | null }[],
  liveTotal: number
): { date: string; totalSolved: number }[] {
  if (rows.length === 0) return [];
  const lastByAccount = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const row of rows) {
    lastByAccount.set(row.account_id, row.solved_total || 0);
    const day = row.taken_at.slice(0, 10);
    let sum = 0;
    for (const v of lastByAccount.values()) sum += v;
    byDay.set(day, sum);
  }
  const series = Array.from(byDay, ([date, totalSolved]) => ({ date, totalSolved }));
  const today = new Date().toISOString().slice(0, 10);
  if (series[series.length - 1]?.date === today) series[series.length - 1].totalSolved = liveTotal;
  else series.push({ date: today, totalSolved: liveTotal });
  return series;
}

/**
 * Spaced-repetition style picks: problems first solved 7-120 days ago, favouring
 * harder problems and weak topics, so interview patterns stay fresh.
 */
function buildRevisionQueue(
  firstSolve: Map<string, ProblemRow>,
  platformByAccount: Map<string, string>,
  weakTags: string[]
): NonNullable<DashboardStats['revisionQueue']> {
  const now = Date.now();
  const weak = new Set(weakTags);
  const candidates: (NonNullable<DashboardStats['revisionQueue']>[number] & { score: number })[] = [];
  for (const row of firstSolve.values()) {
    const daysAgo = Math.floor((now - new Date(row.submitted_at).getTime()) / DAY_MS);
    if (daysAgo < 7 || daysAgo > 120) continue;
    const platform = platformByAccount.get(row.account_id) || 'unknown';
    const tags = row.tags && row.tags.length > 0 ? row.tags : inferTags(row.title, row.problem_id);
    const diff = (row.difficulty || '').toLowerCase();
    const numeric = Number(row.difficulty);
    let score = 0;
    if (diff === 'hard' || numeric >= 1900) score += 3;
    else if (diff === 'medium' || numeric >= 1400) score += 2;
    else score += 0.5;
    if (tags.some((t) => weak.has(t))) score += 2;
    // Classic spacing intervals get a bonus
    if ([7, 14, 30, 60, 90].some((d) => Math.abs(daysAgo - d) <= 2)) score += 1.5;
    candidates.push({
      platform,
      problemId: row.problem_id,
      title: row.title,
      difficulty: row.difficulty,
      tags,
      solvedAt: row.submitted_at,
      daysAgo,
      url: problemUrl(platform, row.problem_id),
      score,
    });
  }
  return candidates
    .sort((a, b) => b.score - a.score || b.daysAgo - a.daysAgo)
    .slice(0, 6)
    .map((c) => {
      const { score, ...rest } = c;
      void score;
      return rest;
    });
}
