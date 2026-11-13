import { getCachedGlobalLeaderboard } from '@/lib/leaderboard';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { getSessionUser } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Trophy } from 'lucide-react';

export const metadata = { title: 'Leaderboard', description: 'Global rankings across Codeforces, LeetCode and CodeChef.' };

export const revalidate = 30;

export default async function LeaderboardPage() {
  const currentUser = await getSessionUser();

  const currentUsername = currentUser?.username || '';

  const entries = await getCachedGlobalLeaderboard();

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
              Global Leaderboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Everyone on DashCode, ranked by problems solved, current streak or best contest rating across Codeforces, LeetCode and CodeChef. Updated hourly.
          </p>
        </div>

        {/* Global Standings Table */}
        <LeaderboardTable initialEntries={entries} currentUsername={currentUsername} />
      </main>
    </div>
  );
}
