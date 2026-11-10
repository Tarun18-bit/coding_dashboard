'use client';

// Test page to confirm Sentry is receiving errors from production. Safe to delete once verified.
import { useState } from 'react';

export default function SentryTestPage() {
  const [boom, setBoom] = useState(false);
  if (boom) throw new Error('DashCode Sentry test error (triggered from /sentry-test)');

  return (
    <div className="min-h-screen bg-[#090D1A] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-black">Sentry test</h1>
      <p className="max-w-sm text-sm text-[#94A3B8]">
        Clicking the button throws a deliberate error. On the live site it should appear in Sentry under Issues within a minute.
      </p>
      <button
        onClick={() => setBoom(true)}
        className="rounded-xl bg-[#FF5A65] px-4 py-2 text-xs font-bold text-white cursor-pointer"
      >
        Throw a test error
      </button>
    </div>
  );
}
