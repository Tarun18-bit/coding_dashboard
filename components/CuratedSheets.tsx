'use client';

import React, { useState, useMemo } from 'react';
import { useManualSolves } from '@/components/useManualSolves';
import type { SheetProgress, SheetType } from '@/lib/sheets';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  Award,
  Bot,
} from 'lucide-react';
import Link from 'next/link';

interface CuratedSheetsProps {
  initialProgress: Record<SheetType, SheetProgress>;
  isLoggedIn?: boolean;
}

export const CuratedSheets: React.FC<CuratedSheetsProps> = ({ initialProgress, isLoggedIn = true }) => {
  const [activeSheet, setActiveSheet] = useState<SheetType>('blind75');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved'>('All');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [manualOverrides, toggleProblemSolved] = useManualSolves();

  // Recompute sheet progress merging server auto-sync with manual overrides
  const computedSheets = useMemo(() => {
    const computeOne = (sheet: SheetProgress | undefined): SheetProgress | undefined => {
      if (!sheet) return undefined;
      let solvedProblems = 0;
      const easy = { solved: 0, total: 0 };
      const medium = { solved: 0, total: 0 };
      const hard = { solved: 0, total: 0 };

      const categories = sheet.categories.map((cat) => {
        let catSolved = 0;
        const problems = cat.problems.map((p) => {
          const isSolved =
            manualOverrides[p.id] !== undefined ? manualOverrides[p.id] : p.isSolved;
          if (isSolved) {
            solvedProblems++;
            catSolved++;
          }
          if (p.difficulty === 'Easy') {
            easy.total++;
            if (isSolved) easy.solved++;
          } else if (p.difficulty === 'Medium') {
            medium.total++;
            if (isSolved) medium.solved++;
          } else {
            hard.total++;
            if (isSolved) hard.solved++;
          }
          return { ...p, isSolved };
        });
        return {
          ...cat,
          solved: catSolved,
          problems,
        };
      });

      const percent =
        sheet.totalProblems > 0
          ? Math.round((solvedProblems / sheet.totalProblems) * 100)
          : 0;

      return {
        ...sheet,
        solvedProblems,
        percent,
        easy,
        medium,
        hard,
        categories,
      };
    };

    return {
      blind75: computeOne(initialProgress.blind75)!,
      neetcode150: computeOne(initialProgress.neetcode150)!,
      striver: computeOne(initialProgress.striver)!,
    };
  }, [initialProgress, manualOverrides]);

  const progress = computedSheets[activeSheet];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!progress) return [];

    return progress.categories
      .map((cat) => {
        const filteredProblems = cat.problems.filter((p) => {
          // Search query
          if (
            searchQuery.trim() &&
            !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !p.category.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          // Difficulty
          if (difficultyFilter !== 'All' && p.difficulty !== difficultyFilter) {
            return false;
          }
          // Status
          if (statusFilter === 'Solved' && !p.isSolved) return false;
          if (statusFilter === 'Unsolved' && p.isSolved) return false;

          return true;
        });

        return {
          ...cat,
          problems: filteredProblems,
        };
      })
      .filter((cat) => cat.problems.length > 0);
  }, [progress, searchQuery, difficultyFilter, statusFilter]);

  if (!progress) return null;

  return (
    <div className="space-y-6">
      {/* Top Controls & Sheet Tabs */}
      <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00C2FF]/30 bg-[#00C2FF]/10 px-3 py-1 text-xs font-bold text-[#00C2FF] mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto-Sync Coding Roadmaps</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              Curated Interview Sheets
            </h2>
            <p className="text-xs md:text-sm text-[#AEB9E1] mt-1">
              Automatically checks off problems from your synced LeetCode, Codeforces, and CodeChef submissions — or click any circle to toggle completion manually.
            </p>
            {!isLoggedIn && (
              <p className="mt-2 text-xs text-[#FDB52A]">
                You&apos;re browsing as a guest: ticks are saved only in this browser.{' '}
                <a href="/login?next=/sheets" className="font-bold underline hover:text-white">Log in</a> to auto-track from your synced accounts.
              </p>
            )}
          </div>

          {/* Sheet Selector Tabs */}
          <div className="inline-flex flex-wrap rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] p-1.5 gap-1.5 text-xs">
            <button
              type="button"
              aria-pressed={activeSheet === 'blind75'}
              onClick={() => setActiveSheet('blind75')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all cursor-pointer ${
                activeSheet === 'blind75'
                  ? 'bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(14,67,251,0.5)]'
                  : 'text-[#AEB9E1] hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Blind 75</span>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-mono">
                {computedSheets.blind75?.solvedProblems}/{computedSheets.blind75?.totalProblems}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeSheet === 'neetcode150'}
              onClick={() => setActiveSheet('neetcode150')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all cursor-pointer ${
                activeSheet === 'neetcode150'
                  ? 'bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(14,67,251,0.5)]'
                  : 'text-[#AEB9E1] hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>NeetCode 150</span>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-mono">
                {computedSheets.neetcode150?.solvedProblems}/{computedSheets.neetcode150?.totalProblems}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeSheet === 'striver'}
              onClick={() => setActiveSheet('striver')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all cursor-pointer ${
                activeSheet === 'striver'
                  ? 'bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] text-white shadow-[0_0_15px_rgba(14,67,251,0.5)]'
                  : 'text-[#AEB9E1] hover:text-white'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span title="The LeetCode-hosted problems from Striver's SDE sheet">Striver SDE (LeetCode)</span>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-mono">
                {computedSheets.striver?.solvedProblems}/{computedSheets.striver?.totalProblems}
              </span>
            </button>
          </div>
        </div>

        {/* Sheet Overall Progress Metric Bar */}
        <div className="mt-6 rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#081028]/70 p-5 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase font-bold text-[#7E89AC] tracking-wider">
                Overall Sheet Progress
              </p>
              <p className="text-2xl font-black font-mono text-white mt-0.5">
                {progress.percent}%{' '}
                <span className="text-sm font-semibold text-[#7E89AC]">
                  ({progress.solvedProblems} / {progress.totalProblems} solved)
                </span>
              </p>
            </div>

            {/* Difficulty breakdown pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="rounded-xl border border-[#14CA74]/30 bg-[#14CA74]/10 px-3 py-1.5 font-bold text-[#14CA74]">
                Easy: {progress.easy.solved}/{progress.easy.total}
              </span>
              <span className="rounded-xl border border-[#FDB52A]/30 bg-[#FDB52A]/10 px-3 py-1.5 font-bold text-[#FDB52A]">
                Medium: {progress.medium.solved}/{progress.medium.total}
              </span>
              <span className="rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/10 px-3 py-1.5 font-bold text-[#FF5A65]">
                Hard: {progress.hard.solved}/{progress.hard.total}
              </span>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.15)]">
            <div
              style={{ width: `${progress.percent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#0E43FB] via-[#00C2FF] to-[#14CA74] shadow-[0_0_12px_rgba(0,194,255,0.6)] transition-all duration-700"
            />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[rgba(126,137,172,0.14)]">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E89AC]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problem name or category..."
              className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Difficulty Filter */}
            <div className="inline-flex rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-1 text-[11px]">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    difficultyFilter === diff
                      ? 'bg-[#0E43FB] text-white'
                      : 'text-[#AEB9E1] hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-1 text-[11px]">
              {(['All', 'Solved', 'Unsolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    statusFilter === st
                      ? 'bg-[#0E43FB] text-white'
                      : 'text-[#AEB9E1] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Problem List */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-10 text-center text-sm text-[#AEB9E1]">
            No problems match your current search and filters.
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isCollapsed = !!collapsedCategories[cat.category];
            const catPercent = cat.total > 0 ? Math.round((cat.solved / cat.total) * 100) : 0;

            return (
              <div
                key={cat.category}
                className="overflow-hidden rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] shadow-lg"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-[#0A1330]/80 hover:bg-[#0A1330] transition border-b border-[rgba(126,137,172,0.12)] text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm md:text-base font-bold text-white">
                      {cat.category}
                    </span>
                    <span className="rounded-full bg-[#081028] border border-[rgba(126,137,172,0.2)] px-2.5 py-0.5 text-[11px] font-mono text-[#00C2FF] font-semibold">
                      {cat.solved} / {cat.total} Done ({catPercent}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 hidden sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#081028]">
                        <div
                          style={{ width: `${catPercent}%` }}
                          className="h-full bg-gradient-to-r from-[#0E43FB] to-[#00C2FF]"
                        />
                      </div>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-[#7E89AC]" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-[#7E89AC]" />
                    )}
                  </div>
                </button>

                {/* Problem Rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-[rgba(126,137,172,0.1)]">
                    {cat.problems.map((problem) => {
                      const diffColor =
                        problem.difficulty === 'Easy'
                          ? 'text-[#14CA74] bg-[#14CA74]/10 border-[#14CA74]/30'
                          : problem.difficulty === 'Medium'
                          ? 'text-[#FDB52A] bg-[#FDB52A]/10 border-[#FDB52A]/30'
                          : 'text-[#FF5A65] bg-[#FF5A65]/10 border-[#FF5A65]/30';

                      return (
                        <div
                          key={problem.id}
                          className={`flex items-center justify-between px-6 py-3.5 transition-colors ${
                            problem.isSolved
                              ? 'bg-[#14CA74]/5 hover:bg-[#14CA74]/10'
                              : 'hover:bg-[#0A1330]/50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <button
                              type="button"
                              onClick={() => toggleProblemSolved(problem.id, problem.isSolved)}
                              title={problem.isSolved ? 'Mark as unsolved' : 'Mark as solved'}
                              className="cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                            >
                              {problem.isSolved ? (
                                <CheckCircle2 className="h-5 w-5 text-[#14CA74] drop-shadow-[0_0_8px_rgba(20,202,116,0.6)]" />
                              ) : (
                                <Circle className="h-5 w-5 text-[#7E89AC]/50 hover:text-[#14CA74]" />
                              )}
                            </button>
                            <div>
                              <a
                                href={problem.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`text-xs md:text-sm font-semibold transition hover:text-[#00C2FF] flex items-center gap-1.5 ${
                                  problem.isSolved ? 'text-white line-through opacity-75' : 'text-[#D1DBF9]'
                                }`}
                              >
                                <span>{problem.title}</span>
                                <ExternalLink className="h-3 w-3 text-[#7E89AC]" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${diffColor}`}
                            >
                              {problem.difficulty}
                            </span>
                            <Link
                              href={`/reviewer?problem=${encodeURIComponent(problem.title)}&platform=leetcode`}
                              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-[#CB3CFF]/25 bg-[#CB3CFF]/10 px-2.5 py-1 text-[11px] font-semibold text-[#CB3CFF] transition hover:border-[#CB3CFF] hover:text-white"
                              title="Inspect Complexity in AI Reviewer"
                            >
                              <Bot className="h-3 w-3" />
                              <span>AI Review</span>
                            </Link>
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-3 py-1 text-[11px] font-semibold text-[#AEB9E1] transition hover:border-[#0E43FB] hover:text-white"
                            >
                              {problem.isSolved ? 'Review' : 'Solve'}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
