import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ReviewResult, FollowUpQuestion } from '@/lib/ai-reviewer';
import { consumeDailyQuota, quotaMessage } from '@/lib/usage';

/**
 * AI code review powered by the Gemini API free tier.
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (optional override)
 */

export const maxDuration = 60;

// Tried in order; a model that no longer exists (404) falls through to the next
// Primary model (env override or the current Flash), then the much faster Flash-Lite, then fallbacks.
// Duplicates are removed so an env override doesn't get tried twice.
const MODEL_CANDIDATES = Array.from(
  new Set(
    [process.env.GEMINI_MODEL || 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(
      (m): m is string => !!m
    )
  )
);
/** If the primary model hasn't answered by then, also ask the next (faster) one: first good answer wins. */
const HEDGE_AFTER_MS = 8_000;

/** Keep thinking short: reviews need structure more than deep reasoning, and speed matters. */
function thinkingConfigFor(model: string): Record<string, unknown> {
  if (/2\.5/.test(model)) return { thinkingBudget: 0 };
  return { thinkingLevel: model.includes('lite') ? 'minimal' : 'low' };
}
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

type Attempt =
  | { kind: 'ok'; model: string; result: ReviewResult }
  | { kind: 'quota' }
  | { kind: 'fail'; status: number; timedOut: boolean; message?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** One model, at most two calls (a retry on 5xx, or once without thinking settings on 400). Never throws. */
async function tryModel(
  model: string,
  apiKey: string,
  userPrompt: string,
  deadline: number,
  cancel: AbortSignal,
  maxCallMs: number
): Promise<Attempt> {
  let useThinkingConfig = true;
  let last: Attempt = { kind: 'fail', status: 0, timedOut: false };
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 4_000 || cancel.aborted) return last;
    try {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      };
      if (useThinkingConfig) generationConfig.thinkingConfig = thinkingConfigFor(model);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig,
        }),
        signal: AbortSignal.any([cancel, AbortSignal.timeout(Math.min(maxCallMs, remaining))]),
      });

      if (res.status === 404) return { kind: 'fail', status: 404, timedOut: false }; // retired/renamed model
      if (res.status === 400 && useThinkingConfig) {
        useThinkingConfig = false; // this model rejects our thinking settings: retry with defaults
        continue;
      }
      if (res.status === 429) return { kind: 'quota' };
      if (res.status >= 500) {
        console.warn('[Review] Gemini', model, 'returned', res.status, attempt === 0 ? '(retrying)' : '(giving up)');
        last = { kind: 'fail', status: res.status, timedOut: false };
        if (attempt === 0) await sleep(800);
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        console.error('[Review] Gemini error', model, res.status, text.slice(0, 300));
        return { kind: 'fail', status: res.status, timedOut: false, message: `AI service error (HTTP ${res.status})` };
      }

      const data = await res.json();
      const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string; thought?: boolean }) => (p.thought ? '' : p.text ?? ''))
        .join('');
      try {
        return { kind: 'ok', model, result: coerceReview(JSON.parse(text)) };
      } catch {
        console.error('[Review] Unparseable Gemini output', model, text.slice(0, 300));
        return { kind: 'fail', status: 502, timedOut: false };
      }
    } catch (error) {
      if (cancel.aborted) return last; // another model already answered
      const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      console.error('[Review] Request', timedOut ? 'timed out' : 'failed', model, error);
      return { kind: 'fail', status: 504, timedOut };
    }
  }
  return last;
}

/** Resolves with the first successful attempt, or null once every attempt has finished without one. */
function firstSuccess(attempts: Promise<Attempt | null>[]): Promise<Attempt | null> {
  return new Promise((resolve) => {
    let pending = attempts.length;
    if (pending === 0) resolve(null);
    for (const p of attempts) {
      p.then((a) => {
        if (a?.kind === 'ok') resolve(a);
        else if (--pending === 0) resolve(null);
      });
    }
  });
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

  // Vercel stops the function at 60s, so every attempt shares one time budget
  const deadline = Date.now() + 50_000;
  const cancel = new AbortController();
  const [primary, hedge, ...fallbacks] = MODEL_CANDIDATES;
  const settled: Attempt[] = [];
  const track = (p: Promise<Attempt>) =>
    p.then((a) => {
      settled.push(a);
      return a;
    });

  const primaryAttempt = track(tryModel(primary, apiKey, userPrompt, deadline, cancel.signal, 30_000));
  // Hedge: if the primary is slow (or already failed), also ask the faster model
  const hedgeAttempt: Promise<Attempt | null> = hedge
    ? Promise.race([primaryAttempt, sleep(HEDGE_AFTER_MS).then(() => null)]).then((early) =>
        early?.kind === 'ok' ? null : track(tryModel(hedge, apiKey, userPrompt, deadline, cancel.signal, 25_000))
      )
    : Promise.resolve(null);

  let winner = await firstSuccess([primaryAttempt, hedgeAttempt]);
  // Neither answered: try the remaining models one by one while time is left
  for (const model of fallbacks) {
    if (winner || deadline - Date.now() < 6_000) break;
    const a = await track(tryModel(model, apiKey, userPrompt, deadline, cancel.signal, 20_000));
    if (a.kind === 'ok') winner = a;
  }
  cancel.abort(); // stop whichever request is still running

  if (winner?.kind === 'ok') {
    return NextResponse.json({ success: true, model: winner.model, result: winner.result });
  }

  const failures = settled.filter((a): a is Extract<Attempt, { kind: 'fail' }> => a.kind === 'fail');
  if (settled.some((a) => a.kind === 'quota') && failures.every((f) => f.status === 404 || f.status === 0)) {
    return NextResponse.json({ success: false, error: "Today's free AI review quota is used up. Try again later." }, { status: 429 });
  }
  const explicit = failures.find((f) => f.message);
  if (explicit?.message) {
    return NextResponse.json({ success: false, error: explicit.message }, { status: 502 });
  }
  if (failures.some((f) => f.timedOut)) {
    return NextResponse.json(
      { success: false, error: 'Gemini took too long to answer (free tier is busy). Please try again in a minute.' },
      { status: 504 }
    );
  }
  return NextResponse.json(
    {
      success: false,
      error: failures.some((f) => f.status >= 500)
        ? 'Gemini is overloaded right now (free tier). Please try again in a minute.'
        : 'No available Gemini model found. Set GEMINI_MODEL.',
    },
    { status: 503 }
  );
}
