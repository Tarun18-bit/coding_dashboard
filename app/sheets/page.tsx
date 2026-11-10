import { getUserSheetProgress, SheetProgress, SheetType } from '@/lib/sheets';
import { CuratedSheets } from '@/components/CuratedSheets';
import { getSessionUser } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';

export const metadata = { title: 'Interview Roadmaps', description: 'Blind 75, NeetCode 150 and Striver SDE sheet trackers with automatic solve detection.' };

// Per-user progress: always render per request
export const dynamic = 'force-dynamic';

export default async function SheetsPage() {
  const currentUser = await getSessionUser();

  // Logged-out visitors see the sheets with empty progress (never another user's data)
  const activeUserId = currentUser?.id || '00000000-0000-0000-0000-000000000000';

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

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} activeUsername={currentUser?.username || ''} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <CuratedSheets initialProgress={initialProgress} isLoggedIn={!!currentUser} />
      </main>
    </div>
  );
}
