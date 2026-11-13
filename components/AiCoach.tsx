'use client';

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  BarChart3,
  Target,
  CalendarDays,
} from 'lucide-react';
import type { CoachProblem, CoachReport } from '@/lib/coach';
import { LocalTime } from '@/components/LocalTime';

interface AiCoachProps {
  userId: string;
  totalSolved: number;
  hasAccounts: boolean;
}

interface StoredCoach {
  report: CoachReport;
  notice?: string;
}

// The last report is kept in this browser so it shows instantly on the next visit (no quota used)
const STORAGE_PREFIX = 'dashcode:coach:v1:';
const CHANGE_EVENT = 'dashcode:coach';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const LOADING_STEPS = [
  'Reading your solve history...',
  'Comparing your topics with NeetCode 150...',
  'Checking difficulty mix and consistency...',
  'Asking Gemini for your weak spots and a plan...',
];

const SEVERITY_STYLE: Record<CoachReport['weaknesses'][number]['severity'], string> = {
  High: 'bg-[#FF5A65]/15 text-[#FF5A65] border-[#FF5A65]/30',
  Medium: 'bg-[#FDB52A]/15 text-[#FDB52A] border-[#FDB52A]/30',
  Low: 'bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/30',
};

const DIFFICULTY_STYLE: Record<CoachProblem['difficulty'], string> = {
  Easy: 'text-[#14CA74]',
  Medium: 'text-[#FDB52A]',
  Hard: 'text-[#FF5A65]',
};

