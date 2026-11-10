import { getCompareProfile } from '@/lib/compare';
import { CompareView } from '@/components/CompareView';
import { getSessionUser } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Swords } from 'lucide-react';

export const metadata = { title: 'Compare 1v1', description: 'Compare two competitive programmers head-to-head.' };

export const revalidate = 30;

interface ComparePageProps {
  searchParams: Promise<{
    u1?: string;
    u2?: string;
  }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;

  const currentUser = await getSessionUser();

  const defaultUser = currentUser?.username || '';

  const u1Name = params.u1 ? decodeURIComponent(params.u1) : defaultUser;
  const u2Name = params.u2 ? decodeURIComponent(params.u2) : '';

  const [user1, user2] = await Promise.all([
    u1Name ? getCompareProfile(u1Name) : Promise.resolve(null),
    u2Name ? getCompareProfile(u2Name) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} activeUsername={defaultUser} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-[#00EA64]" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              1v1 Head-to-Head Arena
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Compare ratings, problem volume, and topic mastery head-to-head between any two competitive programmers.
          </p>
        </div>

        <CompareView user1={user1} user2={user2} u1Query={u1Name} u2Query={u2Name} />
      </main>
    </div>
  );
}
