import { getGlobalLeaderboard } from '@/lib/leaderboard';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Trophy, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeaderboardPage() {
  let authUser: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user ?? null;
  } catch {
    // Offline or DB paused fallback
  }

  const currentUsername =
    authUser?.user_metadata?.user_name || authUser?.email?.split('@')[0] || 'txrun_18';

  const currentUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        username: currentUsername,
      }
    : null;

  const entries = await getGlobalLeaderboard();

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} activeUsername={currentUsername} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#FDB52A]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Competitive Global Standings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Unified ranking computed across Codeforces, LeetCode, and CodeChef ratings with streak weighting.
          </p>
        </div>

        {/* Global Standings Table */}
        <LeaderboardTable initialEntries={entries} currentUsername={currentUsername} />
      </main>
    </div>
  );
}
