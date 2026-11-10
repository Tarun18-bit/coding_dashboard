import { supabaseAdmin } from '@/lib/db';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/aggregate';
import { StatCard } from '@/components/StatCard';
import { PlatformCard } from '@/components/PlatformCard';
import { RatingChart } from '@/components/RatingChart';
import { Heatmap } from '@/components/Heatmap';
import { TopicBreakdown } from '@/components/TopicBreakdown';
import { SkillSummary } from '@/components/SkillSummary';
import { CompanyReadiness } from '@/components/CompanyReadiness';
import { calculateCompanyReadiness } from '@/lib/company-readiness';
import { ContestCalendar } from '@/components/ContestCalendar';
import { getDailyWorkout } from '@/lib/potd';
import { DailyWorkoutCard } from '@/components/DailyWorkout';
import { computeRpgProfile } from '@/lib/gamification';
import { RpgProfileCard } from '@/components/RpgProfileCard';
import { ExportResumeModal } from '@/components/ExportResumeModal';
import { ProfileHero } from '@/components/ProfileHero';
import { getProfile } from '@/lib/profile';
import { LocalTime } from '@/components/LocalTime';
import { ShareButton } from '@/components/ShareButton';
import { BadgeModal } from '@/components/BadgeModal';
import { Terminal, Trophy, CheckCircle2, TrendingUp, Flame, ArrowLeft, ExternalLink, Activity, Swords } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

