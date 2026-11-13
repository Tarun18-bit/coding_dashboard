'use client';

import React, { useState } from 'react';
import type { CompanyReadinessResult } from '@/lib/company-readiness';
import Link from 'next/link';
import { Briefcase, TrendingUp, ExternalLink, ChevronRight, CheckCircle2, Sparkles, ShieldCheck, Target } from 'lucide-react';

interface CompanyReadinessProps {
  results: CompanyReadinessResult[];
}

export const CompanyReadiness: React.FC<CompanyReadinessProps> = ({ results }) => {
  const [selectedId, setSelectedId] = useState<string>(results[0]?.company.id || 'google');

  if (!results || results.length === 0) return null;

  const current = results.find((r) => r.company.id === selectedId) || results[0];

  return (
    <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(126,137,172,0.14)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#00C2FF]" />
              <span>Target Company Interview Readiness</span>
            </h2>
            <span className="rounded-full bg-[#CB3CFF]/15 border border-[#CB3CFF]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#CB3CFF] flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              GAP ANALYSIS
            </span>
          </div>
          <p className="text-xs text-[#7E89AC] mt-1">
            Estimated topic weights for each company, matched against the problems you&apos;ve solved
          </p>
        </div>

        {/* Company Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-1">
          {results.map((r) => {
            const isSelected = r.company.id === selectedId;
            return (
              <button
                key={r.company.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(r.company.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#0E43FB] text-white shadow-[0_0_15px_rgba(14,67,251,0.5)]'
                    : 'text-[#AEB9E1] hover:text-white hover:bg-[#0B1739]'
                }`}
              >
                <span>{r.company.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#0B1739] text-[#7E89AC] border border-[rgba(126,137,172,0.15)]'
                  }`}
                >
                  {r.overallScore}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Company Focus View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overall Score & Strategic Gap Recommendations */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${current.company.badgeBg} ${current.company.badgeText}`}>
                  {current.company.name}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{current.company.tagline}</h3>
              </div>
            </div>

            {/* Score Ring Display */}
            <div className="flex items-center gap-4 py-2">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#081028] border border-[rgba(126,137,172,0.2)] shadow-inner">
                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                  {current.overallScore}%
                </span>
              </div>
              <div>
                <p className="text-[11px] text-[#7E89AC] uppercase font-bold tracking-wider">Interview Status</p>
                <span className={`inline-block mt-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${current.statusColor}`}>
                  {current.status}
                </span>
                <p className="text-[11px] text-[#AEB9E1] mt-1.5">
                  Target: {current.company.difficultyTarget.medium}+ Mediums, {current.company.difficultyTarget.hard}+ Hards
                </p>
              </div>
            </div>

            {/* High-Yield Gap Advice Box */}
            <div className="rounded-xl border border-[rgba(14,67,251,0.3)] bg-[#0E43FB]/10 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00C2FF]">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>How to boost your score:</span>
              </div>
              {current.topGaps.length === 0 ? (
                <p className="text-xs text-[#14CA74] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  No critical gaps! Great balanced topic coverage for {current.company.name}.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {current.topGaps.map((gap, i) => (
                    <div key={i} className="text-[11px] text-[#D1DBF9] flex items-start gap-1.5">
                      <span className="text-[#00C2FF] font-bold">•</span>
                      <span>
                        Solve <strong className="text-white font-mono">{gap.gapCount}</strong> more{' '}
                        <strong className="text-[#00C2FF] capitalize">{gap.topic}</strong> problems to gain{' '}
                        <span className="font-mono font-bold text-[#14CA74]">+{gap.potentialBoost}%</span> readiness.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Topic Breakdown Grid */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1]">
              Topic Weight Breakdown
            </h4>
            <span className="text-[11px] text-[#7E89AC] font-mono">Solved / Target</span>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-4">
            {current.topicBreakdown.map((item) => {
              const isMet = item.matchScore >= 100;
              return (
                <div key={item.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="capitalize text-white font-sans font-medium flex items-center gap-1.5">
                      {isMet ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#14CA74]" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#00C2FF]" />
                      )}
                      <span>{item.topic}</span>
                      <span className="text-[10px] text-[#7E89AC]">({item.weight}% wt)</span>
                    </span>
                    <span className="text-[#AEB9E1] font-semibold">
                      <span className={item.userSolved > 0 ? 'text-[#00C2FF]' : 'text-[#7E89AC]'}>
                        {item.userSolved}
                      </span>{' '}
                      / {item.targetCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#081028] border border-[rgba(126,137,172,0.1)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMet
                          ? 'bg-[#14CA74] shadow-[0_0_8px_rgba(20,202,116,0.5)]'
                          : item.matchScore >= 50
                          ? 'bg-gradient-to-r from-[#0E43FB] to-[#00C2FF]'
                          : 'bg-[#FDB52A]'
                      }`}
                      style={{ width: `${Math.min(100, item.matchScore)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: publicly reported questions for this company (each one linked to its source) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1]">Reported Interview Questions</h4>
            <span className="rounded bg-[#14CA74]/15 border border-[#14CA74]/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#14CA74]">
              SOURCED
            </span>
          </div>
          <p className="text-[11px] text-[#7E89AC] px-1">
            Each question links to the public interview report or OA write-up it comes from. Practice them under a timer in the Mock Arena.
          </p>

          <div className="space-y-2.5 rounded-2xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-4 max-h-[460px] overflow-y-auto">
            {current.curatedSuggestions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#7E89AC] space-y-2">
                <p>No sourced {current.company.name} questions in the bank yet.</p>
                <Link href="/mock-interview" className="inline-flex items-center gap-1 font-semibold text-[#00C2FF] hover:underline">
                  Practice another company <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              current.curatedSuggestions.map((prob) => {
                const diffColor =
                  prob.difficulty === 'Easy'
                    ? 'text-[#14CA74] border-[#14CA74]/30 bg-[#14CA74]/10'
                    : prob.difficulty === 'Medium'
                    ? 'text-[#FDB52A] border-[#FDB52A]/30 bg-[#FDB52A]/10'
                    : 'text-[#FF5A65] border-[#FF5A65]/30 bg-[#FF5A65]/10';

                return (
                  <div
                    key={prob.id}
                    className="rounded-xl border border-[rgba(126,137,172,0.14)] bg-[#0B1739] p-3.5 space-y-2.5 transition hover:border-[#0E43FB]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href="/mock-interview"
                        className="group flex items-center gap-1.5 font-bold text-xs text-white hover:text-[#00C2FF] transition"
                        title="Practice in the Mock Arena"
                      >
                        <span>{prob.title}</span>
                        <ChevronRight className="h-3 w-3 text-[#7E89AC] group-hover:text-[#00C2FF]" />
                      </Link>
                      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${diffColor}`}>
                        {prob.difficulty}
                      </span>
                    </div>

                    {prob.reportedRound && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#00C2FF] font-medium bg-[#0E43FB]/15 border border-[#0E43FB]/30 rounded-lg px-2 py-1">
                        <Target className="h-3 w-3 shrink-0 text-[#00C2FF]" />
                        <span className="truncate">{prob.reportedRound}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 border-t border-[rgba(126,137,172,0.1)]">
                      <span className="text-[#7E89AC] font-mono">{prob.topic}</span>
                      <a
                        href={prob.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#14CA74] hover:underline"
                        title={prob.sourceName}
                      >
                        <ShieldCheck className="h-3 w-3 text-[#14CA74]" />
                        <span>Source</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
