import type { DashboardStats } from './aggregate';
import type { SheetProgress } from './sheets';
import type { CompanyReadinessResult } from './company-readiness';

/**
 * AI Coach: finds a user's weak spots from their real synced stats.
 *
 * Gemini gets a compact summary of the numbers (never raw personal data) and a list of unsolved
 * NeetCode 150 problems. It may only recommend problems from that list: every slug is checked on the
 * server and links are built here, so no invented problems or links ever reach the user. If Gemini is
 * unavailable, the same report shape is produced from simple rules (clearly labelled as an estimate).
 */

export interface CoachProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
}

export interface CoachWeakness {
  area: string;
  severity: 'High' | 'Medium' | 'Low';
  /** Numbers from the user's own stats that show the weakness */
  evidence: string;
  impact: string;
  fix: string;
  practice: CoachProblem[];
}

export interface CoachReport {
  headline: string;
  summary: string;
  weaknesses: CoachWeakness[];
  strengths: string[];
  habits: { observation: string; suggestion: string }[];
  plan: { day: string; focus: string; problems: CoachProblem[] }[];
  source: 'ai' | 'estimate';
  model?: string;
  generatedAt: string;
  basedOn: { totalSolved: number; lastSyncedAt: string | null };
}

const DAY_MS = 86_400_000;

/** How much each NeetCode group matters in typical interviews/contests (for the rule-based fallback). */
const CATEGORY_WEIGHT: Record<string, number> = {
  'Arrays & Hashing': 1,
  'Two Pointers': 0.8,
  'Sliding Window': 0.8,
  Stack: 0.7,
  'Binary Search': 0.9,
  'Linked List': 0.7,
  Trees: 1,
  Tries: 0.5,
  'Heap / Priority Queue': 0.8,
  Backtracking: 0.7,
  Graphs: 1,
  'Advanced Graphs': 0.6,
  '1-D Dynamic Programming': 1,
  '2-D Dynamic Programming': 0.8,
  Greedy: 0.7,
  Intervals: 0.7,
  'Math & Geometry': 0.4,
  'Bit Manipulation': 0.4,
};

const CATEGORY_ADVICE: Record<string, { impact: string; fix: string }> = {
  'Arrays & Hashing': {
    impact: 'The most common warm-up and phone-screen topic; slow here means less time for the hard part.',
    fix: 'Practise turning nested loops into one pass with a hash map or set.',
  },
  'Two Pointers': {
    impact: 'A standard way interviewers expect you to cut O(n²) scans down to O(n).',
    fix: 'Solve sorted-array and palindrome problems by moving two indices inward.',
  },
  'Sliding Window': {
    impact: 'Substring and subarray questions appear in most OAs.',
    fix: 'Learn the expand-right / shrink-left template and track window state in a map.',
  },
  Stack: {
    impact: 'Monotonic-stack problems separate medium from strong candidates.',
    fix: 'Start with bracket matching, then next-greater-element patterns.',
  },
  'Binary Search': {
    impact: 'Binary search on the answer is a favourite OA trick (capacity, speed, days).',
    fix: 'Write one clean lower-bound template and reuse it on "minimum possible value" problems.',
  },
  'Linked List': {
    impact: 'Pointer bugs under pressure are common interview failures.',
    fix: 'Drill reversal, fast/slow pointers and the dummy-head trick.',
  },
  Trees: {
    impact: 'Trees are among the most asked topics at Google, Amazon and Meta.',
    fix: 'Master recursive DFS that returns values, then level-order BFS.',
  },
  Tries: {
    impact: 'Prefix and word-search questions rely on them.',
    fix: 'Implement a trie once from scratch, then use it for word search.',
  },
  'Heap / Priority Queue': {
    impact: 'Top-K, scheduling and streaming-median questions need a heap.',
    fix: 'Practise keeping a size-K heap and two-heap medians.',
  },
  Backtracking: {
    impact: 'Subsets, permutations and combination questions are frequent mediums.',
    fix: 'Use one choose / explore / un-choose template for all of them.',
  },
  Graphs: {
    impact: 'Graph traversal is core at most product companies and in contests.',
    fix: 'Do grid BFS/DFS first, then topological sort and union-find.',
  },
  'Advanced Graphs': {
    impact: 'Shortest paths and MSTs show up in harder rounds and Div. 2 contests.',
    fix: "Learn Dijkstra with a heap, then Prim's or Kruskal's.",
  },
  '1-D Dynamic Programming': {
    impact: 'DP is the most common reason candidates stall on medium/hard rounds.',
    fix: 'Write the recurrence first, then memoize, then convert to a bottom-up array.',
  },
  '2-D Dynamic Programming': {
    impact: 'Grid and two-string DP questions are common in onsite rounds.',
    fix: 'Draw the table for a small input before coding the transitions.',
  },
  Greedy: {
    impact: 'Greedy questions test whether you can justify a local choice.',
    fix: 'For each problem, write one sentence on why the greedy choice is safe.',
  },
  Intervals: {
    impact: 'Meeting-room and merge-interval questions are interview staples.',
    fix: 'Sort by start (or end) and sweep once.',
  },
  'Math & Geometry': {
    impact: 'Matrix manipulation and overflow edge cases catch people out.',
    fix: 'Practise in-place matrix rotation and careful integer handling.',
  },
  'Bit Manipulation': {
    impact: 'Occasional but quick wins when you know the tricks.',
    fix: 'Learn XOR cancelling and n & (n - 1).',
  },
};

