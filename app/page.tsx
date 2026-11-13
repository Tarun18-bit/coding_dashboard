import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Terminal, CheckCircle2, ArrowRight, Trophy, ShieldCheck, Target, Bot, Clock, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let authUser: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user ?? null;
  } catch {
    // Offline or DB paused fallback
  }

  // If user is already logged in, take them straight to their dashboard
  if (authUser) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] relative overflow-hidden">
      {/* Landing Navbar */}
      <header className="sticky top-0 z-30 border-b border-[rgba(148,163,184,0.12)] bg-[#090D1A]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00EA64] text-[#090D1A] font-black transition">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white group-hover:text-[#00EA64] transition-colors">
                DashCode
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/u/oggy"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white transition"
            >
              <span>Demo profile</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#0E1628] px-4 py-2 text-xs font-semibold text-white hover:border-[#00EA64] hover:text-white transition"
            >
              Sign In
            </Link>

            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00EA64] px-4 py-2 text-xs font-bold text-[#090D1A] hover:bg-[#00C853] transition"
            >
              <span>Get started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto space-y-7">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Unify your coding stats.<br />
          <span className="text-[#94A3B8]">Find your weak spots.</span>
        </h1>

        <p className="text-sm sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          DashCode syncs your solves and ratings from <strong className="text-white">LeetCode</strong>, <strong className="text-white">Codeforces</strong> and <strong className="text-white">CodeChef</strong> every hour, shows which topics are holding you back, and suggests what to practise next.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login?mode=signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#00EA64] px-7 py-3.5 text-sm font-bold text-[#090D1A] hover:bg-[#00C853] transition"
          >
            <span>Create a free account</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/u/oggy"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#0E1628] px-6 py-3.5 text-sm font-semibold text-[#94A3B8] hover:text-white hover:border-[#00EA64] transition"
          >
            <span>See a demo profile</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-sm text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#14CA74]" /> Hourly auto-sync
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#14CA74]" /> Blind 75 &amp; NeetCode 150 auto-check
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#14CA74]" /> AI coach for weak topics
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#14CA74]" /> Free, no API keys needed
          </span>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href={authUser ? '/dashboard' : '/login?mode=signup'}
            className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 space-y-3.5 hover:border-[#00EA64]/40 transition group block"
          >
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/25 flex items-center justify-center text-[#00EA64]">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition flex items-center justify-between">
              <span>AI coach for your weak spots</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#00EA64]" />
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Reads your solve history, compares it with NeetCode 150, and tells you which topics and difficulty levels are holding you back, with specific problems to fix each one.
            </p>
          </Link>

          {/* Card 2 */}
          <Link
            href="/sheets"
            className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 space-y-3.5 hover:border-[#00EA64]/40 transition group block"
          >
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/25 flex items-center justify-center text-[#00EA64]">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition flex items-center justify-between">
              <span>Blind 75 &amp; NeetCode 150 tracker</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#00EA64]" />
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Problems tick themselves off when you solve them on LeetCode or Codeforces, so the sheets always match what you have actually done.
            </p>
          </Link>

          {/* Card 3 */}
          <Link
            href="/mock-interview"
            className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 space-y-3.5 hover:border-[#00EA64]/40 transition group block"
          >
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/25 flex items-center justify-center text-[#00EA64]">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition flex items-center justify-between">
              <span>Timed mock interviews</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#00EA64]" />
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Practice under real 45-minute timed conditions with progressive hints, a code editor that actually runs your Python, TypeScript, C++ or Java against test cases, and a final scorecard.
            </p>
          </Link>

          {/* Card 4 */}
          <Link
            href="/reviewer"
            className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 space-y-3.5 hover:border-[#00EA64]/40 transition group block"
          >
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/25 flex items-center justify-center text-[#00EA64]">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition flex items-center justify-between">
              <span>AI code review</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#00EA64]" />
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Paste a solution and get its time and space complexity, bugs and bottlenecks, a cleaner version, and the follow-up questions an interviewer would ask.
            </p>
          </Link>

          {/* Card 5 */}
          <Link
            href="/clans"
            className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 space-y-3.5 hover:border-[#00EA64]/40 transition group block"
          >
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/25 flex items-center justify-center text-[#00EA64]">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition flex items-center justify-between">
              <span>Clans with friends</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#00EA64]" />
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Create a private clan, invite friends with a link, chase a shared weekly goal tracked from everyone&apos;s synced stats, and compare head-to-head.
            </p>
          </Link>

          {/* Card 6 */}
          <Link
            href="/u/oggy"
            className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 space-y-3.5 hover:border-[#00EA64]/40 transition group block"
          >
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/25 flex items-center justify-center text-[#00EA64]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition flex items-center justify-between">
              <span>Resume sheet &amp; README badge</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#00EA64]" />
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Export a one-page summary of your progress for applications, or embed a live stats badge in your GitHub README.
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(148,163,184,0.12)] bg-[#090D1A] py-8 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} DashCode</p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-white transition">Sign In</Link>
              <Link href="/login?mode=signup" className="hover:text-white transition">Register</Link>
              <Link href="/u/oggy" className="hover:text-white transition">Demo Portfolio</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
            </div>
          </div>
          <p className="text-xs text-[#475569] text-left sm:text-center">
            DashCode is an independent analytics &amp; practice companion and is not affiliated with or endorsed by LeetCode, Codeforces, CodeChef, Google, Amazon, Meta, or Microsoft. Problem links direct to their respective official platforms.
          </p>
        </div>
      </footer>
    </div>
  );
}
