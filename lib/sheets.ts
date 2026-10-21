import { supabaseAdmin } from '@/lib/db';
import { CURATED_PROBLEMS, SheetProblem } from './sheets-data';

export type SheetType = 'blind75' | 'neetcode150' | 'striver';

export interface EnrichedSheetProblem extends SheetProblem {
  isSolved: boolean;
  solvedAt?: string;
}

export interface SheetProgress {
  sheetType: SheetType;
  totalProblems: number;
  solvedProblems: number;
  percent: number;
  easy: { total: number; solved: number };
  medium: { total: number; solved: number };
  hard: { total: number; solved: number };
  categories: {
    category: string;
    total: number;
    solved: number;
    problems: EnrichedSheetProblem[];
  }[];
}

const sheetsCache = new Map<string, { timestamp: number; data: SheetProgress }>();
const SHEETS_CACHE_TTL_MS = 60 * 1000;

export async function getUserSheetProgress(
  userId: string,
  sheetType: SheetType = 'blind75',
  forceRefresh = false
): Promise<SheetProgress> {
  const cacheKey = `${userId}:${sheetType}`;
  if (!forceRefresh) {
    const cached = sheetsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SHEETS_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 1. Get all accounts for this user
  const { data: accounts } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('user_id', userId);

  const accountIds = (accounts || []).map((a) => a.id);

  // 2. Fetch all AC submissions
  let solvedProblemIds = new Set<string>();
  let solvedTitles = new Set<string>();

  if (accountIds.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from('submissions')
      .select('problem_id, title, verdict, submitted_at')
      .in('account_id', accountIds)
      .eq('verdict', 'AC');

    if (subs) {
      for (const s of subs) {
        if (s.problem_id) {
          solvedProblemIds.add(s.problem_id.toLowerCase().trim());
        }
        if (s.title) {
          const normTitle = s.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          solvedTitles.add(normTitle);
        }
      }
    }
  }

  // 3. Filter problems for requested sheet
  const filtered = CURATED_PROBLEMS.filter((p) => p.sheets.includes(sheetType));

  // 4. Enrich each problem
  const enriched: EnrichedSheetProblem[] = filtered.map((p) => {
    const normId = p.id.toLowerCase().trim();
    const normTitle = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isSolved = solvedProblemIds.has(normId) || solvedTitles.has(normTitle);
    return {
      ...p,
      isSolved,
    };
  });

  // 5. Compute stats
  const totalProblems = enriched.length;
  const solvedProblems = enriched.filter((p) => p.isSolved).length;
  const percent = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;

  const easyTotal = enriched.filter((p) => p.difficulty === 'Easy').length;
  const easySolved = enriched.filter((p) => p.difficulty === 'Easy' && p.isSolved).length;

  const medTotal = enriched.filter((p) => p.difficulty === 'Medium').length;
  const medSolved = enriched.filter((p) => p.difficulty === 'Medium' && p.isSolved).length;

  const hardTotal = enriched.filter((p) => p.difficulty === 'Hard').length;
  const hardSolved = enriched.filter((p) => p.difficulty === 'Hard' && p.isSolved).length;

  // Group by category
  const categoryMap = new Map<string, EnrichedSheetProblem[]>();
  for (const p of enriched) {
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, []);
    }
    categoryMap.get(p.category)!.push(p);
  }

  const categories = Array.from(categoryMap.entries()).map(([category, problems]) => ({
    category,
    total: problems.length,
    solved: problems.filter((p) => p.isSolved).length,
    problems,
  }));

  const result: SheetProgress = {
    sheetType,
    totalProblems,
    solvedProblems,
    percent,
    easy: { total: easyTotal, solved: easySolved },
    medium: { total: medTotal, solved: medSolved },
    hard: { total: hardTotal, solved: hardSolved },
    categories,
  };

  sheetsCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}
