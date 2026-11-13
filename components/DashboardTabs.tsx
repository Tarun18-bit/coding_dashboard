'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  Briefcase, 
  Trophy, 
  CheckCircle2, 
  Flame, 
  Activity, 
  TrendingUp, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Target,
  Code2,
  Calendar,
  Layers
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from '@/components/StatCard';
import { PlatformCard } from '@/components/PlatformCard';
import { Heatmap } from '@/components/Heatmap';
import { TopicBreakdown } from '@/components/TopicBreakdown';
import { SkillSummary } from '@/components/SkillSummary';
import { CompanyReadiness } from '@/components/CompanyReadiness';
import { ContestCalendar } from '@/components/ContestCalendar';
import { DailyWorkoutCard } from '@/components/DailyWorkout';
import { RpgProfileCard } from '@/components/RpgProfileCard';
import { ProfileHero } from '@/components/ProfileHero';
import { ExportResumeModal } from '@/components/ExportResumeModal';
import { BadgeModal } from '@/components/BadgeModal';
import { AccountModal } from '@/components/AccountModal';
import type { PublicProfile } from '@/lib/profile';
import type { DashboardStats } from '@/lib/aggregate';
import type { SheetProgress } from '@/lib/sheets';
import type { DailyWorkout } from '@/lib/potd';
import type { CompanyReadinessResult } from '@/lib/company-readiness';
import type { RpgProfile } from '@/lib/gamification';
import type { UpcomingContest } from '@/lib/contests-calendar';

import { RevisionQueue } from '@/components/RevisionQueue';
import { AiCoach } from '@/components/AiCoach';
import { TodayPanel } from '@/components/TodayPanel';
import { LocalTime } from '@/components/LocalTime';

// Code-split heavy Recharts library so initial dashboard render is ultra-fast
const ProgressChart = dynamic(
  () => import('@/components/ProgressChart').then((mod) => mod.ProgressChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full flex items-center justify-center bg-[#0D1527] rounded-xl border border-white/5 animate-pulse">
        <span className="text-xs text-[#64748B]">Loading progress chart...</span>
      </div>
    ),
  }
);

const RatingChart = dynamic(
  () => import('@/components/RatingChart').then((mod) => mod.RatingChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full flex items-center justify-center bg-[#0D1527] rounded-xl border border-white/5 animate-pulse">
        <span className="text-xs text-[#64748B]">Loading rating trajectory chart...</span>
      </div>
    ),
  }
);

interface DashboardTabsProps {
  stats: DashboardStats;
  upcomingContests: UpcomingContest[];
  sheetProgress: SheetProgress | null;
  dailyWorkout: DailyWorkout | null;
  companyReadiness: CompanyReadinessResult[];
  rpgProfile: RpgProfile;
  activeUsername: string;
  profile?: PublicProfile | null;
}

