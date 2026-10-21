'use client';

import React, { useState } from 'react';
import { CompareProfile } from '@/lib/compare';
import {
  Swords,
  Trophy,
  Flame,
  Award,
  Zap,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CompareViewProps {
  user1: CompareProfile | null;
  user2: CompareProfile | null;
  u1Query: string;
  u2Query: string;
}

const PRESETS = [
  { label: 'txrun_18 (You)', value: 'txrun_18' },
  { label: 'Striver (SDE Prep)', value: 'striver' },
  { label: 'Neal Wu (Grandmaster)', value: 'neal_wu' },
  { label: 'Tourist (Legend)', value: 'tourist' },
];

export const CompareView: React.FC<CompareViewProps> = ({
  user1,
  user2,
  u1Query,
  u2Query,
}) => {
  const router = useRouter();
  const [input1, setInput1] = useState(u1Query || 'txrun_18');
  const [input2, setInput2] = useState(u2Query || 'striver');

  const handleCompare = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input1.trim() || !input2.trim()) return;
    router.push(`/compare?u1=${encodeURIComponent(input1.trim())}&u2=${encodeURIComponent(input2.trim())}`);
  };

  // Helper to calculate advantage % for side-by-side bars
  const getRatio = (v1: number, v2: number) => {
    const total = v1 + v2;
    if (total === 0) return { p1: 50, p2: 50 };
    return {
      p1: Math.round((v1 / total) * 100),
      p2: Math.round((v2 / total) * 100),
    };
  };

  // All combined topics
  const allTopics = Array.from(
    new Set([
      ...Object.keys(user1?.topicBreakdown || {}),
      ...Object.keys(user2?.topicBreakdown || {}),
    ])
  ).slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Search & Compare Selector Box */}
      <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl">
        <form onSubmit={handleCompare} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
            {/* User 1 Input */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase text-[#00C2FF] mb-1.5">
                Player 1 (Left)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input1}
                  onChange={(e) => setInput1(e.target.value)}
                  placeholder="Username / Handle (e.g. txrun_18)"
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-4 py-2.5 text-sm font-mono text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                />
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex justify-center pt-5">
              <button
                type="submit"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0E43FB] to-[#CB3CFF] text-white shadow-[0_0_20px_rgba(203,60,255,0.4)] transition hover:scale-105 active:scale-95"
                title="Run Head-to-Head Comparison"
              >
                <Swords className="h-6 w-6" />
              </button>
            </div>

            {/* User 2 Input */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase text-[#CB3CFF] mb-1.5">
                Player 2 (Right)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input2}
                  onChange={(e) => setInput2(e.target.value)}
                  placeholder="Opponent / Handle (e.g. striver, tourist)"
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-4 py-2.5 text-sm font-mono text-white placeholder-[#7E89AC] focus:border-[#CB3CFF] focus:outline-none focus:ring-1 focus:ring-[#CB3CFF]"
                />
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#7E89AC]">Quick Rivals:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setInput2(p.value);
                    router.push(`/compare?u1=${encodeURIComponent(input1.trim())}&u2=${encodeURIComponent(p.value)}`);
                  }}
                  className="rounded-lg border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2.5 py-1 font-mono text-[11px] text-[#AEB9E1] transition hover:border-[#0E43FB] hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E43FB] px-5 py-2 font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:bg-[#00C2FF] hover:text-[#081028]"
            >
              <span>Compare Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Arena Header */}
      {user1 && user2 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Card */}
            <div className="rounded-3xl border border-[#00C2FF]/30 bg-gradient-to-b from-[#0B1739] to-[#0A1330] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#00C2FF]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded-md bg-[#00C2FF]/15 border border-[#00C2FF]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00C2FF] uppercase">
                    Player 1
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-1.5">
                    <Link href={`/u/${user1.username}`} className="hover:underline">
                      @{user1.username}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#7E89AC] font-mono mt-0.5">
                    {user1.platforms.join(' • ') || 'Multi-platform'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Total Solved</p>
                  <p className="text-3xl font-extrabold font-mono text-[#00C2FF]">{user1.totalSolved}</p>
                </div>
              </div>

              {/* Player 1 Quick Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(126,137,172,0.15)] pt-4 text-center">
                <div className="rounded-xl bg-[#081028]/60 p-2.5">
                  <p className="text-[10px] text-[#7E89AC] uppercase font-bold">Streak</p>
                  <p className="text-base font-bold font-mono text-[#FFB016]">{user1.currentStreak}d</p>
                </div>
                <div className="rounded-xl bg-[#081028]/60 p-2.5">
                  <p className="text-[10px] text-[#7E89AC] uppercase font-bold">Peak Rating</p>
                  <p className="text-base font-bold font-mono text-white">
                    {user1.highestRating || 'Unrated'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#081028]/60 p-2.5">
                  <p className="text-[10px] text-[#7E89AC] uppercase font-bold">Hard Solves</p>
                  <p className="text-base font-bold font-mono text-[#FF5A65]">{user1.difficulty.hard}</p>
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="rounded-3xl border border-[#CB3CFF]/30 bg-gradient-to-b from-[#0B1739] to-[#0A1330] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#CB3CFF]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded-md bg-[#CB3CFF]/15 border border-[#CB3CFF]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#CB3CFF] uppercase">
                    Player 2
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-1.5">
                    <Link href={`/u/${user2.username}`} className="hover:underline">
                      @{user2.username}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#7E89AC] font-mono mt-0.5">
                    {user2.platforms.join(' • ') || 'Multi-platform'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Total Solved</p>
                  <p className="text-3xl font-extrabold font-mono text-[#CB3CFF]">{user2.totalSolved}</p>
                </div>
              </div>

              {/* Player 2 Quick Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(126,137,172,0.15)] pt-4 text-center">
                <div className="rounded-xl bg-[#081028]/60 p-2.5">
                  <p className="text-[10px] text-[#7E89AC] uppercase font-bold">Streak</p>
                  <p className="text-base font-bold font-mono text-[#FFB016]">{user2.currentStreak}d</p>
                </div>
                <div className="rounded-xl bg-[#081028]/60 p-2.5">
                  <p className="text-[10px] text-[#7E89AC] uppercase font-bold">Peak Rating</p>
                  <p className="text-base font-bold font-mono text-white">
                    {user2.highestRating || 'Unrated'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#081028]/60 p-2.5">
                  <p className="text-[10px] text-[#7E89AC] uppercase font-bold">Hard Solves</p>
                  <p className="text-base font-bold font-mono text-[#FF5A65]">{user2.difficulty.hard}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Head-to-Head Category Faceoff */}
          <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-7 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#FDB52A]" />
              <span>Head-to-Head Metric Faceoff</span>
            </h3>

            {/* Metric Bars */}
            <div className="space-y-6">
              {/* Total Solved Bar */}
              {(() => {
                const { p1, p2 } = getRatio(user1.totalSolved, user2.totalSolved);
                const winner = user1.totalSolved > user2.totalSolved ? 1 : user1.totalSolved < user2.totalSolved ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={`font-bold ${winner === 1 ? 'text-[#00C2FF]' : 'text-[#AEB9E1]'}`}>
                        @{user1.username}: {user1.totalSolved} {winner === 1 && '👑'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-[#7E89AC] font-sans font-bold">
                        Total Solved
                      </span>
                      <span className={`font-bold ${winner === 2 ? 'text-[#CB3CFF]' : 'text-[#AEB9E1]'}`}>
                        {winner === 2 && '👑 '}@{user2.username}: {user2.totalSolved}
                      </span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-gradient-to-l from-[#CB3CFF] to-[#FF5A65] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Active Streak Bar */}
              {(() => {
                const { p1, p2 } = getRatio(user1.currentStreak, user2.currentStreak);
                const winner = user1.currentStreak > user2.currentStreak ? 1 : user1.currentStreak < user2.currentStreak ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={`font-bold ${winner === 1 ? 'text-[#00C2FF]' : 'text-[#AEB9E1]'}`}>
                        {user1.currentStreak} Days {winner === 1 && '🔥'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-[#7E89AC] font-sans font-bold">
                        Active Streak
                      </span>
                      <span className={`font-bold ${winner === 2 ? 'text-[#CB3CFF]' : 'text-[#AEB9E1]'}`}>
                        {winner === 2 && '🔥 '}{user2.currentStreak} Days
                      </span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-gradient-to-r from-[#FDB52A] to-[#FFB016] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-gradient-to-l from-[#CB3CFF] to-[#FF5A65] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Contest Rating Bar */}
              {(() => {
                const r1 = user1.highestRating || 0;
                const r2 = user2.highestRating || 0;
                const { p1, p2 } = getRatio(r1, r2);
                const winner = r1 > r2 ? 1 : r1 < r2 ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={`font-bold ${winner === 1 ? 'text-[#00C2FF]' : 'text-[#AEB9E1]'}`}>
                        Rating: {r1 || 'Unrated'} {winner === 1 && '⭐'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-[#7E89AC] font-sans font-bold">
                        Contest Peak Rating
                      </span>
                      <span className={`font-bold ${winner === 2 ? 'text-[#CB3CFF]' : 'text-[#AEB9E1]'}`}>
                        {winner === 2 && '⭐ '}Rating: {r2 || 'Unrated'}
                      </span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-gradient-to-r from-[#00C2FF] to-[#14CA74] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-gradient-to-l from-[#CB3CFF] to-[#9333ea] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Hard Problems Solved Bar */}
              {(() => {
                const h1 = user1.difficulty.hard;
                const h2 = user2.difficulty.hard;
                const { p1, p2 } = getRatio(h1, h2);
                const winner = h1 > h2 ? 1 : h1 < h2 ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={`font-bold ${winner === 1 ? 'text-[#00C2FF]' : 'text-[#AEB9E1]'}`}>
                        Hard Solved: {h1} {winner === 1 && '⚡'}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-[#7E89AC] font-sans font-bold">
                        Hard Solves
                      </span>
                      <span className={`font-bold ${winner === 2 ? 'text-[#CB3CFF]' : 'text-[#AEB9E1]'}`}>
                        {winner === 2 && '⚡ '}Hard Solved: {h2}
                      </span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-gradient-to-r from-[#FF5A65] to-[#FDB52A] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-gradient-to-l from-[#CB3CFF] to-[#FF5A65] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Head-to-Head Topic Breakdown Table */}
          {allTopics.length > 0 && (
            <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-7 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#00C2FF]" />
                <span>Topic Mastery Comparison</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(126,137,172,0.16)] bg-[#0A1330] text-[11px] uppercase text-[#AEB9E1]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Topic</th>
                      <th className="py-3 px-4 text-center">@{user1.username}</th>
                      <th className="py-3 px-4 text-center">Comparison</th>
                      <th className="py-3 px-4 text-center">@{user2.username}</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Leader</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(126,137,172,0.1)]">
                    {allTopics.map((topic) => {
                      const count1 = user1.topicBreakdown[topic] || 0;
                      const count2 = user2.topicBreakdown[topic] || 0;
                      const winner = count1 > count2 ? 1 : count1 < count2 ? 2 : 0;
                      const { p1, p2 } = getRatio(count1, count2);

                      return (
                        <tr key={topic} className="hover:bg-[#0A1330]/50 transition">
                          <td className="py-3 px-4 font-semibold text-white">{topic}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#00C2FF]">
                            {count1}
                          </td>
                          <td className="py-3 px-4 text-center w-48">
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#081028]">
                              <div style={{ width: `${p1}%` }} className="h-full bg-[#00C2FF]" />
                              <div style={{ width: `${p2}%` }} className="h-full bg-[#CB3CFF]" />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#CB3CFF]">
                            {count2}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {winner === 1 ? (
                              <span className="text-[#00C2FF]">@{user1.username} (+{count1 - count2})</span>
                            ) : winner === 2 ? (
                              <span className="text-[#CB3CFF]">@{user2.username} (+{count2 - count1})</span>
                            ) : (
                              <span className="text-[#7E89AC]">Tied</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A1330] border border-[rgba(126,137,172,0.2)] text-[#FF5A65]">
            <Swords className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white">Could not find one or both coders</h3>
          <p className="text-sm text-[#AEB9E1] max-w-md mx-auto">
            Please check the spelling of the usernames or handles. You can compare against any registered user or benchmark rivals like <code>striver</code> or <code>tourist</code>.
          </p>
        </div>
      )}
    </div>
  );
};
