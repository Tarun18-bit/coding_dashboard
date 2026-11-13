'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  UserPlus,
  LogOut,
  Copy,
  Check,
  Settings,
  ExternalLink,
  Loader2,
  KeyRound,
  AlertCircle,
  UserMinus,
} from 'lucide-react';
import type { ClanDetail, ClanSummary } from '@/lib/clans';

// Kept local so this client bundle never imports server-side clan code
const CATEGORIES = [
  { value: 'FAANG Prep', label: 'FAANG Prep' },
  { value: 'University', label: 'University Batch' },
  { value: 'Competitive', label: 'Competitive Programming' },
  { value: 'Casual', label: 'Casual / Daily Grinders' },
];
const EMOJIS = ['🔥', '🚀', '⚡', '🧠', '🏆', '🐉', '🦾', '🎯', '💎', '🌊'];

interface ClanRoomProps {
  isLoggedIn: boolean;
  currentUserId: string | null;
  currentUsername: string;
  initialJoinCode?: string;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function daysLeftInWeek(weekStartIso: string): number {
  const end = new Date(weekStartIso).getTime() + 7 * 86_400_000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

async function api<T>(url: string, init?: RequestInit): Promise<T & { success: boolean; error?: string }> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
  return data;
}

const card = 'rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] shadow-xl';
const input =
  'w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] px-3.5 py-2 text-white focus:border-[#00C2FF] focus:outline-none';
const btnGhost =
  'inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-50';

export const ClanRoom: React.FC<ClanRoomProps> = ({ isLoggedIn, currentUserId, currentUsername, initialJoinCode = '' }) => {
  const [clans, setClans] = useState<ClanSummary[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [detail, setDetail] = useState<ClanDetail | null>(null);
  const [listLoaded, setListLoaded] = useState(false);
  const [listError, setListError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [copied, setCopied] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(!!initialJoinCode && isLoggedIn);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newEmoji, setNewEmoji] = useState('🔥');
  const [newTarget, setNewTarget] = useState('50');
  const [newCategory, setNewCategory] = useState('FAANG Prep');
  const [joinCode, setJoinCode] = useState(initialJoinCode.toUpperCase());
  const [editTagline, setEditTagline] = useState('');
  const [editTarget, setEditTarget] = useState('50');

  // Load the user's clans
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      const data = await api<{ clans: ClanSummary[] }>('/api/clans');
      if (cancelled) return;
      if (data.success) {
        setClans(data.clans);
        setListError('');
        setActiveId((prev) => (data.clans.some((c) => c.id === prev) ? prev : data.clans[0]?.id || ''));
      } else {
        setListError(data.error || 'Could not load clans');
      }
      setListLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, reloadKey]);

