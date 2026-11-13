'use client';

import React, { useState, useTransition } from 'react';
import type { CompareProfile } from '@/lib/compare';
import {
  Swords,
  Trophy,
  Zap,
  ArrowRight,
  UserPlus,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CompareViewProps {
  user1: CompareProfile | null;
  user2: CompareProfile | null;
  u1Query: string;
  u2Query: string;
}

export const CompareView: React.FC<CompareViewProps> = ({
  user1,
  user2,
  u1Query,
  u2Query,
}) => {
  const router = useRouter();
  const [input1, setInput1] = useState(u1Query || '');
  const [input2, setInput2] = useState(u2Query || '');
  // Pending until the new comparison has rendered (Next keeps router.push inside the transition)
  const [isComparing, startCompare] = useTransition();

  const handleCompare = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input1.trim()) return;
    const query2 = input2.trim() ? `&u2=${encodeURIComponent(input2.trim())}` : '';
    startCompare(() => {
      router.push(`/compare?u1=${encodeURIComponent(input1.trim())}${query2}`);
    });
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
      <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-6 shadow-xl">
        <form onSubmit={handleCompare} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
            {/* User 1 Input */}
            <div className="relative">
              <label htmlFor="compare-p1" className="block text-xs font-bold uppercase text-[#00C2FF] mb-1.5">
                Player 1 (Left)
              </label>
              <div className="relative flex items-center">
                <input
                  id="compare-p1"
                  type="text"
                  autoComplete="off"
                  value={input1}
                  onChange={(e) => setInput1(e.target.value)}
                  placeholder="Your Handle / Username"
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] px-4 py-2.5 text-sm font-mono text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none focus:ring-1 focus:ring-[#00C2FF]"
                />
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex justify-center pt-5">
              <button
                type="submit"
                disabled={isComparing}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB] text-white transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Run Head-to-Head Comparison"
                aria-label="Run head-to-head comparison"
              >
                {isComparing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Swords className="h-6 w-6" />}
              </button>
            </div>

            {/* User 2 Input */}
            <div className="relative">
              <label htmlFor="compare-p2" className="block text-xs font-bold uppercase text-[#8B5CF6] mb-1.5">
                Player 2 (Right)
              </label>
              <div className="relative flex items-center">
                <input
                  id="compare-p2"
                  type="text"
                  autoComplete="off"
                  value={input2}
                  onChange={(e) => setInput2(e.target.value)}
                  placeholder="Enter rival username, CF handle, or LC handle"
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] px-4 py-2.5 text-sm font-mono text-white placeholder-[#7E89AC] focus:border-[#8B5CF6] focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <p className="text-[#7E89AC]">
              Compare against any registered DashCode user or live public profile on <span className="text-white font-mono">Codeforces</span> / <span className="text-white font-mono">LeetCode</span>.
            </p>

            <button
              type="submit"
              disabled={isComparing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 font-bold text-white transition hover:bg-[#00C2FF] hover:text-[#081028] disabled:opacity-50 cursor-pointer"
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Comparing Profiles...</span>
                </>
              ) : (
                <>
                  <span>Compare Now</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Arena Header */}
      {user1 && user2 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Card */}
            <div className="rounded-3xl border border-[#00C2FF]/30 bg-[#0E1628] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded-md bg-[#00C2FF]/15 border border-[#00C2FF]/30 px-2 py-0.5 text-[11px] font-mono font-bold text-[#00C2FF] uppercase">
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
                  <p className="text-xs text-[#7E89AC] uppercase font-bold">Total Solved</p>
                  <p className="text-3xl font-extrabold font-mono text-[#00C2FF]">{user1.totalSolved}</p>
                </div>
              </div>

              {/* Player 1 Quick Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(126,137,172,0.15)] pt-4 text-center">
                <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Streak</p>
                  <p className="text-base font-bold font-mono text-[#FFB016]">{user1.currentStreak}d</p>
                </div>
                <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Peak Rating</p>
                  <p className="text-base font-bold font-mono text-white">
                    {user1.highestRating || 'Unrated'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Hard Solves</p>
                  <p className="text-base font-bold font-mono text-[#FF5A65]">{user1.difficulty.hard}</p>
                </div>
              </div>
            </div>

            {/* Player 2 Card */}
            <div className="rounded-3xl border border-[#8B5CF6]/30 bg-[#0E1628] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2 py-0.5 text-[11px] font-mono font-bold text-[#8B5CF6] uppercase">
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
                  <p className="text-xs text-[#7E89AC] uppercase font-bold">Total Solved</p>
                  <p className="text-3xl font-extrabold font-mono text-[#8B5CF6]">{user2.totalSolved}</p>
                </div>
              </div>

              {/* Player 2 Quick Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(126,137,172,0.15)] pt-4 text-center">
                <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Streak</p>
                  <p className="text-base font-bold font-mono text-[#FFB016]">{user2.currentStreak}d</p>
                </div>
                <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Peak Rating</p>
                  <p className="text-base font-bold font-mono text-white">
                    {user2.highestRating || 'Unrated'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                  <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Hard Solves</p>
                  <p className="text-base font-bold font-mono text-[#FF5A65]">{user2.difficulty.hard}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Head-to-Head Category Faceoff */}
          <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-7 shadow-xl space-y-6">
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
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#00C2FF] flex items-center gap-1.5">
                        {user1.totalSolved} Solved
                        {winner === 1 && <span className="rounded bg-[#00C2FF]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                      </span>
                      <span className="text-[#AEB9E1] font-sans font-bold uppercase tracking-wider text-xs">
                        Total Solved Problems
                      </span>
                      <span className="font-bold text-[#8B5CF6] flex items-center gap-1.5">
                        {winner === 2 && <span className="rounded bg-[#8B5CF6]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                        {user2.totalSolved} Solved
                      </span>
                    </div>
                    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-[#2563EB] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-[#7C3AED] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Peak Contest Rating Bar */}
              {(() => {
                const r1 = user1.highestRating || 0;
                const r2 = user2.highestRating || 0;
                const { p1, p2 } = getRatio(r1, r2);
                const winner = r1 > r2 ? 1 : r1 < r2 ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#00C2FF] flex items-center gap-1.5">
                        {r1 ? `${r1} Rating` : 'Unrated'}
                        {winner === 1 && <span className="rounded bg-[#00C2FF]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                      </span>
                      <span className="text-[#AEB9E1] font-sans font-bold uppercase tracking-wider text-xs">
                        Peak Contest Rating
                      </span>
                      <span className="font-bold text-[#8B5CF6] flex items-center gap-1.5">
                        {winner === 2 && <span className="rounded bg-[#8B5CF6]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                        {r2 ? `${r2} Rating` : 'Unrated'}
                      </span>
                    </div>
                    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-[#2563EB] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-[#7C3AED] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Hard Questions Solved Bar */}
              {(() => {
                const h1 = user1.difficulty.hard;
                const h2 = user2.difficulty.hard;
                const { p1, p2 } = getRatio(h1, h2);
                const winner = h1 > h2 ? 1 : h1 < h2 ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#00C2FF] flex items-center gap-1.5">
                        {h1} Hard Solves
                        {winner === 1 && <span className="rounded bg-[#00C2FF]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                      </span>
                      <span className="text-[#AEB9E1] font-sans font-bold uppercase tracking-wider text-xs">
                        Hard Difficulty Solves
                      </span>
                      <span className="font-bold text-[#8B5CF6] flex items-center gap-1.5">
                        {winner === 2 && <span className="rounded bg-[#8B5CF6]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                        {h2} Hard Solves
                      </span>
                    </div>
                    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-[#2563EB] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-[#7C3AED] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Longest Daily Streak */}
              {(() => {
                const s1 = user1.longestStreak;
                const s2 = user2.longestStreak;
                const { p1, p2 } = getRatio(s1, s2);
                const winner = s1 > s2 ? 1 : s1 < s2 ? 2 : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#00C2FF] flex items-center gap-1.5">
                        {s1} Days Streak
                        {winner === 1 && <span className="rounded bg-[#00C2FF]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                      </span>
                      <span className="text-[#AEB9E1] font-sans font-bold uppercase tracking-wider text-xs">
                        Longest Daily Streak
                      </span>
                      <span className="font-bold text-[#8B5CF6] flex items-center gap-1.5">
                        {winner === 2 && <span className="rounded bg-[#8B5CF6]/20 px-1 py-0.2 text-[11px]">Ahead</span>}
                        {s2} Days Streak
                      </span>
                    </div>
                    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.15)]">
                      <div
                        style={{ width: `${p1}%` }}
                        className="h-full rounded-l-full bg-[#2563EB] transition-all duration-500"
                      />
                      <div
                        style={{ width: `${p2}%` }}
                        className="h-full rounded-r-full bg-[#7C3AED] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* DSA Topic-by-Topic Breakdown Table */}
          {allTopics.length > 0 && (
            <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-7 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#00C2FF]" />
                <span>Topic-by-Topic Domination</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(126,137,172,0.18)] bg-[#0B1222] text-xs uppercase text-[#AEB9E1]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Topic / Pattern</th>
                      <th className="py-3 px-4 text-center">@{user1.username}</th>
                      <th className="py-3 px-4 text-center">Faceoff Split</th>
                      <th className="py-3 px-4 text-center">@{user2.username}</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Dominance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(126,137,172,0.1)]">
                    {allTopics.map((topic) => {
                      const count1 = user1.topicBreakdown[topic] || 0;
                      const count2 = user2.topicBreakdown[topic] || 0;
                      const { p1, p2 } = getRatio(count1, count2);
                      const winner = count1 > count2 ? 1 : count1 < count2 ? 2 : 0;

                      return (
                        <tr key={topic} className="hover:bg-[#0B1222]/50 transition">
                          <td className="py-3 px-4 font-semibold text-white">{topic}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#00C2FF]">
                            {count1}
                          </td>
                          <td className="py-3 px-4 text-center w-48">
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#0B1222]">
                              <div style={{ width: `${p1}%` }} className="h-full bg-[#00C2FF]" />
                              <div style={{ width: `${p2}%` }} className="h-full bg-[#8B5CF6]" />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#8B5CF6]">
                            {count2}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {winner === 1 ? (
                              <span className="text-[#00C2FF]">@{user1.username} (+{count1 - count2})</span>
                            ) : winner === 2 ? (
                              <span className="text-[#8B5CF6]">@{user2.username} (+{count2 - count1})</span>
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
      ) : user1 ? (
        /* Player 1 is loaded, awaiting or failed to find Player 2 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player 1 Card */}
          <div className="rounded-3xl border border-[#00C2FF]/30 bg-[#0E1628] p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-md bg-[#00C2FF]/15 border border-[#00C2FF]/30 px-2 py-0.5 text-[11px] font-mono font-bold text-[#00C2FF] uppercase">
                  Player 1 (Active)
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
                <p className="text-xs text-[#7E89AC] uppercase font-bold">Total Solved</p>
                <p className="text-3xl font-extrabold font-mono text-[#00C2FF]">{user1.totalSolved}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(126,137,172,0.15)] pt-4 text-center">
              <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Streak</p>
                <p className="text-base font-bold font-mono text-[#FFB016]">{user1.currentStreak}d</p>
              </div>
              <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Peak Rating</p>
                <p className="text-base font-bold font-mono text-white">
                  {user1.highestRating || 'Unrated'}
                </p>
              </div>
              <div className="rounded-xl bg-[#0B1222]/60 p-2.5">
                <p className="text-[11px] text-[#7E89AC] uppercase font-bold">Hard Solves</p>
                <p className="text-base font-bold font-mono text-[#FF5A65]">{user1.difficulty.hard}</p>
              </div>
            </div>
          </div>

          {/* Player 2 Slot: Awaiting or Not Found */}
          <div className="rounded-3xl border border-dashed border-[rgba(126,137,172,0.3)] bg-[#0E1628]/50 p-8 flex flex-col items-center justify-center text-center space-y-3">
            {u2Query ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Coder &quot;{u2Query}&quot; Not Found
                </h4>
                <p className="text-xs text-[#AEB9E1] max-w-xs">
                  We checked DashCode registered accounts, Codeforces, and LeetCode public profiles. Please verify the handle spelling above.
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Choose a Rival to Face Off
                </h4>
                <p className="text-xs text-[#AEB9E1] max-w-xs">
                  Enter any DashCode username or any real Codeforces / LeetCode handle in the Player 2 box above to start the 1v1 battle!
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Neither found */
        <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1222] border border-[rgba(126,137,172,0.2)] text-[#FF5A65]">
            <Swords className="h-7 w-7" />
          </div>
          {u1Query ? (
            <>
              <h3 className="text-xl font-bold text-white">Coder &quot;{u1Query}&quot; Not Found</h3>
              <p className="text-sm text-[#AEB9E1] max-w-md mx-auto">
                We checked DashCode usernames and public Codeforces / LeetCode profiles. Check the spelling in the Player 1 box above.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white">Pick two coders to compare</h3>
              <p className="text-sm text-[#AEB9E1] max-w-md mx-auto">
                Enter a DashCode username or any public Codeforces / LeetCode handle in each box above, then press Compare Now.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
