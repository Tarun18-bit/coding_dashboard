import React from 'react';
import Link from 'next/link';
import { RotateCcw, ExternalLink, Bot } from 'lucide-react';

export interface RevisionItem {
  platform: string;
  problemId: string;
  title: string;
  difficulty: string | null;
  tags: string[];
  solvedAt: string;
  daysAgo: number;
  url: string | null;
}

function difficultyTone(difficulty: string | null): string {
  const d = (difficulty || '').toLowerCase();
  const n = Number(difficulty);
  if (d === 'hard' || n >= 1900) return 'text-[#FF5A65] border-[#FF5A65]/30 bg-[#FF5A65]/10';
  if (d === 'medium' || n >= 1400) return 'text-[#FDB52A] border-[#FDB52A]/30 bg-[#FDB52A]/10';
  return 'text-[#00EA64] border-[#00EA64]/30 bg-[#00EA64]/10';
}

/** Spaced-repetition picks: problems solved 1 week to 4 months ago, weighted to hard ones and weak topics. */
export function RevisionQueue({ items }: { items: RevisionItem[] }) {
  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 sm:p-6 shadow-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(148,163,184,0.1)] pb-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-[#8B5CF6]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Revision Queue</h2>
        </div>
        <span className="text-xs font-mono text-[#94A3B8]">Re-solve without looking: spaced repetition beats re-reading</span>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#64748B]">
          Problems you solved 1 week to 4 months ago will show up here for review.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <li
              key={`${item.platform}:${item.problemId}`}
              className="rounded-xl border border-[rgba(148,163,184,0.12)] bg-[#090D1A] p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-white hover:text-[#00EA64] inline-flex items-center gap-1.5 min-w-0"
                  >
                    <span className="truncate">{item.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                )}
                {item.difficulty && (
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-mono font-bold ${difficultyTone(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#94A3B8]">
                <span className="uppercase font-bold">{item.platform}</span>
                <span>·</span>
                <span>solved {item.daysAgo} days ago</span>
                {item.tags.slice(0, 2).map((t) => (
                  <span key={t} className="rounded bg-[#131E35] border border-[rgba(148,163,184,0.12)] px-1.5 py-0.5">
                    #{t}
                  </span>
                ))}
              </div>
              <Link
                href={`/reviewer?problem=${encodeURIComponent(item.title)}&platform=${encodeURIComponent(item.platform)}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00EA64] hover:underline"
              >
                <Bot className="h-3 w-3" /> Review my approach
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
