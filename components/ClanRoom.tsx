'use client';

import React, { useState, useEffect } from 'react';
import { Clan, INITIAL_CLANS } from '@/lib/clans';
import {
  Users,
  Trophy,
  Target,
  Plus,
  Crown,
  Swords,
  Activity,
  X,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface ClanRoomProps {
  currentUsername?: string;
  currentUserId?: string;
}

const STORAGE_KEY = 'dashcode_clans_v1';

export const ClanRoom: React.FC<ClanRoomProps> = ({
  currentUsername = 'oggy',
  currentUserId = 'me',
}) => {
  const [clans, setClans] = useState<Clan[]>(INITIAL_CLANS);
  const [activeClanId, setActiveClanId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Clan Form state
  const [newClanName, setNewClanName] = useState('');
  const [newClanTagline, setNewClanTagline] = useState('');
  const [newClanEmoji, setNewClanEmoji] = useState('🔥');
  const [newClanTarget, setNewClanTarget] = useState('100');
  const [newClanCategory, setNewClanCategory] = useState<Clan['category']>('FAANG Prep');

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClans(parsed);
          setActiveClanId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load clans from storage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save changes to localStorage
  const updateClans = (newClans: Clan[]) => {
    setClans(newClans);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClans));
    } catch (e) {
      console.error('Failed to save clans to storage:', e);
    }
  };

  const activeClan = clans.find((c) => c.id === activeClanId) || clans[0] || null;

  const progressPercent = activeClan
    ? Math.min(
        100,
        Math.round((activeClan.currentWeekSolves / (activeClan.weeklyTarget || 1)) * 100)
      )
    : 0;

  const handleCreateClan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName.trim()) return;

    const created: Clan = {
      id: `${newClanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: newClanName.trim(),
      tagline: newClanTagline.trim() || 'Collaborative coding clan.',
      avatar: newClanEmoji || '🚀',
      category: newClanCategory,
      memberCount: 1,
      weeklyTarget: parseInt(newClanTarget) || 100,
      currentWeekSolves: 0,
      members: [
        {
          userId: currentUserId,
          username: currentUsername,
          rank: 1,
          solvedThisWeek: 0,
          totalSolved: 0,
          currentStreak: 0,
          bestPlatform: 'LeetCode',
          role: 'Leader',
        },
      ],
      activities: [
        {
          id: `act-${Date.now()}`,
          username: currentUsername,
          action: 'created the clan! Welcome new members.',
          timestamp: 'Just now',
          badge: 'Founding',
        },
      ],
    };

    const nextList = [created, ...clans];
    updateClans(nextList);
    setActiveClanId(created.id);
    setIsCreateModalOpen(false);
    setNewClanName('');
    setNewClanTagline('');
  };

  const handleDeleteClan = (clanId: string) => {
    if (!confirm('Are you sure you want to delete this clan?')) return;
    const nextList = clans.filter((c) => c.id !== clanId);
    updateClans(nextList);
    if (nextList.length > 0) {
      setActiveClanId(nextList[0].id);
    } else {
      setActiveClanId('');
    }
  };

  return (
    <div className="space-y-7">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-gradient-to-r from-[#0B1739] via-[#0A1330] to-[#0B1739] p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-gradient-to-br from-[#CB3CFF]/15 via-[#0E43FB]/15 to-[#00C2FF]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00EA64]/30 bg-[#00EA64]/10 px-3 py-1 text-xs font-bold text-[#00EA64]">
              <Users className="h-3.5 w-3.5" />
              <span>Study Circles &amp; Private Clans</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Team Up &amp; Compete with Friends
            </h1>
            <p className="text-xs md:text-sm text-[#AEB9E1] leading-relaxed">
              Create a study circle for your college batch, hostel wing, or interview study group. Track weekly group problem goals and private leaderboards.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E43FB] to-[#CB3CFF] px-5 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(203,60,255,0.4)] transition hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Clan</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {isLoaded && clans.length === 0 ? (
        <div className="rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0A1330] border border-[rgba(126,137,172,0.2)] text-[#00EA64]">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Clans Formed Yet</h3>
          <p className="text-sm text-[#AEB9E1] max-w-md mx-auto">
            You haven't created or joined any clans yet. Create a study circle with your college batch or friends to compete and conquer weekly goals together!
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E43FB] to-[#CB3CFF] px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(203,60,255,0.4)] transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Clan</span>
            </button>
          </div>
        </div>
      ) : activeClan ? (
        <>
          {/* Clan Switcher Directory Tabs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {clans.map((c) => {
              const isActive = c.id === activeClan.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveClanId(c.id)}
                  className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'border-[#00C2FF] bg-[#0E43FB]/20 text-white shadow-[0_0_15px_rgba(0,194,255,0.3)]'
                      : 'border-[rgba(126,137,172,0.18)] bg-[#0B1739] text-[#AEB9E1] hover:text-white'
                  }`}
                >
                  <span className="text-base">{c.avatar}</span>
                  <span>{c.name}</span>
                  <span className="rounded-md bg-[#081028] px-1.5 py-0.5 text-[10px] font-mono text-[#7E89AC]">
                    {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Clan Hero Header */}
          <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0A1330] border border-[rgba(126,137,172,0.25)] text-3xl shadow-inner flex-shrink-0">
                  {activeClan.avatar}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {activeClan.name}
                    </h2>
                    <span className="rounded-md border border-[#00C2FF]/40 bg-[#00C2FF]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00C2FF] uppercase">
                      {activeClan.category}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#AEB9E1] max-w-xl">
                    {activeClan.tagline}
                  </p>
                </div>
              </div>

              {/* Quick Clan Stats & Delete Option */}
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] px-4 py-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-[#7E89AC]">Members</p>
                  <p className="text-xl font-bold font-mono text-white">{activeClan.memberCount}</p>
                </div>
                <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0A1330] px-4 py-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-[#7E89AC]">Weekly Solves</p>
                  <p className="text-xl font-bold font-mono text-[#14CA74]">{activeClan.currentWeekSolves}</p>
                </div>
                <button
                  onClick={() => handleDeleteClan(activeClan.id)}
                  title="Delete Clan"
                  className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekly Clan Quest Progress Bar */}
            <div className="mt-6 rounded-2xl border border-[rgba(126,137,172,0.14)] bg-[#081028]/70 p-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#00C2FF]" />
                  <span>Weekly Clan Quest: {activeClan.weeklyTarget} Problems</span>
                </span>
                <span className="text-[#00C2FF] font-bold">
                  {activeClan.currentWeekSolves} / {activeClan.weeklyTarget} solved ({progressPercent}%)
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.15)]">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-[#0E43FB] via-[#CB3CFF] to-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.6)] transition-all duration-700"
                />
              </div>

              <p className="text-[11px] text-[#7E89AC] text-right font-mono">
                Resets every Sunday at midnight UTC
              </p>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Clan Leaderboard */}
            <div className="lg:col-span-8 rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#FDB52A]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Clan Leaderboard (Weekly Sprints)
                  </h3>
                </div>
                <span className="text-xs text-[#7E89AC]">Sorted by Solves this Week</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(126,137,172,0.16)] bg-[#0A1330] text-[11px] uppercase text-[#AEB9E1]">
                    <tr>
                      <th className="py-3 px-3.5 rounded-l-xl w-14">Rank</th>
                      <th className="py-3 px-3.5">Member</th>
                      <th className="py-3 px-3.5 text-center">Role</th>
                      <th className="py-3 px-3.5 text-center">This Week</th>
                      <th className="py-3 px-3.5 text-center">Streak</th>
                      <th className="py-3 px-3.5 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(126,137,172,0.1)] font-mono">
                    {activeClan.members.map((member, i) => {
                      const isTop = i === 0;

                      return (
                        <tr key={member.userId} className="hover:bg-[#0A1330]/60 transition">
                          <td className="py-3.5 px-3.5 font-bold">
                            {isTop ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FDB52A]/20 text-[#FDB52A] border border-[#FDB52A]/40 font-bold text-xs">
                                🥇
                              </span>
                            ) : (
                              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#0A1330] text-[#7E89AC] border border-[rgba(126,137,172,0.18)] font-bold text-xs">
                                #{i + 1}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3.5 font-sans">
                            <Link
                              href={`/u/${member.username}`}
                              className="font-bold text-white hover:text-[#00C2FF] transition flex items-center gap-1.5"
                            >
                              <span>@{member.username}</span>
                              {isTop && <Crown className="h-3.5 w-3.5 text-[#FDB52A] fill-[#FDB52A]" />}
                            </Link>
                          </td>

                          <td className="py-3.5 px-3.5 text-center">
                            <span className="rounded-md border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2 py-0.5 text-[10px] text-[#AEB9E1]">
                              {member.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-3.5 text-center font-bold text-[#14CA74]">
                            +{member.solvedThisWeek}
                          </td>

                          <td className="py-3.5 px-3.5 text-center text-[#FFB016] font-bold">
                            {member.currentStreak}d 🔥
                          </td>

                          <td className="py-3.5 px-3.5 text-right font-sans">
                            <Link
                              href={`/compare?u1=${encodeURIComponent(currentUsername)}&u2=${encodeURIComponent(member.username)}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2.5 py-1 text-[11px] font-semibold text-[#AEB9E1] transition hover:border-[#0E43FB] hover:text-white"
                            >
                              <Swords className="h-3 w-3 text-[#CB3CFF]" />
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

            {/* Right Column: Live Clan Activity Feed */}
            <div className="lg:col-span-4 rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[rgba(126,137,172,0.14)] pb-4">
                <Activity className="h-4 w-4 text-[#00C2FF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Clan Activity Stream
                </h3>
              </div>

              <div className="space-y-3">
                {activeClan.activities.map((act) => (
                  <div
                    key={act.id}
                    className="rounded-2xl border border-[rgba(126,137,172,0.14)] bg-[#0A1330] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">@{act.username}</span>
                      <span className="text-[10px] text-[#7E89AC] font-mono">{act.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#AEB9E1]">{act.action}</p>
                    {act.badge && (
                      <span className="inline-block rounded-md border border-[#00C2FF]/30 bg-[#00C2FF]/10 px-1.5 py-0.5 text-[9px] font-mono text-[#00C2FF]">
                        {act.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Create Clan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-[rgba(126,137,172,0.25)] bg-[#0B1739] p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-3.5">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[#CB3CFF]" />
                <h3 className="text-base font-bold text-white">Create a New Clan</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl p-1.5 text-[#7E89AC] hover:bg-[#0A1330] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#AEB9E1] mb-1">
                  Clan Name
                </label>
                <input
                  type="text"
                  required
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  placeholder="e.g. Stanford SDE Cohort"
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2 text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#AEB9E1] mb-1">
                  Tagline / Mission
                </label>
                <input
                  type="text"
                  value={newClanTagline}
                  onChange={(e) => setNewClanTagline(e.target.value)}
                  placeholder="e.g. Cracking Google & Meta summer 2026"
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2 text-white placeholder-[#7E89AC] focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#AEB9E1] mb-1">
                    Emoji Badge
                  </label>
                  <input
                    type="text"
                    value={newClanEmoji}
                    onChange={(e) => setNewClanEmoji(e.target.value)}
                    placeholder="🔥"
                    className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2 text-white text-center text-lg focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#AEB9E1] mb-1">
                    Weekly Problem Target
                  </label>
                  <input
                    type="number"
                    value={newClanTarget}
                    onChange={(e) => setNewClanTarget(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2 text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#AEB9E1] mb-1">
                  Category
                </label>
                <select
                  value={newClanCategory}
                  onChange={(e) => setNewClanCategory(e.target.value as Clan['category'])}
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2 text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="FAANG Prep">FAANG Prep</option>
                  <option value="University">University Batch</option>
                  <option value="Competitive">Competitive Programming</option>
                  <option value="Casual">Casual / Daily Grinders</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-4 py-2 font-bold text-[#AEB9E1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#0E43FB] to-[#CB3CFF] px-5 py-2 font-bold text-white shadow-md hover:scale-105 transition"
                >
                  Launch Clan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
