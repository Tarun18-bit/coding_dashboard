/**
 * Shared Gemini client for structured (JSON) answers on the free tier.
 *
 * The free tier's flagship model is often slow or overloaded, so requests are "hedged": the primary
 * model is asked first and, if it hasn't answered after a few seconds (or already failed), the much
 * faster Flash-Lite model is asked too. The first good answer wins and the other request is cancelled.
 *
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (optional primary model override)
 */

const MODEL_CANDIDATES = Array.from(
  new Set(
    [process.env.GEMINI_MODEL || 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(
      (m): m is string => !!m
    )
  )
);
/** If the primary model hasn't answered by then, also ask the next (faster) one. */
const HEDGE_AFTER_MS = 8_000;

export type GeminiJsonResult =
  | { ok: true; model: string; data: Record<string, unknown> }
  | { ok: false; status: number; error: string };

export interface GeminiJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  /** Gemini responseSchema (OpenAPI subset) the answer must follow */
  responseSchema: Record<string, unknown>;
  temperature?: number;
  /** Total time budget across all attempts (Vercel stops functions at 60s) */
  budgetMs?: number;
}

type Attempt =
  | { kind: 'ok'; model: string; data: Record<string, unknown> }
  | { kind: 'quota' }
  | { kind: 'fail'; status: number; timedOut: boolean; message?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Keep thinking short: these tasks need structure more than deep reasoning, and speed matters. */
function thinkingConfigFor(model: string): Record<string, unknown> {
  if (/2\.5/.test(model)) return { thinkingBudget: 0 };
  return { thinkingLevel: model.includes('lite') ? 'minimal' : 'low' };
}

/** One model, at most two calls (a retry on 5xx, or once without thinking settings on 400). Never throws. */
async function tryModel(
  model: string,
  apiKey: string,
  req: GeminiJsonRequest,
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
        temperature: req.temperature ?? 0.2,
        responseMimeType: 'application/json',
        responseSchema: req.responseSchema,
      };
      if (useThinkingConfig) generationConfig.thinkingConfig = thinkingConfigFor(model);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
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
        console.warn('[Gemini]', model, 'returned', res.status, attempt === 0 ? '(retrying)' : '(giving up)');
        last = { kind: 'fail', status: res.status, timedOut: false };
        if (attempt === 0) await sleep(800);
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        console.error('[Gemini] error', model, res.status, text.slice(0, 300));
        return { kind: 'fail', status: res.status, timedOut: false, message: `AI service error (HTTP ${res.status})` };
      }

      const body = await res.json();
      const text: string = (body?.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string; thought?: boolean }) => (p.thought ? '' : p.text ?? ''))
        .join('');
      try {
        const data = JSON.parse(text);
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not an object');
        return { kind: 'ok', model, data: data as Record<string, unknown> };
      } catch {
        console.error('[Gemini] Unparseable output', model, text.slice(0, 300));
        return { kind: 'fail', status: 502, timedOut: false };
      }
    } catch (error) {
      if (cancel.aborted) return last; // another model already answered
      const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      console.error('[Gemini] Request', timedOut ? 'timed out' : 'failed', model, error);
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

/** Asks Gemini for a JSON answer that follows `responseSchema`. Never throws. */
export async function generateJson(req: GeminiJsonRequest): Promise<GeminiJsonResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, status: 503, error: 'AI is not configured (GEMINI_API_KEY missing).' };

  const deadline = Date.now() + (req.budgetMs ?? 50_000);
  const cancel = new AbortController();
  const [primary, hedge, ...fallbacks] = MODEL_CANDIDATES;
  const settled: Attempt[] = [];
  const track = (p: Promise<Attempt>) =>
    p.then((a) => {
      settled.push(a);
      return a;
    });

  const primaryAttempt = track(tryModel(primary, apiKey, req, deadline, cancel.signal, 30_000));
  // Hedge: if the primary is slow (or already failed), also ask the faster model
  const hedgeAttempt: Promise<Attempt | null> = hedge
    ? Promise.race([primaryAttempt, sleep(HEDGE_AFTER_MS).then(() => null)]).then((early) =>
        early?.kind === 'ok' ? null : track(tryModel(hedge, apiKey, req, deadline, cancel.signal, 25_000))
      )
    : Promise.resolve(null);

  let winner = await firstSuccess([primaryAttempt, hedgeAttempt]);
  // Neither answered: try the remaining models one by one while time is left
  for (const model of fallbacks) {
    if (winner || deadline - Date.now() < 6_000) break;
    const a = await track(tryModel(model, apiKey, req, deadline, cancel.signal, 20_000));
    if (a.kind === 'ok') winner = a;
  }
  cancel.abort(); // stop whichever request is still running

  if (winner?.kind === 'ok') return { ok: true, model: winner.model, data: winner.data };

  const failures = settled.filter((a): a is Extract<Attempt, { kind: 'fail' }> => a.kind === 'fail');
  if (settled.some((a) => a.kind === 'quota') && failures.every((f) => f.status === 404 || f.status === 0)) {
    return { ok: false, status: 429, error: "Today's free AI quota is used up. Try again later." };
  }
  const explicit = failures.find((f) => f.message);
  if (explicit?.message) return { ok: false, status: 502, error: explicit.message };
  if (failures.some((f) => f.timedOut)) {
    return { ok: false, status: 504, error: 'Gemini took too long to answer (free tier is busy). Please try again in a minute.' };
  }
  return {
    ok: false,
    status: 503,
    error: failures.some((f) => f.status >= 500)
      ? 'Gemini is overloaded right now (free tier). Please try again in a minute.'
      : 'No available Gemini model found. Set GEMINI_MODEL.',
  };
}
