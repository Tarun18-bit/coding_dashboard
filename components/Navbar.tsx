'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Terminal, 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Bot, 
  Users, 
  Trophy, 
  Swords, 
  Flame, 
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { BadgeModal } from '@/components/BadgeModal';
import { ExportResumeModal, type ExportResumeModalProps } from '@/components/ExportResumeModal';
import type { DashboardStats } from '@/lib/aggregate';
import type { RpgProfile } from '@/lib/gamification';
import { ShareButton } from '@/components/ShareButton';
import { AccountModal } from '@/components/AccountModal';
import { SyncButton } from '@/components/SyncButton';
import { UserNav } from '@/components/UserNav';

interface NavbarUser {
  id: string;
  email?: string | null;
  username?: string;
}

interface NavbarProps {
  /** The signed-in user from the server, or null for visitors */
  currentUser?: NavbarUser | null;
  activeUsername?: string;
  /** Dashboard only: powers the streak pill, auto-sync and the export tools */
  stats?: Pick<DashboardStats, 'streaks' | 'accounts' | 'totalSolved' | 'difficultyBreakdown' | 'strengths'>;
  rpgProfile?: Pick<RpgProfile, 'title' | 'level'>;
  resumeData?: {
    accountsSummary: NonNullable<ExportResumeModalProps['accounts']>;
    readinessSummary: NonNullable<ExportResumeModalProps['companyReadiness']>;
  };
}