// ---------------------------------------------------------------------------------------------
// Profile sent to the model
// ---------------------------------------------------------------------------------------------

export interface CoachInput {
  stats: DashboardStats;
  sheet: SheetProgress | null;
  readiness: CompanyReadinessResult[];
}

function newestSync(stats: DashboardStats): string | null {
  const times = stats.accounts.map((a) => a.lastSyncedAt).filter((t): t is string => !!t);
  return times.length ? times.sort().at(-1)! : null;
}

function activity(stats: DashboardStats) {
  const byDay = new Map(stats.heatmapData.map((d) => [d.date, d.count]));
  const today = Date.now();
  let solvesLast7 = 0;
  let solvesLast30 = 0;
  let activeDaysLast30 = 0;
  let weekendCount = 0;
  let totalCount90 = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const c = byDay.get(key) || 0;
    if (i < 7) solvesLast7 += c;
    if (i < 30) {
      solvesLast30 += c;
      if (c > 0) activeDaysLast30++;
    }
    totalCount90 += c;
    if (c > 0 && (d.getUTCDay() === 0 || d.getUTCDay() === 6)) weekendCount += c;
  }
  // Unique new problems from daily snapshots (the heatmap counts every submission, not problems)
  const history = stats.progressHistory || [];
  const solvedAsOf = (daysAgo: number) => {
    const cutoff = new Date(today - daysAgo * DAY_MS).toISOString().slice(0, 10);
    const before = history.filter((h) => h.date <= cutoff);
    return before.length ? before[before.length - 1].totalSolved : null;
  };
  const base7 = solvedAsOf(7);
  const base30 = solvedAsOf(30);
  const lastActive = [...byDay.entries()]
    .filter(([, c]) => c > 0)
    .map(([d]) => d)
    .sort()
    .at(-1);
  return {
    newProblemsSolvedLast7: base7 === null ? null : Math.max(0, stats.totalSolved - base7),
    newProblemsSolvedLast30: base30 === null ? null : Math.max(0, stats.totalSolved - base30),
    submissionsLast7: solvesLast7,
    submissionsLast30: solvesLast30,
    activeDaysLast30,
    daysSinceLastSolve: lastActive ? Math.floor((today - new Date(lastActive).getTime()) / DAY_MS) : null,
    weekendSubmissionSharePercentLast90: totalCount90 > 0 ? Math.round((weekendCount / totalCount90) * 100) : null,
    currentStreak: stats.streaks.currentStreak,
    longestStreak: stats.streaks.longestStreak,
    totalActiveDays: stats.streaks.totalActiveDays,
  };
}

