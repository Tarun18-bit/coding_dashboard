import { MockInterviewRoom } from '@/components/MockInterviewRoom';
import { Navbar } from '@/components/Navbar';
import { getSessionUser } from '@/lib/auth';

export const metadata = { title: 'Mock Interview', description: 'Timed mock interviews with a real code runner for Python, TypeScript, C++ and Java.' };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MockInterviewPage() {
  const currentUser = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-16">
      {/* HackerRank-style Navigation Bar */}
      <Navbar currentUser={currentUser} activeUsername={currentUser?.username || ''} />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <MockInterviewRoom />
      </main>
    </div>
  );
}
