import React from 'react';
import { Terminal } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#090D1A] text-white flex flex-col">
      {/* Top Header Skeleton */}
      <header className="sticky top-0 z-30 border-b border-[rgba(148,163,184,0.12)] bg-[#090D1A]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00EA64]/20 text-[#00EA64] animate-pulse">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="h-5 w-24 bg-white/10 rounded-md animate-pulse" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-16 bg-white/10 rounded-xl animate-pulse hidden sm:block" />
            <div className="h-8 w-20 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-8 w-8 bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Skeleton Content */}
      <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1">
        {/* Banner Skeleton */}
        <div className="rounded-3xl border border-[rgba(148,163,184,0.12)] bg-[#0E1628]/60 p-6 sm:p-8 space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-[#00EA64]/20 rounded-full" />
          <div className="h-8 w-64 bg-white/15 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-white/10 rounded-md" />
        </div>

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0E1628]/60 p-5 space-y-3 animate-pulse"
            >
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-7 w-16 bg-white/20 rounded" />
              <div className="h-2 w-full bg-white/5 rounded-full" />
            </div>
          ))}
        </div>

        {/* Big Workspace Skeleton */}
        <div className="rounded-2xl border border-[rgba(148,163,184,0.12)] bg-[#0E1628]/60 p-6 space-y-4 animate-pulse min-h-[300px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="h-4 w-40 bg-white/15 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-4 w-full bg-white/5 rounded" />
            <div className="h-4 w-5/6 bg-white/5 rounded" />
            <div className="h-4 w-4/6 bg-white/5 rounded" />
          </div>
        </div>
      </main>
    </div>
  );
}