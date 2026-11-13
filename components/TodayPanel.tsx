'use client';

import React from 'react';
import { Flame, Target, ListChecks, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import type { DailyWorkout } from '@/lib/potd';
import { useStoredCoach } from '@/components/AiCoach';

interface TodayPanelProps {
  userId: string;
  currentStreak: number;
  workout: DailyWorkout | null;
  /** Opens the Practice tab (full workout + roadmaps) */
  onOpenPractice: () => void;
  /** Switches to the Overview tab, where the AI coach lives */
  onOpenOverview: () => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'text-[#14CA74]',
  Medium: 'text-[#FDB52A]',
  Hard: 'text-[#FF5A65]',
};

const card = 'rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#0B1222] p-4';
const label = 'flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8]';

/** "What should I do today?" — the first thing on the dashboard. */
export function TodayPanel({ userId, currentStreak, workout, onOpenPractice, onOpenOverview }: TodayPanelProps) {
  const coach = useStoredCoach(userId);
  const focus = coach?.report.weaknesses[0] ?? null;
  const solvedToday = !!workout?.streakProtected;
  const problems = (workout?.problems ?? []).slice(0, 3);

  const scrollToCoach = () => {
    onOpenOverview();
    // Wait a frame so the Overview tab (and the coach inside it) has rendered
    requestAnimationFrame(() =>
      document.getElementById('ai-coach')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {/* Streak */}
      <div className={card}>
        <p className={label}>
          <Flame className="h-4 w-4 text-[#FFB016]" />
          Today
        </p>
        {solvedToday ? (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-base font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-[#14CA74]" />
              Solved today
            </p>
            <p className="mt-1 text-sm text-[#94A3B8]">
              {currentStreak > 1 ? `${currentStreak}-day streak. Nice.` : 'Streak started. Come back tomorrow.'}
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-base font-semibold text-white">
              {currentStreak > 0 ? `Keep your ${currentStreak}-day streak` : 'Start a streak'}
            </p>
            <p className="mt-1 text-sm text-[#94A3B8]">Solve one problem today (UTC day) on any linked platform.</p>
          </>
        )}
      </div>

      {/* Focus from the AI coach */}
      <div className={card}>
        <p className={label}>
          <Target className="h-4 w-4 text-[#8B5CF6]" />
          Your focus
        </p>
        {focus ? (
          <>
            <p className="mt-2 text-base font-semibold text-white">{focus.area}</p>
            <p className="mt-1 line-clamp-2 text-sm text-[#94A3B8]">{focus.evidence}</p>
            <button
              type="button"
              onClick={scrollToCoach}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#A78BFA] hover:text-white"
            >
              See the full plan <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-base font-semibold text-white">Find your weak spots</p>
            <p className="mt-1 text-sm text-[#94A3B8]">The AI coach reads your stats and tells you what to practise next.</p>
            <button
              type="button"
              onClick={scrollToCoach}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#A78BFA] hover:text-white"
            >
              Open the AI coach <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Today's problems */}
      <div className={card}>
        <p className={label}>
          <ListChecks className="h-4 w-4 text-[#00EA64]" />
          {workout?.todayTargetTopic ? `Today's problems · ${workout.todayTargetTopic}` : "Today's problems"}
        </p>
        {problems.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {problems.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group inline-flex min-w-0 items-center gap-1.5 ${p.isSolved ? 'text-[#64748B] line-through' : 'text-white hover:text-[#00EA64]'}`}
                >
                  <span className="truncate">{p.title}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-[#64748B] group-hover:text-[#00EA64]" />
                </a>
                <span className={`shrink-0 text-xs font-medium ${DIFFICULTY_COLOR[p.difficulty] ?? 'text-[#94A3B8]'}`}>{p.difficulty}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#94A3B8]">Link a platform to get daily picks.</p>
        )}
        <button
          type="button"
          onClick={onOpenPractice}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#00EA64] hover:text-white"
        >
          Full workout & roadmaps <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
