import { AiReviewer } from '@/components/AiReviewer';
import { Navbar } from '@/components/Navbar';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReviewerPage() {
  let user: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // offline fallback
  }

  const currentUser = user
    ? {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.user_name || user.email?.split('@')[0],
      }
    : null;

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} activeUsername={currentUser?.username || 'oggy'} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <AiReviewer />
      </main>
    </div>
  );
}
