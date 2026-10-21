import { getDashboardStats } from '@/lib/aggregate';
import { createClient } from '@/lib/supabase/server';
import { calculateCompanyReadiness } from '@/lib/company-readiness';
import { fetchUpcomingContests } from '@/lib/contests-calendar';
import { getUserSheetProgress } from '@/lib/sheets';
import { getDailyWorkout } from '@/lib/potd';
import { computeRpgProfile } from '@/lib/gamification';
import { Navbar } from '@/components/Navbar';
import { DashboardTabs } from '@/components/DashboardTabs';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  let authUser: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user ?? null;
  } catch {
    // Graceful fallback when offline or database paused
  }

  // Protect dashboard: require login so visitors don't see another user's personal stats
  if (!authUser) {
    redirect('/login');
  }

  const activeUserId = authUser.id;
  const [stats, sheetProgress, dailyWorkout] = await Promise.all([
    getDashboardStats(activeUserId),
    getUserSheetProgress(activeUserId, 'blind75').catch(() => null),
    getDailyWorkout(activeUserId).catch(() => null),
  ]);

  const companyReadiness = calculateCompanyReadiness(
    stats.topicBreakdown,
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

  const currentUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        username: authUser.user_metadata?.user_name || authUser.email?.split('@')[0],
      }
    : null;

  const activeUsername = currentUser?.username || stats.accounts[0]?.handle || 'txrun_18';
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
        />
      </main>
    </div>
  );
}