/** Compact, numbers-only summary of the user's progress for the model. */
export function buildCoachProfile({ stats, sheet, readiness }: CoachInput) {
  const { easy, medium, hard } = stats.difficultyBreakdown;
  const graded = easy + medium + hard;
  const failedByTopic: Record<string, number> = {};
  for (const s of stats.recentSubmissions) {
    if (s.verdict === 'AC' || s.verdict === 'OK') continue;
    for (const t of s.tags) failedByTopic[t] = (failedByTopic[t] || 0) + 1;
  }
  return {
    totals: {
      solved: stats.totalSolved,
      easy,
      medium,
      hard,
      mediumOrHardPercent: graded > 0 ? Math.round(((medium + hard) / graded) * 100) : null,
    },
    platforms: stats.accounts.map((a) => ({
      platform: a.platform,
      solved: a.latestSnapshot?.solvedTotal ?? 0,
      rating: a.latestSnapshot?.rating ?? null,
      maxRating: a.latestSnapshot?.maxRating ?? null,
    })),
    activity: activity(stats),
    topicsSolved: (stats.allTopicCounts || stats.topicBreakdown).slice(0, 25).map((t) => ({ topic: t.tag, solved: t.count })),
    neetcode150Coverage: sheet
      ? sheet.categories.map((c) => ({ group: c.category, solved: c.solved, total: c.total }))
      : null,
    recentSolves: stats.recentSubmissions
      .filter((s) => s.verdict === 'AC' || s.verdict === 'OK')
      .slice(0, 15)
      .map((s) => ({
        title: s.title,
        difficulty: s.difficulty,
        topics: s.tags.slice(0, 4),
        daysAgo: Math.max(0, Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / DAY_MS)),
      })),
    failedAttemptsByTopic: failedByTopic,
    contests: {
      ratedContests: stats.ratingHistory.length,
      lastRatings: stats.ratingHistory.slice(-6).map((r) => ({ date: r.date, rating: r.rating, platform: r.platform })),
    },
    companyReadinessEstimate: readiness.slice(0, 4).map((r) => ({
      company: r.company.name,
      score: r.overallScore,
      biggestGaps: r.topGaps.map((g) => g.topic),
    })),
  };
}

/** Unsolved NeetCode 150 problems: the only problems the coach may recommend. */
export function candidateProblems(sheet: SheetProgress | null): CoachProblem[] {
  if (!sheet) return [];
  return sheet.categories.flatMap((c) =>
    c.problems
      .filter((p) => !p.isSolved)
      .map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty, category: c.category, url: p.url }))
  );
}

// ---------------------------------------------------------------------------------------------
// Gemini prompt + schema
// ---------------------------------------------------------------------------------------------

export const COACH_SYSTEM_PROMPT = `You are a senior coding-interview and competitive-programming coach.
You receive one student's real progress data as JSON (solved counts, topics, NeetCode 150 coverage, activity, contests) and a list of UNSOLVED practice problems.
Find their most important weaknesses and tell them exactly what to do next.

Rules:
- "activity.submissions*" count every submission (including retries); "newProblemsSolved*" count distinct new problems. Don't call submissions "solves".
- Every weakness MUST cite specific numbers from the data in "evidence" (for example "2 of 13 Graphs problems solved", "only 26% of solves are Medium or Hard"). Never invent numbers, problems, companies or history.
- Rank weaknesses by how much fixing them would improve interview and contest results. Give 3 or 4.
- "practice" and plan "problems" must be slugs copied exactly from CANDIDATE PROBLEMS. Prefer Easy/Medium first for topics the student has barely touched.
- Habits: comment on consistency, difficulty mix or contests only if the data supports it.
- The 7-day plan: one focus per day, 1-2 problems per day, building from easier to harder; day 7 can be review or a timed contest.
- If the student has solved fewer than 20 problems, say the data is still thin and focus on fundamentals and consistency.
- Be direct, specific and encouraging. Short sentences. No generic filler like "keep practicing".`;

