import { getDashboardStats } from '@/lib/aggregate';
import { requireSessionUser } from '@/lib/auth';
import { calculateCompanyReadiness } from '@/lib/company-readiness';
import { getUserSheetProgress } from '@/lib/sheets';
import { getDailyWorkout } from '@/lib/potd';
import { computeRpgProfile } from '@/lib/gamification';
import { getProfile } from '@/lib/profile';
import { Navbar } from '@/components/Navbar';
import { DashboardTabs } from '@/components/DashboardTabs';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Dashboard', description: 'Your unified coding progress dashboard.' };

// Personal data behind a login: always render per request
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Personal page: visitors sign in first. Also makes sure the public user row exists, so a brand-new
  // account's /u/ profile, leaderboard entry and clans work from the first visit.
  const sessionUser = await requireSessionUser().catch(() => null);
  if (!sessionUser) {
    redirect('/login?next=/dashboard');
  }

  const activeUserId = sessionUser.id;
  const [stats, sheetProgress, dailyWorkout, profile] = await Promise.all([
    getDashboardStats(activeUserId),
    getUserSheetProgress(activeUserId, 'blind75').catch(() => null),
    getDailyWorkout(activeUserId).catch(() => null),
    getProfile(activeUserId).catch(() => null),
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

  const currentUser = { id: sessionUser.id, email: sessionUser.email ?? undefined, username: sessionUser.username };

  // The public username in the database (may differ from the email prefix if that name was taken),
  // so profile, badge and share links point at the right /u/ page
  const dbUsername = stats.user.username && stats.user.username !== 'default_user' ? stats.user.username : null;
  const activeUsername = dbUsername || currentUser.username || stats.accounts[0]?.handle || 'coder';
  const readinessSummary = companyReadiness.map((c) => ({
    company: c.company.name,
    score: c.overallScore,
  }));
  const accountsSummary = stats.accounts.map((a) => ({
    platform: a.platform,
    handle: a.handle,
    rating: a.latestSnapshot?.rating || null,
    solved: a.latestSnapshot?.solvedTotal || 0,
  }));

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeUsername={activeUsername}
        stats={stats}
        rpgProfile={rpgProfile}
        resumeData={{ accountsSummary, readinessSummary }}
      />

      {/* Main Workspace Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardTabs
          stats={stats}
          upcomingContests={[]}
          sheetProgress={sheetProgress}
          dailyWorkout={dailyWorkout}
          companyReadiness={companyReadiness}
          rpgProfile={rpgProfile}
          activeUsername={activeUsername}
          profile={profile}
        />
      </main>
    </div>
  );
}
