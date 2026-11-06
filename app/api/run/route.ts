import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_QUESTIONS } from '@/lib/mock-interview';
import { buildCppProgram, buildJavaProgram, gradeOutput, RunnableTest } from '@/lib/code-runner/harness';

/**
 * Runs C++ / Java mock-interview solutions on Judge0 CE.
 * Python and TypeScript run in the browser instead and never reach this route.
 *
 * - With JUDGE0_API_KEY: uses the RapidAPI-hosted Judge0 (JUDGE0_API_HOST, default judge0-ce.p.rapidapi.com)
 * - Without it: uses Judge0's free public instance (JUDGE0_URL, default https://ce.judge0.com), no key or card needed
 */

const LANGUAGE_IDS: Record<'cpp' | 'java', number> = {
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
};
const MAX_SOURCE_CHARS = 50_000;
const PER_USER_COOLDOWN_MS = 5_000;
const lastRunByUser = new Map<string, number>();

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const unb64 = (s: string | null | undefined) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

interface Judge0Result {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: { id: number; description: string };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Log in to run C++ and Java code.' }, { status: 401 });
  }

  const apiKey = process.env.JUDGE0_API_KEY;

  const now = Date.now();
  if (now - (lastRunByUser.get(user.id) ?? 0) < PER_USER_COOLDOWN_MS) {
    return NextResponse.json({ success: false, error: 'Please wait a few seconds between runs.' }, { status: 429 });
  }
  lastRunByUser.set(user.id, now);

  let body: { questionId?: string; language?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const question = MOCK_QUESTIONS.find((q) => q.id === body.questionId);
  const language = body.language === 'cpp' || body.language === 'java' ? body.language : null;
  const code = typeof body.code === 'string' ? body.code : '';
  if (!question || !language || !code.trim() || code.length > MAX_SOURCE_CHARS) {
    return NextResponse.json({ success: false, error: 'Invalid question, language or code' }, { status: 400 });
  }

  const tests: RunnableTest[] = question.testCases.map((t) => ({
    id: t.id,
    args: t.args,
    ops: t.ops,
    expected: t.expected,
  }));
  const program =
    language === 'cpp'
      ? buildCppProgram(code, question.runner, tests)
      : buildJavaProgram(code, question.runner, tests);

  const rapidHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
  const baseUrl = apiKey
    ? `https://${rapidHost}`
    : (process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');
  const headers: Record<string, string> = apiKey
    ? { 'Content-Type': 'application/json', 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': rapidHost }
    : { 'Content-Type': 'application/json' };
  const fields = 'token,stdout,stderr,compile_output,message,status';

  try {
    const submitRes = await fetch(`${baseUrl}/submissions?base64_encoded=true&wait=true&fields=${fields}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: LANGUAGE_IDS[language],
        source_code: b64(program),
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      }),
    });

    if (submitRes.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: apiKey
            ? "Today's free C++/Java run limit is used up. Python and TypeScript still work (they run in your browser)."
            : 'The free C++/Java runner is busy. Try again in a minute; Python and TypeScript still work.',
        },
        { status: 429 }
      );
    }
    if (!submitRes.ok) {
      const text = await submitRes.text();
      console.error('[Run] Judge0 submit failed', submitRes.status, text.slice(0, 300));
      return NextResponse.json({ success: false, error: `Code runner error (HTTP ${submitRes.status})` }, { status: 502 });
    }

    let result = (await submitRes.json()) as Judge0Result;

    // If Judge0 returned before finishing (status In Queue / Processing), poll by token
    for (let i = 0; i < 12 && result.token && (!result.status || result.status.id <= 2); i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(`${baseUrl}/submissions/${result.token}?base64_encoded=true&fields=${fields}`, {
        headers,
      });
      if (!pollRes.ok) break;
      result = (await pollRes.json()) as Judge0Result;
    }

    const statusId = result.status?.id ?? 0;
    const statusText = result.status?.description ?? 'Unknown';

    if (statusId <= 2) {
      return NextResponse.json({ success: false, error: 'The code runner is busy. Try again in a moment.' }, { status: 504 });
    }
    if (statusId === 6) {
      // Compilation Error
      return NextResponse.json({
        success: true,
        compileError: unb64(result.compile_output).slice(0, 3000) || 'Compilation failed',
        outcomes: [],
        consoleOutput: '',
      });
    }

    const stdout = unb64(result.stdout);
    const timedOut = statusId === 5;
    const { outcomes, consoleOutput } = gradeOutput(
      stdout,
      question.runner,
      tests,
      timedOut ? 'Time Limit Exceeded' : 'Runtime Error',
      timedOut ? 'Time limit exceeded' : `Program stopped: ${statusText}`
    );
    const stderr = unb64(result.stderr).slice(0, 2000);

    return NextResponse.json({
      success: true,
      outcomes,
      consoleOutput: [consoleOutput, stderr].filter(Boolean).join('\n'),
      runtimeStatus: statusId === 3 ? undefined : statusText,
    });
  } catch (error) {
    console.error('[Run] Judge0 request failed', error);
    return NextResponse.json({ success: false, error: 'Could not reach the code runner' }, { status: 502 });
  }
}