export const COACH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    headline: { type: 'STRING', description: 'One sentence: the single most important takeaway' },
    summary: { type: 'STRING', description: '2-3 sentences overview of where the student stands' },
    weaknesses: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          area: { type: 'STRING', description: 'Topic or skill, e.g. "Graphs" or "Medium/Hard problems"' },
          severity: { type: 'STRING', enum: ['High', 'Medium', 'Low'] },
          evidence: { type: 'STRING', description: 'Specific numbers from the data that show this weakness' },
          impact: { type: 'STRING', description: 'Why it matters for interviews/contests' },
          fix: { type: 'STRING', description: 'Concrete way to improve' },
          practice: { type: 'ARRAY', items: { type: 'STRING' }, description: '2-3 slugs from CANDIDATE PROBLEMS' },
        },
        required: ['area', 'severity', 'evidence', 'impact', 'fix', 'practice'],
      },
    },
    strengths: { type: 'ARRAY', items: { type: 'STRING' }, description: '2-3 strengths backed by the data' },
    habits: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          observation: { type: 'STRING' },
          suggestion: { type: 'STRING' },
        },
        required: ['observation', 'suggestion'],
      },
    },
    plan: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day: { type: 'STRING', description: '"Day 1" ... "Day 7"' },
          focus: { type: 'STRING' },
          problems: { type: 'ARRAY', items: { type: 'STRING' }, description: '1-2 slugs from CANDIDATE PROBLEMS' },
        },
        required: ['day', 'focus', 'problems'],
      },
    },
  },
  required: ['headline', 'summary', 'weaknesses', 'strengths', 'habits', 'plan'],
};

export function buildCoachPrompt(input: CoachInput, candidates: CoachProblem[]): string {
  const profile = buildCoachProfile(input);
  const list = candidates.map((c) => `${c.id} | ${c.difficulty} | ${c.category}`).join('\n');
  return `STUDENT DATA (JSON):\n${JSON.stringify(profile)}\n\nCANDIDATE PROBLEMS (slug | difficulty | group), unsolved by this student:\n${list || '(none: the student has solved all of NeetCode 150)'}`;
}

// ---------------------------------------------------------------------------------------------
// Validation of the model's answer
// ---------------------------------------------------------------------------------------------

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function pickProblems(slugs: unknown, byId: Map<string, CoachProblem>, limit: number, used?: Set<string>): CoachProblem[] {
  if (!Array.isArray(slugs)) return [];
  const out: CoachProblem[] = [];
  for (const s of slugs) {
    if (typeof s !== 'string') continue;
    const p = byId.get(s.trim().toLowerCase());
    if (p && !out.includes(p)) {
      out.push(p);
      used?.add(p.id);
    }
    if (out.length >= limit) break;
  }
  return out;
}

/** Best candidates for a free-text area ("Graphs", "dynamic programming", ...), easiest first. */
function problemsForArea(area: string, candidates: CoachProblem[], limit: number, avoid: Set<string>): CoachProblem[] {
  const a = area.toLowerCase();
  const keys: [RegExp, string[]][] = [
    [/graph|bfs|dfs|island|topolog/, ['Graphs', 'Advanced Graphs']],
    [/dynamic|\bdp\b|memo|knapsack/, ['1-D Dynamic Programming', '2-D Dynamic Programming']],
    [/tree|bst/, ['Trees']],
    [/trie|prefix/, ['Tries']],
    [/heap|priority|top.?k/, ['Heap / Priority Queue']],
    [/backtrack|permutation|subset|combination/, ['Backtracking']],
    [/binary search/, ['Binary Search']],
    [/sliding|window|substring/, ['Sliding Window']],
    [/two pointer|pointer/, ['Two Pointers']],
    [/stack|monotonic/, ['Stack']],
    [/linked/, ['Linked List']],
    [/interval|meeting/, ['Intervals']],
    [/greedy/, ['Greedy']],
    [/bit|xor/, ['Bit Manipulation']],
    [/math|matrix|geometry/, ['Math & Geometry']],
    [/array|hash|string/, ['Arrays & Hashing']],
  ];
  const groups = keys.find(([re]) => re.test(a))?.[1];
  const order = { Easy: 0, Medium: 1, Hard: 2 };
  const pool = candidates
    .filter((c) => !avoid.has(c.id) && (groups ? groups.includes(c.category) : /medium|hard|difficult/.test(a) ? c.difficulty !== 'Easy' : false))
    .sort((x, y) => order[x.difficulty] - order[y.difficulty]);
  return pool.slice(0, limit);
}

