'use client';

import React, { useState } from 'react';
import { LeaderboardEntry } from '@/lib/leaderboard';
import { Flame, ArrowUpRight, Award, Swords, Star } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardTableProps {
  initialEntries: LeaderboardEntry[];
  currentUsername?: string;
}

const PLATFORM_ABBR: Record<string, string> = { codeforces: 'CF', leetcode: 'LC', codechef: 'CC', gfg: 'GFG' };

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  initialEntries,
  currentUsername,
}) => {
  const [sortKey, setSortKey] = useState<'solved' | 'streak' | 'rating'>('solved');

  const sortedEntries = [...initialEntries].sort((a, b) => {
    if (sortKey === 'streak') {
      return b.currentStreak - a.currentStreak || b.totalSolved - a.totalSolved;
    }
    if (sortKey === 'rating') {
      const aR = a.highestRating || 0;
      const bR = b.highestRating || 0;
      return bR - aR || b.totalSolved - a.totalSolved;
    }
    return b.totalSolved - a.totalSolved || b.currentStreak - a.currentStreak;
  });

  const top3 = sortedEntries.slice(0, 3);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FDB52A]/20 text-[#FDB52A] border border-[#FDB52A]/40 font-bold font-mono text-xs">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#AEB9E1]/20 text-[#D1DBF9] border border-[#AEB9E1]/40 font-bold font-mono text-xs">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FFB016]/20 text-[#FFB016] border border-[#FFB016]/40 font-bold font-mono text-xs">
          🥉
        </span>
      );
    }
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0B1222] text-[#7E89AC] border border-[rgba(126,137,172,0.18)] font-bold font-mono text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Controls & Sorting Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(126,137,172,0.14)] pb-4">
        {/* Sort Tabs */}
        <div className="inline-flex rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#0B1222] p-1 text-xs">
          <button
            onClick={() => setSortKey('solved')}
            className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${
              sortKey === 'solved'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#AEB9E1] hover:text-white'
            }`}
          >
            Most Solved
          </button>
          <button
            onClick={() => setSortKey('streak')}
            className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${
              sortKey === 'streak'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#AEB9E1] hover:text-white'
            }`}
          >
            Longest Streak
          </button>
          <button
            onClick={() => setSortKey('rating')}
            className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${
              sortKey === 'rating'
                ? 'bg-[#2563EB] text-white'
                : 'text-[#AEB9E1] hover:text-white'
            }`}
          >
            Highest Rating
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {top3.map((entry, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={entry.userId}
                className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  isFirst
                    ? 'border-[#FDB52A]/50 bg-[#0E1628] md:-translate-y-2'
                    : 'border-[rgba(126,137,172,0.18)] bg-[#0E1628] shadow-lg shadow-[rgba(1,5,17,0.4)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getRankBadge(idx + 1)}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#00C2FF] transition flex items-center gap-1.5">
                        <Link href={`/u/${entry.username}`}>@{entry.username}</Link>
                        {isFirst && <Star className="h-4 w-4 fill-[#FDB52A] text-[#FDB52A]" />}
                      </h3>
                      <p className="text-xs text-[#7E89AC] font-mono">
                        {entry.connectedPlatforms.join(' • ') || 'No platforms'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={currentUsername ? `/compare?u1=${encodeURIComponent(currentUsername)}&u2=${encodeURIComponent(entry.username)}` : `/compare?u1=${encodeURIComponent(entry.username)}`}
                    className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0B1222] p-2 text-[#AEB9E1] hover:border-[#2563EB] hover:text-white transition"
                    title={`Compare with @${entry.username}`}
                  >
                    <Swords className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[rgba(126,137,172,0.14)] pt-4 text-center">
                  <div>
                    <p className="text-[11px] text-[#7E89AC] font-bold uppercase">Solved</p>
                    <p className="text-lg font-bold text-white font-mono">{entry.totalSolved}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7E89AC] font-bold uppercase">Streak</p>
                    <p className="text-lg font-bold text-[#FFB016] font-mono">{entry.currentStreak}d</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7E89AC] font-bold uppercase">Rating</p>
                    <p className="text-lg font-bold text-[#00C2FF] font-mono">
                      {entry.highestRating || '—'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(126,137,172,0.16)] bg-[#0B1222] text-xs uppercase tracking-wider text-[#AEB9E1]">
              <tr>
                <th className="py-3 px-3.5 rounded-l-xl w-14">Rank</th>
                <th className="py-3 px-3.5">User</th>
                <th className="py-3 px-3.5 text-center">Platforms</th>
                <th className="py-3 px-3.5 text-right">Total Solved</th>
                <th className="py-3 px-3.5 text-center">Difficulty (E / M / H)</th>
                <th className="py-3 px-3.5 text-center">Active Streak</th>
                <th className="py-3 px-3.5 text-right">Contest Rating</th>
                <th className="py-3 px-3.5 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(126,137,172,0.1)]">
              {sortedEntries.map((user, i) => {
                const isMe = currentUsername && user.username.toLowerCase() === currentUsername.toLowerCase();
                return (
                  <tr
                    key={user.userId}
                    className={`transition-colors ${
                      isMe ? 'bg-[#2563EB]/15 border-l-2 border-l-[#2563EB]' : 'hover:bg-[#0B1222]/70'
                    }`}
                  >
                    <td className="py-3.5 px-3.5 font-mono font-bold">
                      {getRankBadge(i + 1)}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/u/${user.username}`}
                          className="font-bold text-white hover:text-[#00C2FF] transition flex items-center gap-1.5"
                        >
                          <span>@{user.username}</span>
                          {isMe && (
                            <span className="rounded-md bg-[#00C2FF]/15 border border-[#00C2FF]/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#00C2FF]">
                              YOU
                            </span>
                          )}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {user.connectedPlatforms.map((p) => (
                          <span
                            key={p}
                            className="rounded-md border border-[rgba(126,137,172,0.18)] bg-[#0B1222] px-1.5 py-0.5 text-[11px] font-mono font-semibold uppercase text-[#AEB9E1]"
                          >
                            {PLATFORM_ABBR[p.toLowerCase()] || p.slice(0, 2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-sm text-white">
                      {user.totalSolved}
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-[#14CA74] font-semibold">{user.easy}</span>
                        <span className="text-[#7E89AC]">/</span>
                        <span className="text-[#FDB52A] font-semibold">{user.medium}</span>
                        <span className="text-[#7E89AC]">/</span>
                        <span className="text-[#FF5A65] font-semibold">{user.hard}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB016]/15 border border-[#FFB016]/30 px-2.5 py-0.5 text-xs font-mono font-bold text-[#FFB016]">
                        <Flame className="h-3 w-3" />
                        <span>{user.currentStreak}d</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-bold text-sm text-[#00C2FF]">
                      {user.highestRating ? (
                        <>
                          <span>{user.highestRating}</span>
                          <span className="text-[11px] font-normal text-[#7E89AC] ml-1 uppercase">
                            ({PLATFORM_ABBR[user.bestPlatform.toLowerCase()] || user.bestPlatform.slice(0, 2)})
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-normal text-[#7E89AC]">Unrated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <Link
                        href={currentUsername ? `/compare?u1=${encodeURIComponent(currentUsername)}&u2=${encodeURIComponent(user.username)}` : `/compare?u1=${encodeURIComponent(user.username)}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0B1222] px-3 py-1.5 text-xs font-semibold text-[#AEB9E1] transition hover:border-[#2563EB] hover:text-white"
                        title="1v1 Compare"
                      >
                        <Swords className="h-3 w-3 text-[#8B5CF6]" />
                        <span>Compare</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