function ProblemChip({ problem }: { problem: CoachProblem }) {
  return (
    <a
      href={problem.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${problem.category} · ${problem.difficulty} · opens on LeetCode`}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[rgba(126,137,172,0.2)] bg-[#081028] px-2.5 py-1 text-[11px] font-semibold text-[#D1DBF9] transition hover:border-[#00C2FF] hover:text-white"
    >
      <span className={`shrink-0 font-mono text-[9px] font-bold ${DIFFICULTY_STYLE[problem.difficulty]}`}>{problem.difficulty[0]}</span>
      <span className="truncate">{problem.title}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-[#7E89AC] group-hover:text-[#00C2FF]" />
    </a>
  );
}

export function AiCoach({ userId, totalSolved, hasAccounts }: AiCoachProps) {
  const storageKey = STORAGE_PREFIX + userId;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey) ?? '';
      } catch {
        return '';
      }
    },
    () => ''
  );
  const stored = useMemo<StoredCoach | null>(() => {
    try {
      const parsed = raw ? (JSON.parse(raw) as StoredCoach) : null;
      return parsed?.report?.weaknesses ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);

  // Elapsed-seconds counter while Gemini works (drives the step text)
  useEffect(() => {
    if (!loading) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [loading]);

  const analyse = useCallback(
    async (refresh: boolean) => {
      if (loading) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !data.success || !data.report) {
          throw new Error(data.error || 'Could not build your report. Please try again.');
        }
        const next: StoredCoach = { report: data.report, ...(data.notice ? { notice: data.notice } : {}) };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
          window.dispatchEvent(new Event(CHANGE_EVENT));
        } catch {
          // storage unavailable: show nothing persisted, but the request still succeeded
        }
        if (!raw) setPlanOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not build your report. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [loading, storageKey, raw]
  );

  const report = stored?.report ?? null;
  const solvedSince = report ? totalSolved - report.basedOn.totalSolved : 0;
  const step = LOADING_STEPS[Math.min(LOADING_STEPS.length - 1, Math.floor(elapsed / 3))];

  return (
    <section
      aria-labelledby="ai-coach-title"
      className="relative overflow-hidden rounded-2xl border border-[#CB3CFF]/25 bg-gradient-to-br from-[#0E1628] via-[#0B1739] to-[#140F2E] p-5 sm:p-6 shadow-lg"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#CB3CFF]/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(148,163,184,0.1)] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#CB3CFF]/30 bg-[#CB3CFF]/15 text-[#CB3CFF]">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="ai-coach-title" className="text-base font-bold tracking-tight text-white">
                AI Coach: Your Weak Spots
              </h2>
              <span className="rounded-full border border-[#CB3CFF]/30 bg-[#CB3CFF]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#CB3CFF]">
                GEMINI
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#94A3B8]">
              Reads your synced stats, finds where you&apos;re weakest, and builds a 7-day plan from problems you haven&apos;t solved.
            </p>
          </div>
        </div>

        {hasAccounts && (
          <button
            type="button"
            onClick={() => void analyse(!!report)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#CB3CFF] px-4 py-2 text-xs font-bold text-white shadow-[0_0_18px_rgba(203,60,255,0.35)] transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{loading ? 'Analysing...' : report ? 'Refresh analysis' : 'Find my weak spots'}</span>
          </button>
        )}
      </div>

      <div className="relative mt-4 space-y-4">
        {!hasAccounts && (
          <p className="rounded-xl border border-dashed border-[rgba(148,163,184,0.25)] p-4 text-center text-xs text-[#94A3B8]">
            Link LeetCode, Codeforces or CodeChef with <strong className="text-white">Add Platform</strong> first: the coach needs your solve history to analyse.
          </p>
        )}

        {loading && (
          <div role="status" className="space-y-3 rounded-xl border border-[#CB3CFF]/20 bg-[#081028]/60 p-4">
            <p className="flex items-center gap-2 text-xs font-mono text-[#CB3CFF]">
              <BrainCircuit className="h-3.5 w-3.5 animate-pulse" />
              <span>{step}</span>
              <span className="ml-auto text-[#7E89AC]">{elapsed}s</span>
            </p>
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-[#1A2747]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[#1A2747]" />
              <div className="h-16 animate-pulse rounded-xl bg-[#131E35]" />
            </div>
            <p className="text-[10px] text-[#7E89AC]">Usually 10-20 seconds on Gemini&apos;s free tier.</p>
          </div>
        )}

        {error && !loading && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/10 p-3 text-xs text-[#FF5A65]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hasAccounts && !report && !loading && (
          <ul className="grid gap-2 text-xs text-[#AEB9E1] sm:grid-cols-3">
            {[
              ['Weak spots, with proof', 'Each one cites your own numbers, e.g. "2 of 13 Graphs problems solved".'],
              ['Exactly what to do', 'Why each gap matters in interviews, and how to close it.'],
              ['A 7-day plan', 'Real problems you haven’t solved yet, easiest first.'],
            ].map(([title, text]) => (
              <li key={title} className="rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#081028]/50 p-3">
                <p className="font-bold text-white">{title}</p>
                <p className="mt-0.5 text-[11px] text-[#7E89AC]">{text}</p>
              </li>
            ))}
          </ul>
        )}

        {report && !loading && (
          <>
            {(report.source === 'estimate' || stored?.notice) && (
              <p className="flex items-start gap-2 rounded-xl border border-[#FDB52A]/30 bg-[#FDB52A]/10 px-3 py-2 text-[11px] text-[#FDB52A]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{stored?.notice || 'Quick rule-based analysis (not AI). Refresh for a Gemini report.'}</span>
              </p>
            )}

            <div>
              <p className="text-sm font-bold text-white">{report.headline}</p>
              {report.summary && <p className="mt-1 text-xs leading-relaxed text-[#AEB9E1]">{report.summary}</p>}
              {solvedSince > 0 && (
                <p className="mt-2 text-[11px] text-[#00C2FF]">
                  You&apos;ve solved {solvedSince} more problem{solvedSince === 1 ? '' : 's'} since this report. Refresh for an updated analysis.
                </p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="grid gap-3 md:grid-cols-2">
              {report.weaknesses.map((w, i) => (
                <article key={`${w.area}-${i}`} className="space-y-2.5 rounded-xl border border-[rgba(148,163,184,0.14)] bg-[#081028]/70 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <Target className="h-4 w-4 shrink-0 text-[#CB3CFF]" />
                      <span>{w.area}</span>
                    </h3>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${SEVERITY_STYLE[w.severity]}`}>
                      {w.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="flex items-start gap-1.5 rounded-lg bg-[#0B1739] px-2.5 py-1.5 text-[11px] font-mono text-[#D1DBF9]">
                    <BarChart3 className="mt-0.5 h-3 w-3 shrink-0 text-[#00C2FF]" />
                    <span>{w.evidence}</span>
                  </p>
                  {w.impact && (
                    <p className="text-[11px] text-[#AEB9E1]">
                      <span className="font-semibold text-white">Why it matters: </span>
                      {w.impact}
                    </p>
                  )}
                  {w.fix && (
                    <p className="flex items-start gap-1.5 text-[11px] text-[#AEB9E1]">
                      <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-[#FDB52A]" />
                      <span>{w.fix}</span>
                    </p>
                  )}
                  {w.practice.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {w.practice.map((p) => (
                        <ProblemChip key={p.id} problem={p} />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Strengths & habits */}
            {(report.strengths.length > 0 || report.habits.length > 0) && (
              <div className="grid gap-3 md:grid-cols-2">
                {report.strengths.length > 0 && (
                  <div className="rounded-xl border border-[#14CA74]/20 bg-[#14CA74]/5 p-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#14CA74]">What&apos;s working</h3>
                    <ul className="space-y-1.5">
                      {report.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-1.5 text-[11px] text-[#D1DBF9]">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#14CA74]" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.habits.length > 0 && (
                  <div className="rounded-xl border border-[#00C2FF]/20 bg-[#00C2FF]/5 p-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#00C2FF]">Habits</h3>
                    <ul className="space-y-2">
                      {report.habits.map((h) => (
                        <li key={h.observation} className="text-[11px]">
                          <p className="text-[#D1DBF9]">{h.observation}</p>
                          <p className="text-[#7E89AC]">→ {h.suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 7-day plan */}
            {report.plan.length > 0 && (
              <div className="rounded-xl border border-[rgba(148,163,184,0.14)] bg-[#081028]/50">
                <button
                  type="button"
                  aria-expanded={planOpen}
                  onClick={() => setPlanOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-xs font-bold text-white"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#CB3CFF]" />
                    Your 7-day plan
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#7E89AC] transition-transform ${planOpen ? 'rotate-180' : ''}`} />
                </button>
                {planOpen && (
                  <ol className="space-y-2 border-t border-[rgba(148,163,184,0.1)] px-4 py-3">
                    {report.plan.map((d) => (
                      <li key={d.day} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                        <span className="w-14 shrink-0 font-mono text-[11px] font-bold text-[#CB3CFF]">{d.day}</span>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[11px] text-[#D1DBF9]">{d.focus}</p>
                          {d.problems.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {d.problems.map((p) => (
                                <ProblemChip key={p.id} problem={p} />
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            <p className="text-[10px] text-[#64748B]">
              {report.source === 'ai' ? 'Written by Google Gemini from your synced stats. AI can be wrong; trust the numbers.' : 'Rule-based estimate.'}{' '}
              Based on {report.basedOn.totalSolved} solved problems · <LocalTime iso={report.generatedAt} mode="datetime" />
            </p>
          </>
        )}
      </div>
    </section>
  );
}