interface PublicProfileProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({ params }: PublicProfileProps) {
  const { username } = await params;
  const name = decodeURIComponent(username).trim().slice(0, 40);
  return {
    title: `${name}'s coding profile`,
    description: `${name}'s solved problems, streaks, ratings and topic strengths across Codeforces, LeetCode and CodeChef.`,
  };
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).trim();

  let authUser: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user ?? null;
  } catch {
    // ignore
  }

  // 1. Try to find user by username in users table
  let { data: user } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .ilike('username', decodedUsername)
    .maybeSingle();

  // 2. Fallback: if username not matched directly, check if handle exists in accounts table
  if (!user) {
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('user_id, users(id, username)')
      .ilike('handle', decodedUsername)
      .limit(1)
      .maybeSingle();

    if (account?.users) {
      const u = account.users as unknown as { id: string; username: string };
      user = { id: u.id, username: u.username };
    }
  }

  // 3. Fallback for default demo / default user
  if (!user && (decodedUsername === 'default' || decodedUsername === 'demo' || decodedUsername === 'txrun_18' || decodedUsername === 'oggy_18')) {
    user = { id: '00000000-0000-0000-0000-000000000001', username: 'txrun_18' };
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#081028] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B1739] border border-[rgba(126,137,172,0.2)] text-[#00C2FF] mb-4 shadow-xl">
          <Terminal className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">User &quot;{decodedUsername}&quot; Not Found</h1>
        <p className="text-[#7E89AC] mt-1.5 text-xs max-w-sm">
          No coding progress profile was found under this username or platform handle.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] hover:bg-[#0B34C7] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const stats = await getDashboardStats(user.id);
  // Contests load in the browser (ContestCalendar fetches them), so three slow external
  // APIs never delay this page's first render
  const [dailyWorkout, profile] = await Promise.all([
    getDailyWorkout(user.id, stats.weaknesses).catch(() => null),
    getProfile(user.id).catch(() => null),
  ]);
  const companyReadiness = calculateCompanyReadiness(
    stats.allTopicCounts || stats.topicBreakdown,
    stats.totalSolved,
    stats.difficultyBreakdown
  );
  const maxCompanyPercent = Math.max(0, ...companyReadiness.map((c) => c.overallScore));
  const rpgProfile = computeRpgProfile(
    stats.totalSolved,
    stats.difficultyBreakdown,
    stats.streaks,
    stats.topicBreakdown,
    stats.accounts.length,
    maxCompanyPercent
  );
  const displayName = user.username === 'default_user' ? decodedUsername : user.username;
  const readinessSummary = companyReadiness.map((c) => ({
    company: c.company.name,
    score: c.overallScore,
  }));
  const accountsSummary = stats.accounts.map((a) => ({
    platform: a.platform,
    handle: a.handle,
    rating: a.latestSnapshot?.rating || null,
  }));

  return (
    <div className="min-h-screen bg-[#081028] text-white selection:bg-[#0E43FB] selection:text-white pb-14">
      {/* Top header: identity on the left, portfolio actions on the right */}
      <header className="sticky top-0 z-20 border-b border-[rgba(126,137,172,0.18)] bg-[#0B1739]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0E43FB] to-[#00C2FF] text-white shadow-[0_0_18px_rgba(14,67,251,0.5)] transition hover:scale-105"
              title="Home"
            >
              <Terminal className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-bold tracking-tight text-white">{displayName}&apos;s Portfolio</h1>
                <span className="shrink-0 rounded-md border border-[rgba(0,194,255,0.3)] bg-[#00C2FF]/10 px-1.5 text-[10px] font-mono font-semibold text-[#00C2FF]">
                  PUBLIC
                </span>
              </div>
              <p className="hidden md:block truncate text-[11px] text-[#7E89AC] font-mono">
                {stats.accounts.length > 0
                  ? stats.accounts.map((a) => `${a.platform}: @${a.handle}`).join(' • ')
                  : 'Competitive Programming Portfolio'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href={`/compare?u1=${encodeURIComponent(displayName)}`}
              title="Compare head-to-head"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2.5 py-1.5 text-xs font-semibold text-[#AEB9E1] transition hover:border-[#CB3CFF] hover:text-white"
            >
              <Swords className="h-3.5 w-3.5 text-[#CB3CFF]" />
              <span className="hidden xl:inline">Compare</span>
            </Link>
            <Link
              href="/leaderboard"
              title="Global leaderboard"
              className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2.5 py-1.5 text-xs font-semibold text-[#AEB9E1] transition hover:border-[#FDB52A] hover:text-white"
            >
              <Trophy className="h-3.5 w-3.5 text-[#FDB52A]" />
              <span className="hidden xl:inline">Leaderboard</span>
            </Link>
            <BadgeModal username={displayName} buttonVariant="icon" />
            <ExportResumeModal
              username={displayName}
              totalSolved={stats.totalSolved}
              difficulty={stats.difficultyBreakdown}
              streaks={stats.streaks}
              accounts={accountsSummary}
              companyReadiness={readinessSummary}
              strengths={stats.strengths}
              rpgTitle={rpgProfile.title}
              rpgLevel={rpgProfile.level}
              buttonVariant="icon"
            />
            <ShareButton username={displayName} />
            <Link
              href={authUser ? '/dashboard' : '/login?mode=signup'}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:bg-[#0B34C7]"
            >
              <span>{authUser ? 'Dashboard' : 'Build Yours'}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-7">
        {/* Profile Hero & Bio */}
        <section>
          <ProfileHero
            username={displayName}
            rpgTitle={rpgProfile.title}
            rpgLevel={rpgProfile.level}
            isEditable={Boolean(authUser && authUser.id === user.id)}
            initialProfile={profile}
          />
        </section>

        {/* RPG Level & Badges Banner */}
        <section>
          <RpgProfileCard rpg={rpgProfile} />
        </section>

        {/* Metric Cards Row */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Total Solved"
            value={stats.totalSolved}
            subtitle="Combined across platforms"
            variant="green"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatCard
            title="Easy"
            value={stats.difficultyBreakdown.easy}
            subtitle="Fundamental concepts"
            variant="cyan"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="Medium"
            value={stats.difficultyBreakdown.medium}
            subtitle="Core algorithmic"
            variant="amber"
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Hard"
            value={stats.difficultyBreakdown.hard}
            subtitle="Advanced challenges"
            variant="rose"
            icon={<Trophy className="h-4 w-4" />}
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              title="Daily Streak"
              value={`${stats.streaks.currentStreak}d`}
              subtitle={`Max: ${stats.streaks.longestStreak} days`}
              variant="blue"
              icon={<Flame className="h-4 w-4 text-[#FFB016]" />}
              badge={stats.streaks.currentStreak > 0 ? 'ACTIVE' : undefined}
            />
          </div>
        </section>

        {/* Daily Smart Workout & POTD */}
        {dailyWorkout && (
          <section>
            <DailyWorkoutCard initialWorkout={dailyWorkout} />
          </section>
        )}

        {/* 365-Day Activity Heatmap */}
        <section className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
          <Heatmap
            data={stats.heatmapData}
            totalActiveDays={stats.streaks.totalActiveDays}
          />
        </section>

        {/* Skill Proficiency & Focus */}
        <section>
          <SkillSummary
            strengths={stats.strengths}
            weaknesses={stats.weaknesses}
          />
        </section>

        {/* Company Interview Readiness & Gap Analyzer */}
        <section>
          <CompanyReadiness results={companyReadiness} />
        </section>

        {/* Live Upcoming Contest Radar */}
        <section>
          <ContestCalendar />
        </section>

        {/* Platforms Grid & Charts */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
          {/* Linked Platform Cards & Tag Breakdown */}
          <div className="space-y-5 lg:col-span-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1]">
                Connected Platforms
              </h2>
              <span className="rounded-full bg-[#0E43FB]/15 border border-[#0E43FB]/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#00C2FF]">
                {stats.accounts.length} ACTIVE
              </span>
            </div>

            {stats.accounts.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 text-center text-xs text-[#7E89AC]">
                No active platforms connected.
              </div>
            ) : (
              <div className="space-y-4">
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
                  />
                ))}
              </div>
            )}

            {/* Topic Breakdown Card */}
            <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1] mb-3">
                Tag Distribution
              </h3>
              <TopicBreakdown topics={stats.topicBreakdown} />
            </div>
          </div>

          {/* Rating Progression Chart & Submissions */}
          <div className="lg:col-span-2 space-y-7">
            <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
              <RatingChart data={stats.ratingHistory} />
            </div>

            {/* Recent Submissions Feed */}
            <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
              <div className="mb-4 flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                    <span>Recent Submissions</span>
                    <span className="rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#00C2FF]">
                      Live
                    </span>
                  </h2>
                  <p className="text-xs text-[#7E89AC]">Latest verified problem submissions across linked handles</p>
                </div>
              </div>

              {stats.recentSubmissions.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#7E89AC]">No submissions recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[rgba(126,137,172,0.16)] bg-[#0A1330] text-[11px] uppercase tracking-wider text-[#AEB9E1]">
                      <tr>
                        <th className="py-3 px-3.5 rounded-l-xl">Platform</th>
                        <th className="py-3 px-3.5">Problem</th>
                        <th className="py-3 px-3.5">Verdict</th>
                        <th className="py-3 px-3.5">Tags</th>
                        <th className="py-3 px-3.5 text-right rounded-r-xl">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(126,137,172,0.1)]">
                      {stats.recentSubmissions.map((sub) => {
                        const isCF = sub.platform.toLowerCase() === 'codeforces';
                        const isLC = sub.platform.toLowerCase() === 'leetcode';
                        const isCC = sub.platform.toLowerCase() === 'codechef';
                        return (
                          <tr key={sub.id} className="hover:bg-[#0A1330]/70 transition-colors">
                            <td className="py-3 px-3.5 capitalize">
                              <span
                                className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-bold ${
                                  isCF
                                    ? 'border-[#21C3FC]/30 bg-[#21C3FC]/10 text-[#21C3FC]'
                                    : isLC
                                    ? 'border-[#FDB52A]/30 bg-[#FDB52A]/10 text-[#FDB52A]'
                                    : isCC
                                    ? 'border-[#CB3CFF]/30 bg-[#CB3CFF]/10 text-[#CB3CFF]'
                                    : 'border-[#14CA74]/30 bg-[#14CA74]/10 text-[#14CA74]'
                                }`}
                              >
                                {sub.platform}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 font-semibold text-white">
                              {sub.title}
                            </td>
                            <td className="py-3 px-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold shadow-sm ${
                                  sub.verdict === 'AC'
                                    ? 'bg-[#14CA74]/15 text-[#14CA74] border border-[#14CA74]/30 shadow-[0_0_8px_rgba(20,202,116,0.2)]'
                                    : 'bg-[#FF5A65]/15 text-[#FF5A65] border border-[#FF5A65]/30 shadow-[0_0_8px_rgba(255,90,101,0.2)]'
                                }`}
                              >
                                {sub.verdict}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-[#AEB9E1]">
                              {sub.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="mr-1.5 rounded-md bg-[#0A1330] border border-[rgba(126,137,172,0.15)] px-1.5 py-0.5 text-[10px] font-mono text-[#AEB9E1]">
                                  #{tag}
                                </span>
                              ))}
                            </td>
                            <td className="py-3 px-3.5 text-right font-mono text-[11px] text-[#7E89AC]">
                              <LocalTime iso={sub.submittedAt} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
