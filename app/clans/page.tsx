import { ClanRoom } from '@/components/ClanRoom';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClansPage() {
  let user: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // offline or static fallback
  }

  const currentUsername =
    user?.user_metadata?.user_name ||
    user?.email?.split('@')[0] ||
    'oggy';

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <ClanRoom currentUsername={currentUsername} currentUserId={user?.id || 'me'} />
      </main>
    </div>
  );
}
