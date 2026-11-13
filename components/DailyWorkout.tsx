'use client';

import React, { useState, useEffect } from 'react';
import { useManualSolves } from '@/components/useManualSolves';
import type { DailyWorkout } from '@/lib/potd';
import {
  Flame,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Trophy,
} from 'lucide-react';

interface DailyWorkoutProps {
  initialWorkout: DailyWorkout;
  /** Current daily streak (days), to word the status pill */
  currentStreak?: number;
  /** Someone else's public profile: show progress, but no "Mark Done" toggles */
  readOnly?: boolean;
}

export const DailyWorkoutCard: React.FC<DailyWorkoutProps> = ({ initialWorkout, currentStreak = 0, readOnly = false }) => {
  const [timeLeft, setTimeLeft] = useState('');
  // Local "Mark Done" ticks (shared with the roadmap sheets)
  const [manualOverrides, toggleSolved] = useManualSolves();

  // Countdown to next UTC midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const enrichedProblems = initialWorkout.problems.map((p) => ({
    ...p,
    // A visitor's local ticks never apply to someone else's profile
    isSolved: !readOnly && manualOverrides[p.id] !== undefined ? manualOverrides[p.id] : p.isSolved,
  }));

  const solvedCount = enrichedProblems.filter((p) => p.isSolved).length;
  // Only real (synced) solves today keep a streak alive; local "Mark Done" ticks don't
  const isStreakProtected = initialWorkout.streakProtected;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl space-y-6">
      {/* Background ambient glow */}
      <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-[#FFB016]/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(126,137,172,0.14)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB016]/40 bg-[#FFB016]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#FFB016]">
              <Flame className="h-3 w-3" />
              <span>POTD &amp; Daily Workout</span>
            </span>
            <span className="rounded-md border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2 py-0.5 text-[10px] font-mono text-[#AEB9E1]">
              Focus: {initialWorkout.todayTargetTopic}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>Today&apos;s Training Regimen</span>
          </h2>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2.5">
          {isStreakProtected ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#14CA74]/30 bg-[#14CA74]/10 px-3 py-1.5 text-xs font-bold text-[#14CA74]">
              <ShieldCheck className="h-4 w-4" />
              <span>Solved Today</span>
            </div>
          ) : currentStreak > 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/10 px-3 py-1.5 text-xs font-bold text-[#FF5A65]">
              <ShieldAlert className="h-4 w-4" />
              <span>{currentStreak}-Day Streak at Risk</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFB016]/30 bg-[#FFB016]/10 px-3 py-1.5 text-xs font-bold text-[#FFB016]">
              <Flame className="h-4 w-4" />
              <span>Start a Streak</span>
            </div>
          )}

          <div
            title="Time left in today's streak day (resets at 00:00 UTC)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-3 py-1.5 text-xs font-mono text-[#AEB9E1]"
          >
            <Clock className="h-3.5 w-3.5 text-[#00C2FF]" />
            <span>{timeLeft || 'Calculating...'}</span>
          </div>
        </div>
      </div>

      {/* 3 Workout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {enrichedProblems.map((problem) => {
          const isEasy = problem.difficulty === 'Easy';
          const isMed = problem.difficulty === 'Medium';

          const tierColor = isEasy
            ? 'text-[#14CA74] border-[#14CA74]/30 bg-[#14CA74]/10'
            : isMed
            ? 'text-[#FDB52A] border-[#FDB52A]/30 bg-[#FDB52A]/10'
            : 'text-[#FF5A65] border-[#FF5A65]/30 bg-[#FF5A65]/10';

          return (
            <div
              key={problem.id}
              className={`group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
                problem.isSolved
                  ? 'border-[#14CA74]/40 bg-gradient-to-b from-[#0B1739] to-[#0A1330] shadow-[0_0_20px_rgba(20,202,116,0.15)]'
                  : 'border-[rgba(126,137,172,0.18)] bg-[#0A1330] hover:border-[#0E43FB]/60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E89AC]">
                  {problem.tier}
                </span>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${tierColor}`}>
                  {problem.difficulty} • ~{problem.estimatedMinutes}m
                </span>
              </div>

              {/* Problem Title */}
              <h3 className="text-base font-bold text-white group-hover:text-[#00C2FF] transition line-clamp-2 min-h-[3rem]">
                <a href={problem.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                  <span>{problem.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                </a>
              </h3>

              {/* Topic Category */}
              <p className="text-xs text-[#7E89AC] font-mono mt-1 mb-5">
                {problem.category}
              </p>

              {/* Card Footer / Action */}
              <div className="flex items-center justify-between border-t border-[rgba(126,137,172,0.14)] pt-3.5">
                <button
                  type="button"
                  disabled={readOnly}
                  aria-pressed={problem.isSolved}
                  onClick={() => toggleSolved(problem.id, problem.isSolved)}
                  title={readOnly ? undefined : problem.isSolved ? 'Click to mark pending' : 'Click to mark completed'}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#14CA74] disabled:cursor-default disabled:hover:scale-100"
                >
                  {problem.isSolved ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14CA74]">
                      <CheckCircle2 className="h-4 w-4 drop-shadow-[0_0_8px_rgba(20,202,116,0.8)]" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7E89AC] hover:text-[#14CA74] transition-colors">
                      <Circle className="h-4 w-4 opacity-70" />
                      <span>{readOnly ? 'Not yet' : 'Mark Done'}</span>
                    </span>
                  )}
                </button>

                <a
                  href={problem.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                    problem.isSolved
                      ? 'border border-[rgba(126,137,172,0.18)] bg-[#081028] text-[#AEB9E1] hover:text-white'
                      : 'bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] text-white hover:scale-105 shadow-[0_0_12px_rgba(14,67,251,0.4)]'
                  }`}
                >
                  <span>{problem.isSolved ? 'Revisit' : 'Solve Now'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(126,137,172,0.14)] bg-[#081028]/60 p-4 text-xs">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#FDB52A]" />
          <span className="text-[#AEB9E1]">
            Daily Workout Progress: <strong className="text-white font-mono">{solvedCount} / 3</strong> completed
          </span>
        </div>
        <p className="text-[11px] text-[#7E89AC]">
          Solving any 1 problem today (UTC) keeps your streak going.
        </p>
      </div>
    </div>
  );
};
