import { ClanRoom } from '@/components/ClanRoom';
import { Navbar } from '@/components/Navbar';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'Clans', description: 'Private study clans with a shared weekly goal and live leaderboard.' };

export const dynamic = 'force-dynamic';

export default async function ClansPage({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const [{ join }, user] = await Promise.all([searchParams, getSessionUser()]);
  const joinCode = (join || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      <Navbar currentUser={user} activeUsername={user?.username || 'guest'} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <ClanRoom
          isLoggedIn={!!user}
          currentUserId={user?.id ?? null}
          currentUsername={user?.username || ''}
          initialJoinCode={joinCode}
        />
      </main>
    </div>
  );
}