  // Load the selected clan's live stats
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      const data = await api<{ clan: ClanDetail }>(`/api/clans/${activeId}`);
      if (cancelled) return;
      if (data.success) {
        setDetail(data.clan);
        setDetailError('');
      } else {
        setDetailError(data.error || 'Could not load the clan');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, reloadKey]);

  const activeClan = detail && detail.id === activeId ? detail : null;
  const isLeader = !!activeClan && activeClan.ownerId === currentUserId;
  const progressPercent = activeClan
    ? Math.min(100, Math.round((activeClan.weekSolves / Math.max(1, activeClan.weeklyTarget)) * 100))
    : 0;

  const run = async (fn: () => Promise<{ success: boolean; error?: string; clanId?: string }>, after?: (clanId?: string) => void) => {
    setBusy(true);
    setActionError('');
    try {
      const res = await fn();
      if (!res.success) {
        setActionError(res.error || 'Something went wrong');
        return false;
      }
      after?.(res.clanId);
      setReloadKey((k) => k + 1);
      return true;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        api('/api/clans', {
          method: 'POST',
          body: JSON.stringify({
            name: newName,
            tagline: newTagline,
            avatar: newEmoji,
            category: newCategory,
            weeklyTarget: Number(newTarget),
          }),
        }),
      (clanId) => {
        setIsCreateOpen(false);
        setNewName('');
        setNewTagline('');
        if (clanId) setActiveId(clanId);
      }
    );
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => api('/api/clans/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) }),
      (clanId) => {
        setIsJoinOpen(false);
        setJoinCode('');
        if (clanId) setActiveId(clanId);
        if (typeof window !== 'undefined' && window.location.search.includes('join=')) {
          window.history.replaceState(null, '', '/clans');
        }
      }
    );
  };

  const openSettings = () => {
    if (!activeClan) return;
    setEditTagline(activeClan.tagline);
    setEditTarget(String(activeClan.weeklyTarget));
    setActionError('');
    setIsSettingsOpen(true);
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClan) return;
    run(
      () =>
        api(`/api/clans/${activeClan.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ tagline: editTagline, weeklyTarget: Number(editTarget) }),
        }),
      () => setIsSettingsOpen(false)
    );
  };

  const regenerateInvite = () => {
    if (!activeClan) return;
    if (!confirm('Create a new invite code? The old link will stop working.')) return;
    run(() => api(`/api/clans/${activeClan.id}`, { method: 'PATCH', body: JSON.stringify({ regenerateInvite: true }) }));
  };

  const removeMember = (userId: string, username: string) => {
    if (!activeClan || !confirm(`Remove @${username} from ${activeClan.name}?`)) return;
    run(() => api(`/api/clans/${activeClan.id}`, { method: 'PATCH', body: JSON.stringify({ removeUserId: userId }) }));
  };

  const leaveOrDelete = (action: 'leave' | 'delete') => {
    if (!activeClan) return;
    const msg =
      action === 'delete'
        ? `Delete ${activeClan.name} for everyone? This cannot be undone.`
        : isLeader && activeClan.memberCount > 1
        ? `Leave ${activeClan.name}? Leadership passes to the longest-standing member.`
        : `Leave ${activeClan.name}?`;
    if (!confirm(msg)) return;
    run(
      () => api(`/api/clans/${activeClan.id}?action=${action}`, { method: 'DELETE' }),
      () => {
        setActiveId('');
        setDetail(null);
      }
    );
  };

  const copyInvite = async () => {
    if (!activeClan) return;
    const link = `${window.location.origin}/clans?join=${activeClan.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this invite link:', link);
    }
  };

  // ───────────── Logged-out state ─────────────
  if (!isLoggedIn) {
    return (
      <div className="space-y-7">
        <Banner />
        <div className={`${card} p-12 text-center space-y-4`}>
          <Users className="mx-auto h-10 w-10 text-[#00EA64]" />
          <h3 className="text-xl font-bold text-white">Log in to create or join a clan</h3>
          <p className="text-sm text-[#AEB9E1] max-w-md mx-auto">
            Clans are private study groups with a shared weekly goal and a live leaderboard, powered by everyone&apos;s synced stats.
          </p>
          <Link
            href={initialJoinCode ? `/login?next=${encodeURIComponent(`/clans?join=${initialJoinCode}`)}` : '/login'}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#00EA64] px-6 py-3 text-sm font-bold text-[#090D1A]"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <Banner
        actions={
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setActionError('');
                setIsJoinOpen(true);
              }}
              className={`${btnGhost} border-[#00C2FF]/40 bg-[#00C2FF]/10 text-[#00C2FF] hover:bg-[#00C2FF] hover:text-[#081028]`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Join with Code</span>
            </button>
            <button
              onClick={() => {
                setActionError('');
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white transition hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Create Clan</span>
            </button>
          </div>
        }
      />

      {listError && <ErrorBox message={listError} />}

      {!listLoaded ? (
        <div className={`${card} p-12 flex items-center justify-center gap-2 text-sm text-[#AEB9E1]`}>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your clans...
        </div>
      ) : clans.length === 0 && !listError ? (
        <div className={`${card} p-12 text-center space-y-4`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1222] border border-[rgba(126,137,172,0.2)] text-[#00EA64]">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white">You&apos;re not in a clan yet</h3>
          <p className="text-sm text-[#AEB9E1] max-w-md mx-auto">
            Create one for your college batch or study group and share the invite link, or join a friend&apos;s clan with their code.
          </p>
        </div>
      ) : (
        <>
          {/* Clan switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {clans.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                  c.id === activeId
                    ? 'border-[#00C2FF] bg-[#2563EB]/20 text-white'
                    : 'border-[rgba(126,137,172,0.18)] bg-[#0E1628] text-[#AEB9E1] hover:text-white'
                }`}
              >
                <span className="text-base">{c.avatar}</span>
                <span>{c.name}</span>
                <span className="rounded-md bg-[#0B1222] px-1.5 py-0.5 text-[11px] font-mono text-[#7E89AC]">
                  {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                </span>
              </button>
            ))}
          </div>

          {detailError && <ErrorBox message={detailError} />}
          {actionError && !isCreateOpen && !isJoinOpen && !isSettingsOpen && <ErrorBox message={actionError} />}

          {!activeClan ? (
            <div className={`${card} p-12 flex items-center justify-center gap-2 text-sm text-[#AEB9E1]`}>
              <Loader2 className="h-4 w-4 animate-spin" /> Loading clan stats...
            </div>
          ) : (
            <>
              {/* Clan hero */}
              <div className={`relative overflow-hidden ${card} p-6`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0B1222] border border-[rgba(126,137,172,0.25)] text-3xl shadow-inner flex-shrink-0">
                      {activeClan.avatar}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-black text-white">{activeClan.name}</h2>
                        <span className="rounded-md border border-[#00C2FF]/40 bg-[#00C2FF]/10 px-2 py-0.5 text-[11px] font-mono font-bold text-[#00C2FF] uppercase">
                          {activeClan.category}
                        </span>
                      </div>
                      {activeClan.tagline && <p className="text-xs sm:text-sm text-[#AEB9E1] max-w-xl">{activeClan.tagline}</p>}
                      <p className="text-xs font-mono text-[#7E89AC]">
                        Invite code: <span className="text-white font-bold tracking-widest">{activeClan.inviteCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Stat label="Members" value={activeClan.memberCount} />
                    <Stat label="This Week" value={activeClan.weekSolves} accent="text-[#14CA74]" />
                    <button
                      onClick={copyInvite}
                      className={`${btnGhost} border-[#00C2FF]/40 bg-[#00C2FF]/15 text-[#00C2FF] hover:bg-[#00C2FF] hover:text-[#081028]`}
                      title="Copy an invite link to share with friends"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Link copied!' : 'Invite'}</span>
                    </button>
                    {isLeader && (
                      <button
                        onClick={openSettings}
                        title="Clan settings"
                        className="rounded-2xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] p-3 text-[#AEB9E1] hover:text-white transition cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => leaveOrDelete('leave')}
                      disabled={busy}
                      title="Leave clan"
                      className="rounded-2xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] p-3 text-[#AEB9E1] hover:text-white transition cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                    {isLeader && (
                      <button
                        onClick={() => leaveOrDelete('delete')}
                        disabled={busy}
                        title="Delete clan"
                        className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Weekly quest */}
                <div className="mt-6 rounded-2xl border border-[rgba(126,137,172,0.14)] bg-[#0B1222]/70 p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#00C2FF]" />
                      Weekly Clan Quest: {activeClan.weeklyTarget} new problems
                    </span>
                    <span className="text-[#00C2FF] font-bold">
                      {activeClan.weekSolves} / {activeClan.weeklyTarget} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.15)]">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-[#2563EB] transition-all duration-700"
                    />
                  </div>
                  <p className="text-xs text-[#7E89AC] text-right font-mono">
                    {progressPercent >= 100 ? 'Quest complete! ' : ''}
                    {daysLeftInWeek(activeClan.weekStart)} day(s) left · resets Monday 00:00 UTC · counted from synced stats
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Leaderboard */}
                <div className={`lg:col-span-8 ${card} p-6 space-y-4`}>
                  <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#FDB52A]" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Leaderboard</h3>
                    </div>
                    <span className="text-xs text-[#7E89AC]">New problems this week</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[rgba(126,137,172,0.16)] bg-[#0B1222] text-xs uppercase text-[#AEB9E1]">
                        <tr>
                          <th className="py-3 px-3.5 rounded-l-xl w-14">Rank</th>
                          <th className="py-3 px-3.5">Member</th>
                          <th className="py-3 px-3.5 text-center">This Week</th>
                          <th className="py-3 px-3.5 text-center">Total</th>
                          <th className="py-3 px-3.5 text-center">Streak</th>
                          <th className="py-3 px-3.5 text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(126,137,172,0.1)] font-mono">
                        {activeClan.members.map((m, i) => (
                          <tr key={m.userId} className={`transition ${m.userId === currentUserId ? 'bg-[#2563EB]/10' : 'hover:bg-[#0B1222]/60'}`}>
                            <td className="py-3.5 px-3.5 font-bold">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-xl border text-xs font-bold ${
                                  i === 0 && m.solvedThisWeek > 0
                                    ? 'bg-[#FDB52A]/20 text-[#FDB52A] border-[#FDB52A]/40'
                                    : 'bg-[#0B1222] text-[#7E89AC] border-[rgba(126,137,172,0.18)]'
                                }`}
                              >
                                {i === 0 && m.solvedThisWeek > 0 ? '🥇' : `#${i + 1}`}
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 font-sans">
                              <Link href={`/u/${m.username}`} className="font-bold text-white hover:text-[#00C2FF] transition inline-flex items-center gap-1.5">
                                @{m.username}
                                {m.role === 'leader' && <Crown className="h-3.5 w-3.5 text-[#FDB52A] fill-[#FDB52A]" aria-label="Leader" />}
                                {m.userId === currentUserId && <span className="text-[11px] font-mono text-[#00C2FF]">(you)</span>}
                              </Link>
                            </td>
                            <td className="py-3.5 px-3.5 text-center font-bold text-[#14CA74]">+{m.solvedThisWeek}</td>
                            <td className="py-3.5 px-3.5 text-center font-bold text-white">{m.totalSolved}</td>
                            <td className="py-3.5 px-3.5 text-center text-[#FFB016] font-bold">{m.currentStreak}d 🔥</td>
                            <td className="py-3.5 px-3.5 text-right font-sans">
                              <div className="inline-flex items-center gap-1.5">
                                {m.userId !== currentUserId && (
                                  <Link
                                    href={`/compare?u1=${encodeURIComponent(currentUsername)}&u2=${encodeURIComponent(m.username)}`}
                                    className="inline-flex items-center gap-1 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0B1222] px-2.5 py-1 text-xs font-semibold text-[#AEB9E1] transition hover:border-[#2563EB] hover:text-white"
                                  >
                                    <Swords className="h-3 w-3 text-[#8B5CF6]" /> Compare
                                  </Link>
                                )}
                                {isLeader && m.userId !== currentUserId && (
                                  <button
                                    onClick={() => removeMember(m.userId, m.username)}
                                    disabled={busy}
                                    title="Remove from clan"
                                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 cursor-pointer disabled:opacity-50"
                                  >
                                    <UserMinus className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {activeClan.memberCount === 1 && (
                    <p className="text-xs text-[#7E89AC] text-center pt-2">
                      It&apos;s just you so far. Click <span className="text-[#00C2FF] font-bold">Invite</span> to copy a link for your friends.
                    </p>
                  )}
                </div>

                {/* Activity */}
                <div className={`lg:col-span-4 ${card} p-6 space-y-4`}>
                  <div className="flex items-center gap-2 border-b border-[rgba(126,137,172,0.14)] pb-4">
                    <Activity className="h-4 w-4 text-[#00C2FF]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Solves</h3>
                  </div>
                  {activeClan.activity.length === 0 ? (
                    <p className="text-xs text-[#7E89AC]">No synced solves yet. Members&apos; accepted problems appear here after each sync.</p>
                  ) : (
                    <ul className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {activeClan.activity.map((a, i) => (
                        <li key={`${a.username}-${a.submittedAt}-${i}`} className="rounded-2xl border border-[rgba(126,137,172,0.12)] bg-[#0B1222] p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white truncate">@{a.username}</span>
                            <span className="text-[11px] font-mono text-[#7E89AC] shrink-0">{timeAgo(a.submittedAt)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {a.url ? (
                              <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[#AEB9E1] hover:text-[#00C2FF] truncate inline-flex items-center gap-1">
                                {a.title} <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-[#AEB9E1] truncate">{a.title}</span>
                            )}
                            <span className="text-[11px] font-mono uppercase text-[#7E89AC] shrink-0">{a.platform}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Create modal */}
      {isCreateOpen && (
        <Modal title="Create a Clan" icon={<Plus className="h-5 w-5 text-[#8B5CF6]" />} onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Clan name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} required placeholder="e.g. IIT Batch '27 Grinders" className={input} />
            </div>
            <div>
              <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Tagline (optional)</label>
              <input value={newTagline} onChange={(e) => setNewTagline(e.target.value)} maxLength={120} placeholder="One problem a day keeps the rejection away" className={input} />
            </div>
            <div>
              <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Emblem</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`h-9 w-9 rounded-xl border text-lg transition ${newEmoji === e ? 'border-[#00C2FF] bg-[#2563EB]/20' : 'border-[rgba(126,137,172,0.2)] bg-[#0B1222]'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Weekly target</label>
                <input type="number" min={1} max={10000} value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className={`${input} font-mono`} />
              </div>
              <div>
                <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={input}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {actionError && <ErrorBox message={actionError} />}
            <ModalActions onCancel={() => setIsCreateOpen(false)} busy={busy} label="Create Clan" />
          </form>
        </Modal>
      )}

      {/* Join modal */}
      {isJoinOpen && (
        <Modal title="Join a Clan" icon={<KeyRound className="h-5 w-5 text-[#00C2FF]" />} onClose={() => setIsJoinOpen(false)}>
          <form onSubmit={handleJoin} className="space-y-4 text-xs">
            <p className="text-[#AEB9E1]">Ask a clan member for their invite link or 8-character code.</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={12}
              required
              placeholder="ABCD2345"
              className={`${input} font-mono text-base tracking-[0.3em] text-center`}
              autoFocus
            />
            {actionError && <ErrorBox message={actionError} />}
            <ModalActions onCancel={() => setIsJoinOpen(false)} busy={busy} label="Join Clan" />
          </form>
        </Modal>
      )}

      {/* Settings modal (leader) */}
      {isSettingsOpen && activeClan && (
        <Modal title={`${activeClan.name} settings`} icon={<Settings className="h-5 w-5 text-[#00C2FF]" />} onClose={() => setIsSettingsOpen(false)}>
          <form onSubmit={saveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Tagline</label>
              <input value={editTagline} onChange={(e) => setEditTagline(e.target.value)} maxLength={120} className={input} />
            </div>
            <div>
              <label className="block font-bold uppercase text-[#AEB9E1] mb-1">Weekly target</label>
              <input type="number" min={1} max={10000} value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className={`${input} font-mono`} />
            </div>
            <button
              type="button"
              onClick={regenerateInvite}
              disabled={busy}
              className={`${btnGhost} border-[rgba(126,137,172,0.2)] bg-[#0B1222] text-[#AEB9E1] hover:text-white`}
            >
              <Copy className="h-3.5 w-3.5" /> Generate a new invite code
            </button>
            {actionError && <ErrorBox message={actionError} />}
            <ModalActions onCancel={() => setIsSettingsOpen(false)} busy={busy} label="Save" />
          </form>
        </Modal>
      )}
    </div>
  );
};

function Banner({ actions }: { actions?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-6 sm:p-8 shadow-2xl">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00EA64]/30 bg-[#00EA64]/10 px-3 py-1 text-xs font-bold text-[#00EA64]">
            <Users className="h-3.5 w-3.5" />
            <span>Study Circles &amp; Private Clans</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Team Up &amp; Compete with Friends</h1>
          <p className="text-xs md:text-sm text-[#AEB9E1] leading-relaxed">
            Create a private clan for your batch or study group, share the invite link, and chase a weekly problem goal together. Progress is counted automatically from everyone&apos;s synced platforms.
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-white' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(126,137,172,0.15)] bg-[#0B1222] px-4 py-2.5 text-center">
      <p className="text-[11px] uppercase font-bold text-[#7E89AC]">{label}</p>
      <p className={`text-lg font-bold font-mono ${accent}`}>{value}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-[#FF5A65]/40 bg-[#FF5A65]/10 p-3 text-xs text-[#FF5A65]">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="relative w-full max-w-md rounded-3xl border border-[rgba(126,137,172,0.25)] bg-[#0E1628] p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-3.5">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-[#7E89AC] hover:text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, busy, label }: { onCancel: () => void; busy: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2.5 pt-1">
      <button type="button" onClick={onCancel} className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0B1222] px-4 py-2 font-bold text-[#AEB9E1]">
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2 font-bold text-white shadow-md hover:scale-105 transition disabled:opacity-60"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </button>
    </div>
  );
}
