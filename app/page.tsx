import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Terminal, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Trophy, 
  ShieldCheck, 
  Layers, 
  Bot, 
  Clock, 
  BookOpen, 
  Users, 
  Code2, 
  Sparkles 
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let authUser: any = null;
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
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#00EA64]/10 via-[#0E43FB]/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-[#00C2FF]/10 blur-[120px] pointer-events-none" />

      {/* Landing Navbar */}
      <header className="sticky top-0 z-30 border-b border-[rgba(148,163,184,0.12)] bg-[#090D1A]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00EA64] text-[#090D1A] font-black shadow-[0_0_18px_rgba(0,234,100,0.4)] transition group-hover:scale-105">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-white group-hover:text-[#00EA64] transition-colors">
                DashCode
              </span>
              <span className="rounded bg-[#00EA64]/10 border border-[#00EA64]/30 px-1 py-0.2 text-[9px] font-mono font-bold text-[#00EA64]">
                PREP
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/u/txrun_18"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white transition"
            >
              <span>Explore Demo Profile</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#0E1628] px-4 py-2 text-xs font-semibold text-white hover:border-[#00EA64] hover:text-[#00EA64] transition"
            >
              Sign In
            </Link>

            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00EA64] px-4 py-2 text-xs font-bold text-[#090D1A] shadow-[0_0_15px_rgba(0,234,100,0.3)] hover:bg-[#00C853] hover:scale-105 transition"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto space-y-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00EA64]/30 bg-[#00EA64]/10 px-4 py-1.5 text-xs font-bold text-[#00EA64] shadow-[0_0_15px_rgba(0,234,100,0.15)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>The All-in-One Competitive Programming Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Unify Your Coding Stats.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00EA64] via-[#00C2FF] to-[#0E43FB]">
            Crack SDE Interviews.
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          Automatically aggregate and track your progress across <strong className="text-white">Codeforces</strong>, <strong className="text-white">LeetCode</strong>, and <strong className="text-white">CodeChef</strong> in one HackerRank-grade developer hub.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login?mode=signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#00EA64] px-7 py-3.5 text-sm font-bold text-[#090D1A] shadow-[0_0_25px_rgba(0,234,100,0.35)] hover:bg-[#00C853] hover:scale-105 transition"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/u/txrun_18"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#0E1628] px-6 py-3.5 text-sm font-semibold text-[#94A3B8] hover:text-white hover:border-[#00EA64] transition"
          >
            <span>View Demo Portfolio</span>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#00EA64]" /> Auto 5-Min Sync
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#00EA64]" /> Blind 75 Auto-Check
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#00EA64]" /> No Paid API Keys Required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#00EA64]" /> 1-Click ATS Resume PDF
          </span>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-xl space-y-3.5 hover:border-[#00EA64]/40 transition group">
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/30 flex items-center justify-center text-[#00EA64]">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition">
              Unified Platform Analytics
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Never switch tabs between Codeforces, LeetCode, and CodeChef again. View combined solved counts, unified difficulty breakdowns, and rating progression.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-xl space-y-3.5 hover:border-[#00C2FF]/40 transition group">
            <div className="h-10 w-10 rounded-xl bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF]">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00C2FF] transition">
              Blind 75 &amp; NeetCode Tracker
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Problems are automatically marked as solved whenever you submit on LeetCode or Codeforces. Stay on track for your tech company interviews.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-xl space-y-3.5 hover:border-[#FDB52A]/40 transition group">
            <div className="h-10 w-10 rounded-xl bg-[#FDB52A]/10 border border-[#FDB52A]/30 flex items-center justify-center text-[#FDB52A]">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#FDB52A] transition">
              FAANG Mock Interview Arena
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Practice under real 45-minute timed exam constraints with scratchpads, progressive hints, built-in code editor, and final performance scorecards.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-xl space-y-3.5 hover:border-[#CB3CFF]/40 transition group">
            <div className="h-10 w-10 rounded-xl bg-[#CB3CFF]/10 border border-[#CB3CFF]/30 flex items-center justify-center text-[#CB3CFF]">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#CB3CFF] transition">
              AI Code Complexity Reviewer
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Instant Big-O time and space complexity detection, code smell warnings, interview follow-up simulator, and concealed optimal solutions.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-xl space-y-3.5 hover:border-[#FF5A65]/40 transition group">
            <div className="h-10 w-10 rounded-xl bg-[#FF5A65]/10 border border-[#FF5A65]/30 flex items-center justify-center text-[#FF5A65]">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#FF5A65] transition">
              Clans &amp; 1v1 Arena
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Form study circles with your friends, compete on weekly problem targets, and challenge any competitive programmer head-to-head.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-xl space-y-3.5 hover:border-[#00EA64]/40 transition group">
            <div className="h-10 w-10 rounded-xl bg-[#00EA64]/10 border border-[#00EA64]/30 flex items-center justify-center text-[#00EA64]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-[#00EA64] transition">
              ATS Resume &amp; README Badge
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Generate a recruiter-ready technical interview progress sheet in 1 click or embed a dynamic stats badge in your GitHub README.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(148,163,184,0.12)] bg-[#080C17] py-8 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DashCode. Built for competitive programmers worldwide.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/login?mode=signup" className="hover:text-white transition">Register</Link>
            <Link href="/u/txrun_18" className="hover:text-white transition">Demo Portfolio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
