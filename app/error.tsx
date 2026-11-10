'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error('[DashCode] Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#090D1A] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF5A65]/40 bg-[#FF5A65]/10 text-[#FF5A65] mb-5">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-black tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-[#94A3B8]">
        This page hit an unexpected error. Your data is safe. Try again, and if it keeps happening, come back in a few minutes.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[10px] text-[#64748B]">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => retry()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00EA64] px-4 py-2 text-xs font-bold text-[#090D1A] hover:bg-[#00C853] transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#0E1628] px-4 py-2 text-xs font-semibold text-white hover:border-[#00EA64] transition"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