export function DashboardTabs({
  stats,
  upcomingContests,
  sheetProgress,
  dailyWorkout,
  companyReadiness,
  rpgProfile,
  activeUsername,
  profile = null,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'practice' | 'interview' | 'rpg'>('overview');

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      window.location.href = `/reset-password${window.location.hash}`;
    }
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'practice', label: 'Practice & Roadmaps', icon: BookOpen },
    { id: 'interview', label: 'Interview Prep', icon: Briefcase },
    { id: 'rpg', label: 'Achievements', icon: Trophy },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header + "Today": what to do right now comes first */}
      <div className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0E1628] p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back, {activeUsername}</h1>
            <p className="mt-1 text-sm text-[#94A3B8]">
              {stats.totalSolved} problems solved across {stats.accounts.length} platform{stats.accounts.length === 1 ? '' : 's'}
              {stats.streaks.longestStreak > 0 ? ` · best streak ${stats.streaks.longestStreak} days` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportResumeModal
              username={activeUsername}
              totalSolved={stats.totalSolved}
              difficulty={stats.difficultyBreakdown}
              streaks={stats.streaks}
              accounts={stats.accounts.map((a) => ({ platform: a.platform, handle: a.handle, rating: a.latestSnapshot?.rating ?? null, solved: a.latestSnapshot?.solvedTotal || 0 }))}
              companyReadiness={companyReadiness.map((c) => ({ company: c.company.name, score: c.overallScore }))}
              strengths={stats.strengths || []}
              rpgTitle={rpgProfile?.title}
              rpgLevel={rpgProfile?.level}
              buttonVariant="hero"
            />
            <BadgeModal username={activeUsername} buttonVariant="hero" />
          </div>
        </div>

        <div className="mt-5">
          <TodayPanel
            userId={stats.user.id}
            currentStreak={stats.streaks.currentStreak}
            workout={dailyWorkout}
            onOpenPractice={() => setActiveTab('practice')} onOpenOverview={() => setActiveTab('overview')}
          />
        </div>
      </div>

      {/* HackerRank-style Workspace Navigation Tabs */}
      <div className="border-b border-[rgba(148,163,184,0.15)] bg-[#0E1628]/60 backdrop-blur-md rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#00EA64]/10 text-[#00EA64] border border-[#00EA64]/30'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#131E35]/60 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#00EA64]' : 'text-[#64748B]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW (Spacious, Decongested Placement) */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Row with HackerRank Star Tiers */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              title="Total Solved"
              value={stats.totalSolved}
              subtitle="All platforms combined"
              variant="green"
              icon={<CheckCircle2 className="h-4 w-4 text-[#00EA64]" />}
            />
            <StatCard
              title="Easy ★"
              value={stats.difficultyBreakdown.easy}
              subtitle="Fundamentals mastered"
              variant="cyan"
              icon={<TrendingUp className="h-4 w-4 text-[#00C2FF]" />}
            />
            <StatCard
              title="Medium ★★"
              value={stats.difficultyBreakdown.medium}
              subtitle="Interview standard"
              variant="amber"
              icon={<Activity className="h-4 w-4 text-[#FDB52A]" />}
            />
            <StatCard
              title="Hard ★★★"
              value={stats.difficultyBreakdown.hard}
              subtitle="Competitive apex"
              variant="rose"
              icon={<Trophy className="h-4 w-4 text-[#FF5A65]" />}
            />
            <div className="col-span-2 sm:col-span-1">
              <StatCard
                title="Active Streak"
                value={`${stats.streaks.currentStreak}d`}
                subtitle={`Best: ${stats.streaks.longestStreak} days`}
                variant="blue"
                icon={<Flame className="h-4 w-4 text-[#FFB016]" />}
                badge={stats.streaks.currentStreak > 0 ? 'ACTIVE' : undefined}
              />
            </div>
          </div>

          {/* AI Coach: weak spots + 7-day plan from the user's own stats */}
          <AiCoach userId={stats.user.id} totalSolved={stats.totalSolved} hasAccounts={stats.accounts.length > 0} />

          {/* Connected Platforms (Full Width 3-Column Grid) */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(148,163,184,0.1)] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#00EA64]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Connected Coding Platforms
                </h2>
              </div>
            </div>

            {stats.accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#00EA64]/30 bg-[#090D1A]/70 p-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00EA64]/10 border border-[#00EA64]/30 text-[#00EA64]">
                  <Layers className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-white">Connect Your First Coding Handle</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Link your <strong className="text-white">LeetCode</strong>, <strong className="text-white">Codeforces</strong>, or <strong className="text-white">CodeChef</strong> username to automatically pull solved problems, 365-day activity heatmaps, and contest ratings.
                  </p>
                </div>
                <div className="flex items-center justify-center pt-1">
                  <AccountModal alwaysShowLabel />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.accounts.map((acc) => (
                  <PlatformCard
                    key={acc.id}
                    platform={acc.platform}
                    handle={acc.handle}
                    solvedTotal={acc.latestSnapshot?.solvedTotal || 0}
                    easy={acc.latestSnapshot?.easy || 0}
                    medium={acc.latestSnapshot?.medium || 0}
                    hard={acc.latestSnapshot?.hard || 0}
                    rating={acc.latestSnapshot?.rating}
                    maxRating={acc.latestSnapshot?.maxRating}
                    lastSyncedAt={acc.lastSyncedAt}
                    allowUnlink={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 365-Day Activity Heatmap (Full Width for maximum visibility) */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-[rgba(148,163,184,0.1)] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#00EA64]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  365-Day Activity Heatmap
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#00EA64]">
                {stats.streaks.totalActiveDays} Active Days
              </span>
            </div>
            <Heatmap
              data={stats.heatmapData}
              totalActiveDays={stats.streaks.totalActiveDays}
            />
          </div>

          {/* Solved-over-time progress (from daily snapshots) */}
          {stats.accounts.length > 0 && (
            <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
              <ProgressChart data={stats.progressHistory || []} heatmap={stats.heatmapData} />
            </div>
          )}

          {/* Upcoming Contest Radar (Full Width 3-Card Grid with Spacious Breathing Room) */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
            <ContestCalendar initialContests={upcomingContests} />
          </div>

          {/* Rating Progression Chart (Full Width when data exists) */}
          {stats.ratingHistory && stats.ratingHistory.length > 0 && (
            <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
              <RatingChart data={stats.ratingHistory} />
            </div>
          )}

          {/* Recent Submissions Feed (Full Width Table) */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between border-b border-[rgba(148,163,184,0.1)] pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#00EA64]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Recent Problem Submissions
                </h3>
              </div>
              <Link
                href="/reviewer"
                className="inline-flex items-center gap-1.5 text-xs text-[#00EA64] hover:underline font-mono"
              >
                <span>Analyze Code</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {stats.recentSubmissions.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#64748B]">No submissions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(148,163,184,0.12)] bg-[#090D1A] text-[11px] uppercase font-mono tracking-wider text-[#94A3B8]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Platform</th>
                      <th className="py-3 px-4">Challenge</th>
                      <th className="py-3 px-4">Verdict</th>
                      <th className="py-3 px-4">Tags</th>
                      <th className="py-3 px-4 text-right">Date</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(148,163,184,0.08)]">
                    {stats.recentSubmissions.slice(0, 6).map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#131E35]/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] font-bold text-[#94A3B8] uppercase">
                            {sub.platform}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {sub.url ? (
                            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#00EA64] transition-colors">
                              {sub.title}
                            </a>
                          ) : (
                            sub.title
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded px-2.5 py-0.5 text-[11px] font-mono font-bold ${
                              sub.verdict === 'AC'
                                ? 'bg-[#00EA64]/15 text-[#00EA64] border border-[#00EA64]/30'
                                : 'bg-[#FF5A65]/15 text-[#FF5A65] border border-[#FF5A65]/30'
                            }`}
                          >
                            {sub.verdict}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#94A3B8]">
                          {sub.tags?.slice(0, 2).map((t: string, i: number) => (
                            <span key={i} className="mr-1.5 rounded bg-[#131E35] border border-[rgba(148,163,184,0.12)] px-1.5 py-0.5 text-[11px] font-mono text-[#94A3B8]">
                              #{t}
                            </span>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-[#64748B]">
                          <LocalTime iso={sub.submittedAt} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/reviewer?problem=${encodeURIComponent(sub.title)}&platform=${encodeURIComponent(sub.platform)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00EA64] hover:underline"
                          >
                            <Bot className="h-3 w-3" />
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRACTICE & ROADMAPS (HackerRank Prep Kits) */}
      {/* ========================================================= */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {/* Daily Smart Workout */}
          {dailyWorkout && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#00EA64]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Daily Adaptive Workout
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#94A3B8]">Targeting Algorithmic Weaknesses</span>
              </div>
              <DailyWorkoutCard initialWorkout={dailyWorkout} currentStreak={stats.streaks.currentStreak} />
            </div>
          )}

          {/* Spaced-repetition revision picks */}
          {stats.accounts.length > 0 && <RevisionQueue items={stats.revisionQueue || []} />}

          {/* Curated Roadmaps Kit Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.15)] bg-[#0E1628] p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00EA64]/30 bg-[#00EA64]/10 px-3 py-1 text-xs font-bold text-[#00EA64]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Interview Preparation Kits</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Blind 75 &amp; NeetCode 150 Tracker
                </h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Track your progress through the industry standard interview problem sheets. All solved challenges sync automatically.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {sheetProgress && (
                  <div className="rounded-xl border border-[rgba(148,163,184,0.15)] bg-[#090D1A] px-5 py-3 text-center min-w-[140px]">
                    <p className="text-[11px] font-bold text-[#64748B] uppercase">Blind 75 Progress</p>
                    <p className="text-2xl font-black font-mono text-[#00EA64]">
                      {sheetProgress.percent}%
                    </p>
                    <p className="text-xs font-mono text-[#94A3B8]">
                      {sheetProgress.solvedProblems} / {sheetProgress.totalProblems} Solved
                    </p>
                  </div>
                )}
                <Link
                  href="/sheets"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00EA64] px-6 py-3.5 text-xs font-bold text-[#090D1A] transition hover:bg-[#00C853] hover:scale-105"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Explore Roadmaps</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Skill Breakdown & Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00EA64]" />
                <span>Proficiency &amp; Weakness Analysis</span>
              </h3>
              <SkillSummary
                strengths={stats.strengths}
                weaknesses={stats.weaknesses}
              />
            </div>

            <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#00C2FF]" />
                <span>Topic Tag Distribution</span>
              </h3>
              <TopicBreakdown topics={stats.topicBreakdown} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: INTERVIEW & CAREER (FAANG Readiness & Mock Arena) */}
      {/* ========================================================= */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          {/* Quick Mock Interview Arena Launcher */}
          <div className="rounded-2xl border border-[rgba(253,181,42,0.3)] bg-[#2563EB] p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-xl">
                <h3 className="text-xl font-extrabold text-white">
                  Mock Interview Arena
                </h3>
                <p className="text-xs sm:text-sm text-[#94A3B8]">
                  Experience realistic FAANG coding rounds with timed constraints, integrated code editor, progressive hints, and final performance scorecard.
                </p>
              </div>
              <Link
                href="/mock-interview"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3.5 text-xs font-bold text-[#090D1A] transition hover:scale-105"
              >
                <span>Enter Arena Room</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Company Readiness Analysis */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
            <CompanyReadiness results={companyReadiness} />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: RPG & ACHIEVEMENTS */}
      {/* ========================================================= */}
      {activeTab === 'rpg' && (
        <div className="space-y-6">
          <ProfileHero
            username={activeUsername}
            rpgTitle={rpgProfile.title}
            rpgLevel={rpgProfile.level}
            isEditable={true}
            initialProfile={profile}
          />
          <RpgProfileCard rpg={rpgProfile} />
        </div>
      )}
    </div>
  );
}