export function Navbar({
  currentUser,
  activeUsername,
  stats,
  rpgProfile,
  resumeData,
}: NavbarProps) {
  const pathname = usePathname();
  const [competeOpen, setCompeteOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const competeRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const effectiveUser = currentUser ?? null;
  const effectiveUsername = activeUsername || effectiveUser?.username || effectiveUser?.email?.split('@')[0] || '';

  // Oldest sync across linked accounts (dashboard only): drives the automatic refresh
  const syncTimes = (stats?.accounts ?? [])
    .map((a) => (a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : NaN))
    .filter((t) => Number.isFinite(t));
  const oldestSync = syncTimes.length > 0 ? new Date(Math.min(...syncTimes)).toISOString() : null;

  // Close dropdowns on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (competeRef.current && !competeRef.current.contains(event.target as Node)) {
        setCompeteOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCompeteOpen(false);
        setToolsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const coreLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sheets', label: 'Roadmaps', icon: BookOpen },
    { href: '/mock-interview', label: 'Mock Arena', icon: Clock },
    { href: '/reviewer', label: 'AI Reviewer', icon: Bot },
  ];

  const competeLinks = [
    { href: '/leaderboard', label: 'Leaderboard', desc: 'Global competitive standings', icon: Trophy, color: 'text-[#FDB52A]' },
    { href: '/clans', label: 'Clans', desc: 'Study circles & weekly targets', icon: Users, color: 'text-[#CB3CFF]' },
    { href: '/compare', label: '1v1 Arena', desc: 'Head-to-head coder comparison', icon: Swords, color: 'text-[#00C2FF]' },
  ];

  const isCompeteActive = ['/leaderboard', '/clans', '/compare'].some((p) => pathname.startsWith(p));

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(148,163,184,0.12)] bg-[#090D1A]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Left: Brand + Consolidated Nav links */}
        <div className="flex items-center gap-5 sm:gap-7">
          <Link
            href={effectiveUser ? '/dashboard' : '/'}
            aria-label="DashCode home"
            className="flex items-center gap-2.5 group transition-transform hover:scale-105 shrink-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00EA64] text-[#090D1A] font-black shadow-[0_0_18px_rgba(0,234,100,0.4)]">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`${effectiveUser ? 'hidden min-[420px]:inline' : ''} text-base font-black tracking-tight text-white group-hover:text-[#00EA64] transition-colors`}>
                DashCode
              </span>
              <span className="hidden sm:inline rounded bg-[#00EA64]/10 border border-[#00EA64]/30 px-1 py-0.2 text-[9px] font-mono font-bold text-[#00EA64]">
                PREP
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {coreLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#00EA64]/10 text-[#00EA64] border border-[#00EA64]/30'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#131E35]/60 border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#00EA64]' : 'text-[#64748B]'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Compete Dropdown Menu (Consolidates Leaderboard, Clans, Compare) */}
            <div className="relative" ref={competeRef}>
              <button
                onClick={() => setCompeteOpen(!competeOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCompeteActive
                    ? 'bg-[#00EA64]/10 text-[#00EA64] border border-[#00EA64]/30'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#131E35]/60 border border-transparent'
                }`}
              >
                <Trophy className={`h-3.5 w-3.5 ${isCompeteActive ? 'text-[#00EA64]' : 'text-[#64748B]'}`} />
                <span>Compete</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${competeOpen ? 'rotate-180' : ''}`} />
              </button>

              {competeOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#0E1628] p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  {competeLinks.map((sub) => {
                    const SubIcon = sub.icon;
                    const isActive = pathname.startsWith(sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setCompeteOpen(false)}
                        className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                          isActive ? 'bg-[#00EA64]/10 text-white' : 'hover:bg-[#131E35] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <div className={`mt-0.5 rounded-lg p-1.5 bg-[#090D1A] border border-[rgba(148,163,184,0.12)] ${sub.color}`}>
                          <SubIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{sub.label}</p>
                          <p className="text-[11px] text-[#64748B] leading-tight">{sub.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Consolidated Action items */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Daily Streak Pill */}
          {stats?.streaks && (
            <div title="Daily streak" className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[rgba(255,176,22,0.25)] bg-[#1A1810] px-2.5 py-1 text-xs font-mono font-bold text-[#FFB016]">
              <Flame className="h-3.5 w-3.5 text-[#FFB016] animate-pulse" />
              <span>{stats.streaks.currentStreak}d</span>
            </div>
          )}

          {/* Sync & Add Platform require a logged-in session */}
          {effectiveUser && (
            <>
              <SyncButton lastSyncedAt={oldestSync} />
              <AccountModal />
            </>
          )}

          {/* Clean Tools Dropdown (Consolidates Resume, GitHub Badge, Share): needs a profile, so logged-in only */}
          {effectiveUser && (
          <div className="relative" ref={toolsRef}>
            <button
              type="button"
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
              aria-label="Profile and export tools"
              onClick={() => setToolsOpen(!toolsOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#0E1628] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] transition hover:border-[#00EA64] hover:text-white cursor-pointer"
              title="Profile & Export Tools"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#00EA64]" />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {toolsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#0E1628] p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:bg-transparent [&>button]:border-transparent [&>button]:px-2.5 [&>button]:py-2 [&>button]:rounded-lg [&>button]:text-xs [&>button]:text-[#94A3B8] hover:[&>button]:text-white hover:[&>button]:bg-[#131E35]">
                  <ExportResumeModal
                    username={effectiveUsername}
                    totalSolved={stats?.totalSolved || 0}
                    difficulty={stats?.difficultyBreakdown || { easy: 0, medium: 0, hard: 0 }}
                    streaks={stats?.streaks || { currentStreak: 0, longestStreak: 0 }}
                    accounts={resumeData?.accountsSummary || []}
                    companyReadiness={resumeData?.readinessSummary || []}
                    strengths={stats?.strengths || []}
                    rpgTitle={rpgProfile?.title || 'Problem Solver'}
                    rpgLevel={rpgProfile?.level || 1}
                  />
                </div>

                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:bg-transparent [&>button]:border-transparent [&>button]:px-2.5 [&>button]:py-2 [&>button]:rounded-lg [&>button]:text-xs [&>button]:text-[#94A3B8] hover:[&>button]:text-white hover:[&>button]:bg-[#131E35]">
                  <BadgeModal username={effectiveUsername} />
                </div>

                <div className="[&>button]:w-full [&>button]:justify-start [&>button]:bg-transparent [&>button]:border-transparent [&>button]:px-2.5 [&>button]:py-2 [&>button]:rounded-lg [&>button]:text-xs [&>button]:text-[#94A3B8] hover:[&>button]:text-white hover:[&>button]:bg-[#131E35]">
                  <ShareButton username={effectiveUsername} />
                </div>
              </div>
            )}
          </div>
          )}

          <div className="hidden sm:block h-4 w-px bg-[rgba(148,163,184,0.18)] mx-0.5" />

          {/* User Nav */}
          <UserNav user={effectiveUser} />
        </div>
      </div>

      {/* Clean Mobile Sub-bar for phone screens */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-[rgba(148,163,184,0.08)] bg-[#0C1222] overflow-x-auto no-scrollbar">
        {coreLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                isActive ? 'bg-[#00EA64]/10 text-[#00EA64]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{link.label}</span>
            </Link>
          );
        })}
        {competeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                isActive ? 'bg-[#00EA64]/10 text-[#00EA64]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
