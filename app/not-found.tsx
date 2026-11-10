import Link from 'next/link';
import { Terminal, ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090D1A] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00EA64] text-[#090D1A] shadow-[0_0_25px_rgba(0,234,100,0.35)] mb-5">
        <Terminal className="h-7 w-7" />
      </div>
      <p className="font-mono text-xs font-bold text-[#00EA64]">404</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-[#94A3B8]">
        The link may be broken or the page may have moved. Check the address, or head back.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00EA64] px-4 py-2 text-xs font-bold text-[#090D1A] hover:bg-[#00C853] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#0E1628] px-4 py-2 text-xs font-semibold text-white hover:border-[#00EA64] transition"
        >
          View leaderboard
        </Link>
      </div>
    </div>
  );
}
