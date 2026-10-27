import { ClanRoom } from '@/components/ClanRoom';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';
import { getCachedGlobalLeaderboard } from '@/lib/leaderboard';

export const revalidate = 30;

export default async function ClansPage() {
  let user: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // offline or static fallback
  }

  const directoryUsers = await getCachedGlobalLeaderboard().catch(() => []);

  const currentUsername =
    user?.user_metadata?.user_name ||
    user?.email?.split('@')[0] ||
    'oggy';

  const currentUser = user
    ? {
        id: user.id,
        email: user.email,
        username: currentUsername,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} activeUsername={currentUsername} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <ClanRoom
          currentUsername={currentUsername}
          currentUserId={user?.id || 'me'}
          directoryUsers={directoryUsers}
        />
      </main>
    </div>
  );
}
