'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MOCK_QUESTIONS,
  MockQuestion,
  MockHint,
  MockTestCase,
} from '@/lib/mock-interview';
import {
  buildPythonProgram,
  buildJsHarness,
  gradeOutput,
  RunnableTest,
  TestOutcome,
} from '@/lib/code-runner/harness';
import { runInBrowser } from '@/lib/code-runner/browser';

type TestResultRow = { id: number; input: string; expected: string; output: string; passed: boolean; status: string };
type Evaluation = { error: string; results: TestResultRow[]; console: string };
import {
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Award,
  ChevronRight,
  Code2,
  Lock,
  Eye,
  ArrowRight,
  ShieldCheck,
  Building2,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export const MockInterviewRoom: React.FC = () => {
  // Screen state: 'lobby' | 'active' | 'scorecard'
  const [screen, setScreen] = useState<'lobby' | 'active' | 'scorecard'>('lobby');

  // Configuration
  const [selectedCompany, setSelectedCompany] = useState<'Google' | 'Amazon' | 'Meta' | 'Microsoft'>('Google');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(45);
  const [currentQuestion, setCurrentQuestion] = useState<MockQuestion>(MOCK_QUESTIONS[0]);

  // Active state
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(45 * 60);
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [testResults, setTestResults] = useState<TestResultRow[]>([]);
  const [compileError, setCompileError] = useState<string>('');
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [runStatusText, setRunStatusText] = useState<string>('');
  // Cache of the last run so finishing the interview doesn't re-run unchanged code
  const lastRunRef = useRef<{ key: string; evaluation: Evaluation } | null>(null);
  // Timer plumbing: wall-clock deadline, a guard so the interview finishes exactly once,
  // and a ref to the latest finishInterview for the interval callback
  const deadlineRef = useRef<number>(0);
  const finishingRef = useRef<boolean>(false);
  const finishRef = useRef<() => void>(() => {});

  // Scorecard metrics
  const [score, setScore] = useState<number>(0);
  const [verdict, setVerdict] = useState<string>('Hire');
  const [timeTakenSeconds, setTimeTakenSeconds] = useState<number>(0);

  // Filter questions for the selected company
  const availableQuestions = MOCK_QUESTIONS.filter((q) => q.company === selectedCompany);

  const startInterview = (q?: MockQuestion) => {
    const questionToUse = q || availableQuestions[0] || MOCK_QUESTIONS[0];
    setCurrentQuestion(questionToUse);
    setCode(questionToUse.starterCode[language] || questionToUse.starterCode['python']);
    setSecondsLeft(timeLimitMinutes * 60);
    setUnlockedHints([]);
    setTestResults([]);
    setCompileError('');
    setConsoleOutput('');
    lastRunRef.current = null;
    finishingRef.current = false;
    deadlineRef.current = Date.now() + timeLimitMinutes * 60 * 1000;
    setScreen('active');
  };

  // Run the solution for real: Python/TypeScript in a browser worker, C++/Java on Judge0
  const evaluateSubmission = async (sourceCode: string, lang: string, question: MockQuestion): Promise<Evaluation> => {
    const starter = (question.starterCode[lang] || question.starterCode['python'] || '').trim();
    const trimmed = sourceCode.trim();
    const failAll = (status: string, output: string): TestResultRow[] =>
      question.testCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expected: tc.expectedOutput,
        output,
        passed: false,
        status,
      }));

    if (!trimmed || trimmed === starter) {
      return {
        error: 'Starter template was not modified. Implement the algorithm before running tests.',
        results: failAll('Unimplemented', 'None / Unimplemented'),
        console: '',
      };
    }

    const tests: RunnableTest[] = question.testCases.map((tc) => ({
      id: tc.id,
      args: tc.args,
      ops: tc.ops,
      expected: tc.expected,
    }));
    const toRows = (outcomes: TestOutcome[]): TestResultRow[] =>
      question.testCases.map((tc) => {
        const o = outcomes.find((x) => x.id === tc.id);
        return {
          id: tc.id,
          input: tc.input,
          expected: tc.expectedOutput,
          output: o?.output ?? 'Not run',
          passed: !!o?.passed,
          status: o?.status ?? 'Not Run',
        };
      });

    if (lang === 'python' || lang === 'typescript') {
      const onStatus = (st: 'loading' | 'running') =>
        setRunStatusText(
          st === 'loading'
            ? lang === 'python'
              ? 'Loading Python runtime (first run downloads it, ~10s)...'
              : 'Loading TypeScript compiler...'
            : 'Running tests...'
        );
      const run =
        lang === 'python'
          ? await runInBrowser({ language: 'python', program: buildPythonProgram(sourceCode, question.runner, tests) }, onStatus)
          : await runInBrowser(
              { language: 'typescript', userCode: sourceCode, harness: buildJsHarness(question.runner, tests) },
              onStatus
            );

      if (run.compileError) {
        return { error: run.compileError, results: failAll('Compile Error', 'Compile error'), console: '' };
      }
      const graded = gradeOutput(
        run.stdout,
        question.runner,
        tests,
        run.timedOut ? 'Time Limit Exceeded' : 'Runtime Error',
        run.timedOut ? 'Time limit exceeded (6s)' : run.fatal || 'No output'
      );
      return {
        error: run.timedOut
          ? 'Time limit exceeded: your code ran for more than 6 seconds (infinite loop?).'
          : run.fatal || '',
        results: toRows(graded.outcomes),
        console: graded.consoleOutput,
      };
    }

    // C++ / Java run on the server via Judge0
    setRunStatusText('Compiling and running on the server...');
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, language: lang, code: sourceCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { error: data.error || 'Run failed', results: failAll('Not Run', 'Not run'), console: '' };
      }
      if (data.compileError) {
        return { error: data.compileError, results: failAll('Compile Error', 'Compile error'), console: '' };
      }
      return {
        error: data.runtimeStatus ? `Program stopped: ${data.runtimeStatus}` : '',
        results: toRows(data.outcomes || []),
        console: data.consoleOutput || '',
      };
    } catch {
      return { error: 'Could not reach the code runner.', results: failAll('Not Run', 'Not run'), console: '' };
    }
  };

  const applyEvaluation = (evaluation: Evaluation) => {
    setCompileError(evaluation.error);
    setTestResults(evaluation.results);
    setConsoleOutput(evaluation.console);
  };

  // Runs the tests, reusing the previous result when the code hasn't changed
  const getEvaluation = async (): Promise<Evaluation> => {
    const key = `${currentQuestion.id}\u0000${language}\u0000${code}`;
    if (lastRunRef.current?.key === key) return lastRunRef.current.evaluation;
    const evaluation = await evaluateSubmission(code, language, currentQuestion);
    // Don't cache transient failures (rate limits, network) so they can be retried
    const transient = evaluation.results.every((r) => r.status === 'Not Run');
    if (!transient) lastRunRef.current = { key, evaluation };
    return evaluation;
  };

  // Timer countdown (derived from a wall-clock deadline so it stays accurate in background tabs)
  useEffect(() => {
    if (screen !== 'active') return;

    const timer = setInterval(() => {
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(timer);
        finishRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  const unlockNextHint = (tier: number) => {
    if (!unlockedHints.includes(tier)) {
      setUnlockedHints([...unlockedHints, tier]);
    }
  };

  const runTestCases = async () => {
    if (isRunningTests) return;
    setIsRunningTests(true);
    try {
      applyEvaluation(await getEvaluation());
    } finally {
      setIsRunningTests(false);
      setRunStatusText('');
    }
  };

  const finishInterview = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const elapsed = timeLimitMinutes * 60 - secondsLeft;
    setTimeTakenSeconds(elapsed);

    setIsRunningTests(true);
    let evaluation: Evaluation;
    try {
      evaluation = await getEvaluation();
    } finally {
      setIsRunningTests(false);
      setRunStatusText('');
    }
    applyEvaluation(evaluation);

    const totalCases = currentQuestion.testCases.length || 1;
    const testCasesPassed = evaluation.results.filter((r) => r.passed).length;

    let calculatedScore = 0;
    if (testCasesPassed === 0) {
      calculatedScore = 0;
    } else {
      const baseFromTests = Math.round((testCasesPassed / totalCases) * 100);
      const hintPenalty = unlockedHints.length * 10;
      const overtimePenalty = elapsed > timeLimitMinutes * 60 * 0.85 ? 5 : 0;
      calculatedScore = Math.max(15, Math.min(100, baseFromTests - hintPenalty - overtimePenalty));
    }

    setScore(calculatedScore);

    if (calculatedScore >= 90) setVerdict('Strong Hire');
    else if (calculatedScore >= 75) setVerdict('Hire');
    else if (calculatedScore >= 55) setVerdict('Lean Hire');
    else setVerdict('No Hire');

    try {
      sessionStorage.setItem(
        'dashcode_mock_review',
        JSON.stringify({
          code,
          language,
          title: currentQuestion.title,
          company: currentQuestion.company,
        })
      );
    } catch {
      // ignore storage error
    }

    setScreen('scorecard');
  };

  useEffect(() => {
    finishRef.current = finishInterview;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. LOBBY SCREEN
  if (screen === 'lobby') {
    return (
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-gradient-to-r from-[#0B1739] via-[#0A1330] to-[#0B1739] p-7 md:p-9 shadow-2xl">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#0E43FB]/15 via-[#00C2FF]/10 to-[#14CA74]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00C2FF]/30 bg-[#00C2FF]/10 px-3 py-1 text-xs font-bold text-[#00C2FF]">
              <Clock className="h-3.5 w-3.5" />
              <span>Simulated Technical Assessment</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              FAANG Timed Mock Interview Simulator
            </h1>
            <p className="text-xs md:text-sm text-[#AEB9E1] leading-relaxed">
              Experience the pressure of real 45-minute technical interviews. Includes verified interview questions from Google, Amazon, Meta, and Microsoft, test cases, and a progressive hint ladder.
            </p>
          </div>
        </div>

        {/* Configuration Setup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target Company Selector */}
          <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#AEB9E1] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#00C2FF]" />
              <span>1. Select Target Company</span>
            </h3>

            <div className="space-y-2.5">
              {(['Google', 'Amazon', 'Meta', 'Microsoft'] as const).map((comp) => {
                const isSelected = selectedCompany === comp;
                return (
                  <button
                    key={comp}
                    onClick={() => setSelectedCompany(comp)}
                    className={`w-full flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#00C2FF] bg-[#0E43FB]/15 text-white shadow-[0_0_15px_rgba(0,194,255,0.3)]'
                        : 'border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{comp}</p>
                      <p className="text-[11px] text-[#7E89AC]">Verified Interview Questions</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-[#00C2FF]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Limit Selector */}
          <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#AEB9E1] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FDB52A]" />
              <span>2. Assessment Duration</span>
            </h3>

            <div className="space-y-2.5">
              {[
                { mins: 45, label: 'Standard FAANG Round', desc: '45 mins (Recommended for realistic simulation)' },
                { mins: 30, label: 'Speed Round', desc: '30 mins (Rapid fire problem solving)' },
              ].map((t) => {
                const isSelected = timeLimitMinutes === t.mins;
                return (
                  <button
                    key={t.mins}
                    onClick={() => setTimeLimitMinutes(t.mins)}
                    className={`w-full flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#FDB52A] bg-[#FDB52A]/10 text-white shadow-[0_0_15px_rgba(253,181,42,0.3)]'
                        : 'border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] hover:text-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{t.label}</p>
                      <p className="text-[11px] text-[#7E89AC]">{t.desc}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-[#FDB52A]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Action Card */}
          <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#AEB9E1] flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#14CA74]" />
                <span>3. Rules of Engagement</span>
              </h3>
              <ul className="space-y-2 text-xs text-[#AEB9E1]">
                <li className="flex items-start gap-2">
                  <span className="text-[#14CA74]">•</span>
                  <span>Timer starts immediately upon entering room.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14CA74]">•</span>
                  <span>Unlocking progressive hints incurs a minor score penalty.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#14CA74]">•</span>
                  <span>Run test cases before final submission.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => startInterview()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E43FB] via-[#00C2FF] to-[#14CA74] py-3.5 text-xs font-black uppercase tracking-wider text-[#081028] shadow-[0_0_20px_rgba(0,194,255,0.5)] transition hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Begin Assessment ({timeLimitMinutes}m)</span>
            </button>
          </div>
        </div>

        {/* Verified Questions in this Track */}
        <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(126,137,172,0.14)] pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00C2FF]" />
                <span>Verified {selectedCompany} Questions in this Track</span>
              </h3>
              <p className="text-xs text-[#7E89AC] mt-0.5">
                Each problem is cross-verified from candidate hiring reports, CodinzHub, and LeetCode discussions.
              </p>
            </div>
            <span className="rounded-md bg-[#14CA74]/15 border border-[#14CA74]/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#14CA74]">
              ✓ ALL ROUNDS VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableQuestions.map((q) => {
              const diffColor =
                q.difficulty === 'Easy'
                  ? 'text-[#14CA74] border-[#14CA74]/30 bg-[#14CA74]/10'
                  : q.difficulty === 'Medium'
                  ? 'text-[#FDB52A] border-[#FDB52A]/30 bg-[#FDB52A]/10'
                  : 'text-[#FF5A65] border-[#FF5A65]/30 bg-[#FF5A65]/10';

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${diffColor}`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[11px] text-[#7E89AC] font-mono">
                        {q.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{q.title}</h4>

                    {q.verifiedRound && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#00C2FF] font-medium bg-[#0E43FB]/15 border border-[#0E43FB]/30 rounded-lg px-2.5 py-1">
                        <Target className="h-3 w-3 shrink-0 text-[#00C2FF]" />
                        <span className="truncate">{q.verifiedRound}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(126,137,172,0.1)]">
                    <span className="text-[10px] text-[#AEB9E1] flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#14CA74]" />
                      <span>{q.sourceName}</span>
                    </span>

                    <button
                      onClick={() => startInterview(q)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E43FB] px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-[#00C2FF] hover:text-[#081028] transition"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Practice This</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE ASSESSMENT SCREEN
  if (screen === 'active') {
    const isTimeUrgent = secondsLeft < 300; // <5 mins

    return (
      <div className="space-y-4">
        {/* Top Active Sticky Bar */}
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(126,137,172,0.2)] bg-[#0B1739]/95 backdrop-blur-xl px-5 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-[#00C2FF]/40 bg-[#00C2FF]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00C2FF] uppercase">
              {currentQuestion.company} Interview
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
              {currentQuestion.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer display */}
            <div
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-sm font-black border transition ${
                isTimeUrgent
                  ? 'border-[#FF5A65] bg-[#FF5A65]/15 text-[#FF5A65] animate-pulse shadow-[0_0_15px_rgba(255,90,101,0.5)]'
                  : 'border-[#FDB52A]/40 bg-[#0A1330] text-[#FDB52A]'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(secondsLeft)}</span>
            </div>

            <button
              onClick={finishInterview}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E43FB] px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:bg-[#00C2FF] hover:text-[#081028]"
            >
              <span>Submit &amp; Finish</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Two-Column Editor & Problem Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Problem & Hint Ladder */}
          <div className="lg:col-span-5 rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl space-y-5 overflow-y-auto max-h-[82vh]">
            <div className="border-b border-[rgba(126,137,172,0.14)] pb-4 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[#FDB52A]/30 bg-[#FDB52A]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#FDB52A] uppercase">
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs text-[#7E89AC] font-mono">
                  {currentQuestion.category}
                </span>
                {currentQuestion.frequencyBadge && (
                  <span className="rounded-md border border-[#00EA64]/30 bg-[#00EA64]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00EA64]">
                    {currentQuestion.frequencyBadge}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-black text-white">{currentQuestion.title}</h1>

              {/* Verified Round & Source Info */}
              {currentQuestion.verifiedRound && (
                <div className="rounded-xl border border-[#00C2FF]/30 bg-[#00C2FF]/10 p-2.5 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#00C2FF]">
                    <Target className="h-3.5 w-3.5 shrink-0" />
                    <span>Verified: {currentQuestion.verifiedRound}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#AEB9E1]">
                    <span>Source: <a href={currentQuestion.sourceUrl || 'https://www.codinzhub.com/'} target="_blank" rel="noopener noreferrer" className="text-[#00EA64] font-semibold underline">{currentQuestion.sourceName}</a></span>
                    {currentQuestion.notes && <span className="text-[#7E89AC] italic text-[10px]">{currentQuestion.notes}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="text-xs md:text-sm text-[#D1DBF9] leading-relaxed whitespace-pre-line space-y-3">
              <p>{currentQuestion.description}</p>
            </div>

            {/* Examples */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-[#AEB9E1]">Examples</h3>
              {currentQuestion.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#081028] p-3.5 space-y-1.5 text-xs font-mono"
                >
                  <p className="text-[#AEB9E1]">
                    <strong className="text-white">Input:</strong> {ex.input}
                  </p>
                  <p className="text-[#00C2FF]">
                    <strong className="text-white">Output:</strong> {ex.output}
                  </p>
                  {ex.explanation && (
                    <p className="text-[#7E89AC] text-[11px] font-sans">
                      <strong>Explanation:</strong> {ex.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase text-[#AEB9E1]">Constraints</h3>
              <ul className="space-y-1 text-xs font-mono text-[#AEB9E1]">
                {currentQuestion.constraints.map((c, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-[#00C2FF]">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progressive Hint Ladder */}
            <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-[#FDB52A] flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-[#FDB52A]" />
                  <span>Progressive Hint Ladder</span>
                </span>
                <span className="text-[10px] font-mono text-[#7E89AC]">
                  {unlockedHints.length}/3 Unlocked
                </span>
              </div>

              <div className="space-y-2">
                {currentQuestion.hints.map((hint) => {
                  const isUnlocked = unlockedHints.includes(hint.tier);

                  return (
                    <div
                      key={hint.tier}
                      className="rounded-xl border border-[rgba(126,137,172,0.12)] bg-[#081028] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>Hint {hint.tier}:</span>
                          <span className="text-[#AEB9E1] font-normal">{hint.title}</span>
                        </span>

                        {!isUnlocked ? (
                          <button
                            onClick={() => unlockNextHint(hint.tier)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-2 py-0.5 text-[10px] font-mono text-[#FDB52A] hover:border-[#FDB52A]"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            <span>Unlock (-10 pts)</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#14CA74] font-mono font-bold">
                            Unlocked
                          </span>
                        )}
                      </div>

                      {isUnlocked && (
                        <p className="mt-2 text-[#D1DBF9] text-xs leading-relaxed border-t border-[rgba(126,137,172,0.1)] pt-2">
                          {hint.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & Test Cases */}
          <div className="lg:col-span-7 flex flex-col rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-xl space-y-4">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(126,137,172,0.14)] pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#00C2FF]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Solution Editor</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setLanguage(newLang);
                    setCode(currentQuestion.starterCode[newLang] || currentQuestion.starterCode['python']);
                  }}
                  className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#00C2FF]"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC 9)</option>
                  <option value="java">Java 13</option>
                  <option value="typescript">TypeScript</option>
                </select>

                <button
                  onClick={() => setCode(currentQuestion.starterCode[language] || '')}
                  className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] p-1.5 text-[#AEB9E1] hover:text-white"
                  title="Reset code"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Code Input with Line Numbers & Tab Indentation */}
            <div className="relative flex-1 min-h-[360px] flex rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#081028] overflow-hidden font-mono text-xs text-[#D1DBF9]">
              <div className="select-none border-r border-[rgba(126,137,172,0.1)] bg-[#060C1E] px-3 py-4 text-right text-[11px] leading-relaxed text-[#4E5A7E]">
                {code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const target = e.currentTarget;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    const nextCode = code.substring(0, start) + '    ' + code.substring(end);
                    setCode(nextCode);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + 4;
                    }, 0);
                  } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    runTestCases();
                  }
                }}
                placeholder="Write your code here... (Tab for indent, Ctrl+Enter to run tests)"
                className="flex-1 p-4 bg-transparent resize-none focus:outline-none leading-relaxed placeholder-[#7E89AC]/60"
                rows={16}
                spellCheck={false}
              />
            </div>

            {/* Test Case Execution Panel */}
            <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1]">
                    Test Case Runner
                  </span>
                  <span className="text-[10px] font-mono text-[#7E89AC] hidden sm:inline">
                    (Ctrl + Enter)
                  </span>
                </div>
                <button
                  onClick={runTestCases}
                  disabled={isRunningTests}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:scale-105 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{isRunningTests ? 'Running...' : 'Run Test Cases'}</span>
                </button>
              </div>

              {isRunningTests && runStatusText && (
                <p className="text-[11px] font-mono text-[#00C2FF] animate-pulse">{runStatusText}</p>
              )}

              {(language === 'cpp' || language === 'java') && !isRunningTests && (
                <p className="text-[10px] font-mono text-[#7E89AC]">
                  C++/Java run on a server (login required, shared free limit of 50 runs/day). Python &amp; TypeScript run instantly in your browser.
                </p>
              )}

              {compileError && (
                <div className="flex items-start gap-2 rounded-xl border border-[#FF5A65]/40 bg-[#FF5A65]/15 p-3 text-xs font-mono text-[#FF5A65]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto">{compileError}</pre>
                </div>
              )}

              {testResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {testResults.map((tr) => (
                    <div
                      key={tr.id}
                      className={`rounded-xl border p-3 text-xs font-mono space-y-1.5 ${
                        tr.passed
                          ? 'border-[#14CA74]/30 bg-[#14CA74]/10 text-[#14CA74]'
                          : 'border-[#FF5A65]/30 bg-[#FF5A65]/10 text-[#FF5A65]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Case {tr.id}</span>
                        <span>{tr.passed ? '✓ Accepted' : `✗ ${tr.status}`}</span>
                      </div>
                      <div className="text-[11px] text-[#AEB9E1] space-y-0.5 pt-1 border-t border-white/10">
                        <p className="truncate" title={tr.input}>
                          <span className="text-[#7E89AC]">In:</span> {tr.input}
                        </p>
                        <p className="truncate" title={tr.expected}>
                          <span className="text-[#7E89AC]">Expected:</span> {tr.expected}
                        </p>
                        <p className="truncate" title={tr.output}>
                          <span className="text-[#7E89AC]">Output:</span> {tr.output}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#7E89AC] font-mono">
                  Click &quot;Run Test Cases&quot; (or press Ctrl+Enter) to verify your solution against the {currentQuestion.testCases.length} test cases.
                </p>
              )}

              {consoleOutput && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E89AC]">Your printed output</span>
                  <pre className="max-h-32 overflow-auto rounded-xl border border-white/10 bg-[#060C1E] p-2 text-[11px] font-mono text-[#AEB9E1] whitespace-pre-wrap">
                    {consoleOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. SCORECARD SCREEN
  const verdictColor =
    verdict === 'Strong Hire'
      ? 'border-[#14CA74]/50 bg-[#14CA74]/15 text-[#14CA74]'
      : verdict === 'Hire'
      ? 'border-[#00C2FF]/50 bg-[#00C2FF]/15 text-[#00C2FF]'
      : verdict === 'Lean Hire'
      ? 'border-[#FDB52A]/50 bg-[#FDB52A]/15 text-[#FDB52A]'
      : 'border-[#FF5A65]/50 bg-[#FF5A65]/15 text-[#FF5A65]';

  const passedCount = testResults.filter((r) => r.passed).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-3xl border border-[rgba(126,137,172,0.2)] bg-[#0B1739] p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#0E43FB] via-[#00C2FF] to-[#14CA74] p-0.5 shadow-[0_0_25px_rgba(0,194,255,0.4)]">
          <div className="flex h-full w-full items-center justify-center rounded-3xl bg-[#081028] text-3xl font-black text-white">
            <Trophy className="h-10 w-10 text-[#FDB52A]" />
          </div>
        </div>

        <div>
          <span className="text-xs uppercase font-bold text-[#7E89AC] tracking-wider block mb-1">
            Technical Assessment Complete
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {currentQuestion.company} Mock Scorecard
          </h2>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className={`rounded-xl border px-4 py-1 text-sm font-black uppercase font-mono shadow-sm ${verdictColor}`}>
              Verdict: {verdict}
            </span>
          </div>
        </div>

        {/* Big Score Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-b border-[rgba(126,137,172,0.15)] py-5 text-center">
          <div>
            <p className="text-[10px] text-[#7E89AC] font-bold uppercase">Assessment Score</p>
            <p className="text-2xl font-black font-mono text-[#00C2FF] mt-0.5">{score}/100</p>
          </div>
          <div>
            <p className="text-[10px] text-[#7E89AC] font-bold uppercase">Tests Passed</p>
            <p className="text-2xl font-black font-mono text-[#14CA74] mt-0.5">
              {passedCount}/{currentQuestion.testCases.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#7E89AC] font-bold uppercase">Time Elapsed</p>
            <p className="text-2xl font-black font-mono text-white mt-0.5">{formatTime(timeTakenSeconds)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#7E89AC] font-bold uppercase">Hints Used</p>
            <p className="text-2xl font-black font-mono text-[#FDB52A] mt-0.5">{unlockedHints.length}/3</p>
          </div>
        </div>

        {/* Optimal Complexity Reference */}
        <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#081028] p-4 text-left text-xs space-y-2">
          <span className="text-[10px] font-bold uppercase text-[#00C2FF] block">
            Optimal Expected Complexity for {currentQuestion.title}:
          </span>
          <div className="flex justify-between font-mono text-[#AEB9E1]">
            <span>Time: <strong className="text-white">{currentQuestion.optimalComplexity.time}</strong></span>
            <span>Space: <strong className="text-white">{currentQuestion.optimalComplexity.space}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setScreen('lobby')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A1330] border border-[rgba(126,137,172,0.2)] px-6 py-3 text-xs font-bold text-white hover:border-[#00C2FF] transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake Another Interview</span>
          </button>

          <Link
            href="/reviewer?from=mock"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] px-6 py-3 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            <span>Analyze Code in AI Reviewer</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