export function coerceCoachReport(
  raw: Record<string, unknown>,
  candidates: CoachProblem[],
  meta: { model: string; totalSolved: number; lastSyncedAt: string | null }
): CoachReport {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const used = new Set<string>();

  const weaknesses: CoachWeakness[] = (Array.isArray(raw.weaknesses) ? raw.weaknesses : [])
    .filter((w): w is Record<string, unknown> => !!w && typeof w === 'object')
    .slice(0, 4)
    .map((w) => {
      const area = str(w.area, 60) || 'Focus area';
      let practice = pickProblems(w.practice, byId, 3, used);
      if (practice.length === 0) {
        practice = problemsForArea(area, candidates, 2, used);
        practice.forEach((p) => used.add(p.id));
      }
      const severity: CoachWeakness['severity'] =
        w.severity === 'High' || w.severity === 'Medium' || w.severity === 'Low' ? w.severity : 'Medium';
      const weakness: CoachWeakness = { area, severity, evidence: str(w.evidence, 240), impact: str(w.impact, 240), fix: str(w.fix, 280), practice };
      return weakness;
    })
    .filter((w) => w.evidence);

  const plan = (Array.isArray(raw.plan) ? raw.plan : [])
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
    .slice(0, 7)
    .map((d, i) => ({
      day: str(d.day, 12) || `Day ${i + 1}`,
      focus: str(d.focus, 120),
      problems: pickProblems(d.problems, byId, 2),
    }))
    .filter((d) => d.focus);

  const habits = (Array.isArray(raw.habits) ? raw.habits : [])
    .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object')
    .slice(0, 3)
    .map((h) => ({ observation: str(h.observation, 200), suggestion: str(h.suggestion, 220) }))
    .filter((h) => h.observation && h.suggestion);

  const strengths = (Array.isArray(raw.strengths) ? raw.strengths : [])
    .map((s) => str(s, 180))
    .filter(Boolean)
    .slice(0, 3);

  return {
    headline: str(raw.headline, 200) || 'Here is where to focus next.',
    summary: str(raw.summary, 600),
    weaknesses,
    strengths,
    habits,
    plan,
    source: 'ai',
    model: meta.model,
    generatedAt: new Date().toISOString(),
    basedOn: { totalSolved: meta.totalSolved, lastSyncedAt: meta.lastSyncedAt },
  };
}

// ---------------------------------------------------------------------------------------------
// Rule-based fallback (no AI)
// ---------------------------------------------------------------------------------------------

