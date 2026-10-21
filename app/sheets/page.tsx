import { getUserSheetProgress, SheetProgress, SheetType } from '@/lib/sheets';
import { CuratedSheets } from '@/components/CuratedSheets';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SheetsPage() {
  let authUser: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user ?? null;
  } catch {
    // DB paused or offline fallback
  }

  const activeUserId = authUser?.id || '00000000-0000-0000-0000-000000000001';

  // Fetch all 3 sheets progress in parallel
  const [blind75, neetcode150, striver] = await Promise.all([
    getUserSheetProgress(activeUserId, 'blind75'),
    getUserSheetProgress(activeUserId, 'neetcode150'),
    getUserSheetProgress(activeUserId, 'striver'),
  ]);

  const initialProgress: Record<SheetType, SheetProgress> = {
    blind75,
    neetcode150,
    striver,
  };

  const currentUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        username: authUser.user_metadata?.user_name || authUser.email?.split('@')[0],
      }
    : null;

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <CuratedSheets initialProgress={initialProgress} />
      </main>
    </div>
  );
}
