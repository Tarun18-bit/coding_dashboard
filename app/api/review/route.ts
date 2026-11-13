import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ReviewResult, FollowUpQuestion } from '@/lib/ai-reviewer';
import { consumeDailyQuota, quotaMessage } from '@/lib/usage';
import { generateJson } from '@/lib/gemini';

/**
 * AI code review powered by the Gemini API free tier (see lib/gemini.ts for model fallback).
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (optional override)
 */

export const maxDuration = 60;

// Tried in order; a model that no longer exists (404) falls through to the next
const MAX_CODE_CHARS = 20_000;
const PER_USER_COOLDOWN_MS = 5_000;
const lastReviewByUser = new Map<string, number>();

const VERDICTS: ReviewResult['verdict'][] = ['Optimal', 'Suboptimal', 'Needs Optimization', 'Brute Force'];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    timeComplexity: { type: 'STRING', description: 'Big-O time, e.g. O(N log N)' },
    timeExplanation: { type: 'STRING' },
    spaceComplexity: { type: 'STRING', description: 'Big-O auxiliary space, e.g. O(N)' },
    spaceExplanation: { type: 'STRING' },
    qualityScore: { type: 'INTEGER', description: '0-100 overall interview-readiness of this solution' },
    verdict: { type: 'STRING', enum: VERDICTS },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    bottlenecks: { type: 'ARRAY', items: { type: 'STRING' } },
    edgeCasesToWatch: { type: 'ARRAY', items: { type: 'STRING' } },
    optimizedCode: { type: 'STRING', description: 'Improved full solution in the same language' },
    optimizationSummary: { type: 'STRING' },
    followUpQuestions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          interviewerIntent: { type: 'STRING' },
          suggestedApproach: { type: 'STRING' },
        },
        required: ['question', 'interviewerIntent', 'suggestedApproach'],
      },
    },
  },
  required: [
    'timeComplexity',
    'timeExplanation',
    'spaceComplexity',
    'spaceExplanation',
    'qualityScore',
    'verdict',
    'strengths',
    'bottlenecks',
    'edgeCasesToWatch',
    'optimizedCode',
    'optimizationSummary',
    'followUpQuestions',
  ],
};

const SYSTEM_PROMPT = `You are a senior software engineer conducting a coding interview review.
Analyze the candidate's solution precisely:
- Derive the actual time and auxiliary space complexity of THIS code (not of the ideal solution), with a one or two sentence justification each.
- verdict: "Optimal" if it matches the best known complexity for the problem, "Suboptimal" if close but improvable, "Needs Optimization" if a clearly better approach exists, "Brute Force" for exhaustive approaches.
- qualityScore: 0-100 considering correctness, complexity, readability and edge-case handling. Incorrect code must score below 50.
- strengths, bottlenecks (bugs, inefficiencies, style issues) and edgeCasesToWatch: 2-5 short items each.
- optimizedCode: a complete, correct, idiomatic solution in the same language. If the code is already optimal, return a cleaned-up version.
- followUpQuestions: exactly 3 realistic interviewer follow-ups for this problem, each with the interviewer's intent and a concise suggested approach.
If the problem is not stated, infer it from the code. Be concise and concrete.`;

function asStringArray(v: unknown, max = 8): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max) : [];
}

function coerceReview(raw: Record<string, unknown>): ReviewResult {
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
  const score = Math.round(Number(raw.qualityScore));
  const followUps: FollowUpQuestion[] = Array.isArray(raw.followUpQuestions)
    ? (raw.followUpQuestions as Record<string, unknown>[])
        .filter((q) => q && typeof q.question === 'string')
        .slice(0, 5)
        .map((q) => ({
          question: str(q.question),
          interviewerIntent: str(q.interviewerIntent),
          suggestedApproach: str(q.suggestedApproach),
        }))
    : [];
  return {
    timeComplexity: str(raw.timeComplexity, 'Unknown'),
    timeExplanation: str(raw.timeExplanation),
    spaceComplexity: str(raw.spaceComplexity, 'Unknown'),
    spaceExplanation: str(raw.spaceExplanation),
    qualityScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50,
    verdict: VERDICTS.includes(raw.verdict as ReviewResult['verdict'])
      ? (raw.verdict as ReviewResult['verdict'])
      : 'Suboptimal',
    strengths: asStringArray(raw.strengths),
    bottlenecks: asStringArray(raw.bottlenecks),
    edgeCasesToWatch: asStringArray(raw.edgeCasesToWatch),
    optimizedCode: str(raw.optimizedCode),
    optimizationSummary: str(raw.optimizationSummary),
    followUpQuestions: followUps,
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Log in to get an AI review.' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'AI review is not configured (GEMINI_API_KEY missing).' }, { status: 503 });
  }

  const now = Date.now();
  if (now - (lastReviewByUser.get(user.id) ?? 0) < PER_USER_COOLDOWN_MS) {
    return NextResponse.json({ success: false, error: 'Please wait a few seconds between reviews.' }, { status: 429 });
  }
  lastReviewByUser.set(user.id, now);

  let body: { code?: string; language?: string; problem?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
  const code = typeof body.code === 'string' ? body.code : '';
  if (!code.trim() || code.length > MAX_CODE_CHARS) {
    return NextResponse.json({ success: false, error: `Code must be 1-${MAX_CODE_CHARS} characters.` }, { status: 400 });
  }
  const language = typeof body.language === 'string' ? body.language.slice(0, 30) : 'unknown';
  const problem = typeof body.problem === 'string' ? body.problem.slice(0, 200) : '';

  const quota = await consumeDailyQuota(user.id, 'ai_review');
  if (!quota.allowed) {
    return NextResponse.json({ success: false, error: quotaMessage('ai_review') }, { status: 429 });
  }

  const userPrompt = `${problem ? `Problem: ${problem}\n` : ''}Language: ${language}\n\nCandidate solution:\n\`\`\`${language}\n${code}\n\`\`\``;

  const answer = await generateJson({ systemPrompt: SYSTEM_PROMPT, userPrompt, responseSchema: RESPONSE_SCHEMA });
  if (answer.ok) {
    return NextResponse.json({ success: true, model: answer.model, result: coerceReview(answer.data) });
  }
  return NextResponse.json({ success: false, error: answer.error }, { status: answer.status });
}
