import { CURATED_PROBLEMS, SheetProblem } from './sheets-data';
import { supabaseAdmin } from '@/lib/db';

export interface DailyWorkoutProblem extends SheetProblem {
  tier: 'Warmup' | 'Core Challenge' | 'Boss Challenge';
  estimatedMinutes: number;
  isSolved: boolean;
  solvedToday: boolean;
}

export interface DailyWorkout {
  dateStr: string; // YYYY-MM-DD
  todayTargetTopic: string;
  problems: DailyWorkoutProblem[];
  isCompletedToday: boolean;
  streakProtected: boolean;
}

// Simple deterministic hash based on date string and seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const potdCache = new Map<string, { timestamp: number; data: DailyWorkout }>();
const POTD_CACHE_TTL_MS = 60 * 1000;

export function clearPotdCache(userId?: string) {
  if (userId) {
    potdCache.delete(userId);
  } else {
    potdCache.clear();
  }
}

export async function getDailyWorkout(
  userId: string,
  userWeaknesses: { tag: string; reason?: string }[] = []
): Promise<DailyWorkout> {
  const cached = potdCache.get(userId);
  if (cached && Date.now() - cached.timestamp < POTD_CACHE_TTL_MS) {
    return cached.data;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD in UTC

  // 1. Get user solved problems
  const { data: accounts } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('user_id', userId);

  const accountIds = (accounts || []).map((a) => a.id);

  const allSolvedIds = new Set<string>();
  const solvedTodayIds = new Set<string>();

  if (accountIds.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from('submissions')
      .select('problem_id, title, submitted_at, verdict')
      .in('account_id', accountIds)
      .eq('verdict', 'AC');

    if (subs) {
      for (const s of subs) {
        if (s.problem_id) {
          const normId = s.problem_id.toLowerCase().trim();
          allSolvedIds.add(normId);

          const subDate = new Date(s.submitted_at).toISOString().split('T')[0];
          if (subDate === today) {
            solvedTodayIds.add(normId);
          }
        }
      }
    }
  }

  // 2. Pick today's target topic
  const focusTopics =
    userWeaknesses.length > 0
      ? userWeaknesses.map((w) => w.tag)
      : ['Dynamic Programming', 'Graphs', 'Trees', 'Binary Search', 'Sliding Window', 'Two Pointers'];

  const topicSeed = seededRandom(`${today}-topic`);
  const todayTargetTopic = focusTopics[topicSeed % focusTopics.length] || 'Dynamic Programming';

  // 3. Filter problems by difficulty
  const easyPool = CURATED_PROBLEMS.filter((p) => p.difficulty === 'Easy');
  const medPool = CURATED_PROBLEMS.filter((p) => p.difficulty === 'Medium');
  const hardPool = CURATED_PROBLEMS.filter((p) => p.difficulty === 'Hard');

  // Try matching today's topic for medium problem
  const medTopicPool = medPool.filter(
    (p) => p.category.toLowerCase().includes(todayTargetTopic.toLowerCase())
  );
  const selectedMedPool = medTopicPool.length > 0 ? medTopicPool : medPool;

  const easyIdx = seededRandom(`${today}-easy`) % easyPool.length;
  const medIdx = seededRandom(`${today}-med`) % selectedMedPool.length;
  const hardIdx = seededRandom(`${today}-hard`) % hardPool.length;

  const warmup = easyPool[easyIdx];
  const core = selectedMedPool[medIdx];
  const boss = hardPool[hardIdx];

  const workoutProblems: DailyWorkoutProblem[] = [
    {
      ...warmup,
      tier: 'Warmup',
      estimatedMinutes: 15,
      isSolved: allSolvedIds.has(warmup.id.toLowerCase().trim()),
      solvedToday: solvedTodayIds.has(warmup.id.toLowerCase().trim()),
    },
    {
      ...core,
      tier: 'Core Challenge',
      estimatedMinutes: 30,
      isSolved: allSolvedIds.has(core.id.toLowerCase().trim()),
      solvedToday: solvedTodayIds.has(core.id.toLowerCase().trim()),
    },
    {
      ...boss,
      tier: 'Boss Challenge',
      estimatedMinutes: 45,
      isSolved: allSolvedIds.has(boss.id.toLowerCase().trim()),
      solvedToday: solvedTodayIds.has(boss.id.toLowerCase().trim()),
    },
  ];

  const solvedTodayCount = workoutProblems.filter((p) => p.solvedToday || p.isSolved).length;
  const isCompletedToday = solvedTodayCount === workoutProblems.length;
  const streakProtected = solvedTodayCount > 0;

  const result: DailyWorkout = {
    dateStr: today,
    todayTargetTopic,
    problems: workoutProblems,
    isCompletedToday,
    streakProtected,
  };

  potdCache.set(userId, { timestamp: Date.now(), data: result });
  return result;
}
