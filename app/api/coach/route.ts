import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { getDashboardStats } from '@/lib/aggregate';
import { getUserSheetProgress } from '@/lib/sheets';
import { calculateCompanyReadiness } from '@/lib/company-readiness';
import { consumeDailyQuota, quotaMessage } from '@/lib/usage';
import { generateJson } from '@/lib/gemini';
import {
  COACH_SCHEMA,
  COACH_SYSTEM_PROMPT,
  buildCoachPrompt,
  candidateProblems,
  coerceCoachReport,
  heuristicCoachReport,
  newestSync,
  type CoachInput,
  type CoachReport,
} from '@/lib/coach';

/**
 * AI Coach: a Gemini-written analysis of the logged-in user's weak spots, with evidence from their
 * own stats and a 7-day plan of real (unsolved) NeetCode 150 problems. Falls back to a rule-based
 * report, clearly labelled, when Gemini is unavailable or the daily quota is used up.
 */

export const maxDuration = 60;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const COOLDOWN_MS = 10_000;
const reportCache = new Map<string, { at: number; fingerprint: string; report: CoachReport }>();
const lastRunByUser = new Map<string, number>();

export async function POST(req: NextRequest) {
  const user = await requireSessionUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Log in to get your AI coach report.' }, { status: 401 });
  }

  let refresh = false;
  try {
    refresh = !!(await req.json())?.refresh;
  } catch {
    // empty body: a normal request
  }

  const stats = await getDashboardStats(user.id);
  if (stats.accounts.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Link at least one platform (Add Platform) so the coach has data to analyse.' },
      { status: 400 }
    );
  }

  // Same data as last time on this server: reuse the report instead of spending quota
  const fingerprint = `${stats.totalSolved}:${newestSync(stats) ?? ''}`;
  const cached = reportCache.get(user.id);
  if (!refresh && cached && cached.fingerprint === fingerprint && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, report: cached.report, cached: true });
  }

  const now = Date.now();
  if (now - (lastRunByUser.get(user.id) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json({ success: false, error: 'Please wait a few seconds before asking again.' }, { status: 429 });
  }
  lastRunByUser.set(user.id, now);

  const sheet = await getUserSheetProgress(user.id, 'neetcode150').catch(() => null);
  const input: CoachInput = {
    stats,
    sheet,
    readiness: calculateCompanyReadiness(stats.allTopicCounts || stats.topicBreakdown, stats.totalSolved, stats.difficultyBreakdown),
  };
  const candidates = candidateProblems(sheet);

  const quota = await consumeDailyQuota(user.id, 'ai_coach');
  if (!quota.allowed) {
    // Still useful: the rule-based report costs nothing
    return NextResponse.json({
      success: true,
      report: heuristicCoachReport(input, candidates),
      notice: `${quotaMessage('ai_coach')} Showing a quick rule-based analysis instead.`,
    });
  }

  const answer = await generateJson({
    systemPrompt: COACH_SYSTEM_PROMPT,
    userPrompt: buildCoachPrompt(input, candidates),
    responseSchema: COACH_SCHEMA,
    temperature: 0.4,
    budgetMs: 48_000,
  });

  let report: CoachReport;
  let notice: string | undefined;
  if (answer.ok) {
    report = coerceCoachReport(answer.data, candidates, {
      model: answer.model,
      totalSolved: stats.totalSolved,
      lastSyncedAt: newestSync(stats),
    });
    // A reply with no usable weaknesses is no better than the rules: use those instead
    if (report.weaknesses.length === 0) {
      report = heuristicCoachReport(input, candidates);
      notice = 'The AI answer was incomplete, so this is a quick rule-based analysis.';
    }
  } else {
    report = heuristicCoachReport(input, candidates);
    notice = `${answer.error} Showing a quick rule-based analysis instead.`;
  }

  if (report.source === 'ai') reportCache.set(user.id, { at: Date.now(), fingerprint, report });
  return NextResponse.json({ success: true, report, ...(notice ? { notice } : {}) });
}