export function heuristicCoachReport(input: CoachInput, candidates: CoachProblem[]): CoachReport {
  const { stats, sheet } = input;
  const act = activity(stats);
  const used = new Set<string>();
  const weaknesses: CoachWeakness[] = [];

  // 1. NeetCode 150 groups with the lowest coverage, weighted by how much they matter
  const groups = (sheet?.categories || [])
    .map((c) => ({ ...c, ratio: c.total ? c.solved / c.total : 1, weight: CATEGORY_WEIGHT[c.category] ?? 0.5 }))
    .filter((c) => c.ratio < 0.5)
    .sort((a, b) => a.ratio * (2 - a.weight) - b.ratio * (2 - b.weight) || b.weight - a.weight);
  for (const g of groups.slice(0, 3)) {
    const advice = CATEGORY_ADVICE[g.category] || { impact: 'A common interview topic.', fix: 'Start with the easiest problems in this group.' };
    const practice = problemsForArea(g.category, candidates, 3, used);
    practice.forEach((p) => used.add(p.id));
    weaknesses.push({
      area: g.category,
      severity: g.ratio === 0 && g.weight >= 0.8 ? 'High' : g.ratio < 0.25 ? 'Medium' : 'Low',
      evidence: `${g.solved} of ${g.total} ${g.category} problems in NeetCode 150 solved.`,
      impact: advice.impact,
      fix: advice.fix,
      practice,
    });
  }

  // 2. Difficulty mix
  const { easy, medium, hard } = stats.difficultyBreakdown;
  const graded = easy + medium + hard;
  const mhShare = graded > 0 ? Math.round(((medium + hard) / graded) * 100) : 0;
  if (graded >= 10 && mhShare < 40) {
    const practice = problemsForArea('medium', candidates, 2, used);
    practice.forEach((p) => used.add(p.id));
    weaknesses.unshift({
      area: 'Medium/Hard problems',
      severity: mhShare < 25 ? 'High' : 'Medium',
      evidence: `Only ${mhShare}% of your graded solves are Medium or Hard (${medium} medium, ${hard} hard, ${easy} easy).`,
      impact: 'Most interview rounds are Medium; Easy-heavy practice leaves a gap under time pressure.',
      fix: 'Make at least two of every three problems Medium, and time-box them to 35 minutes.',
      practice,
    });
  }

  const habits: CoachReport['habits'] = [];
  if (act.activeDaysLast30 < 10) {
    habits.push({
      observation: `You were active on ${act.activeDaysLast30} of the last 30 days.`,
      suggestion: 'Short, regular sessions beat weekend marathons: aim for 4-5 days a week, even 1 problem a day.',
    });
  }
  if (stats.ratingHistory.length === 0) {
    habits.push({
      observation: 'No rated contests in your synced history yet.',
      suggestion: 'Try one Codeforces Div. 3/4 or a LeetCode Weekly Contest to practise solving under a timer.',
    });
  }

  const strengths = (sheet?.categories || [])
    .filter((c) => c.total > 0 && c.solved / c.total >= 0.5)
    .sort((a, b) => b.solved / b.total - a.solved / a.total)
    .slice(0, 3)
    .map((c) => `${c.category}: ${c.solved} of ${c.total} NeetCode 150 problems solved.`);
  if (strengths.length === 0) {
    for (const t of stats.strengths.slice(0, 2)) strengths.push(`${t.tag}: ${t.count} problems solved.`);
  }

  // 7-day plan rotating through the weak groups
  const focusAreas = weaknesses.length ? weaknesses : [{ area: 'Arrays & Hashing', practice: problemsForArea('array', candidates, 3, used) } as CoachWeakness];
  const plan: CoachReport['plan'] = [];
  for (let i = 0; i < 6; i++) {
    const w = focusAreas[i % focusAreas.length];
    const extra = problemsForArea(w.area, candidates, 1, used);
    extra.forEach((p) => used.add(p.id));
    const problems = [w.practice[Math.floor(i / focusAreas.length)], ...extra].filter((p): p is CoachProblem => !!p).slice(0, 2);
    plan.push({ day: `Day ${i + 1}`, focus: w.area, problems });
  }
  plan.push({ day: 'Day 7', focus: 'Review the week: re-solve one problem from memory, or join a contest', problems: [] });

  const top = weaknesses[0];
  return {
    headline: top ? `Your biggest gap right now: ${top.area}.` : 'Solid coverage so far: keep raising the difficulty.',
    summary: `${stats.totalSolved} problems solved across ${stats.accounts.length} platform${stats.accounts.length === 1 ? '' : 's'}${
      act.newProblemsSolvedLast30 !== null ? `, ${act.newProblemsSolvedLast30} of them in the last 30 days` : ''
    }. ${
      top ? `Closing the gaps below will lift both interview readiness and contest results.` : 'Mix in harder problems and timed practice next.'
    }`,
    weaknesses: weaknesses.slice(0, 4),
    strengths,
    habits,
    plan,
    source: 'estimate',
    generatedAt: new Date().toISOString(),
    basedOn: { totalSolved: stats.totalSolved, lastSyncedAt: newestSync(stats) },
  };
}

export { newestSync };
