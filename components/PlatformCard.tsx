'use client';

import { LocalTime } from '@/components/LocalTime';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Trash2, Loader2 } from 'lucide-react';

interface PlatformCardProps {
  platform: string;
  handle: string;
  solvedTotal: number;
  easy: number;
  medium: number;
  hard: number;
  rating?: number | null;
  maxRating?: number | null;
  lastSyncedAt?: string | null;
  allowUnlink?: boolean;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  handle,
  solvedTotal,
  easy,
  medium,
  hard,
  rating,
  maxRating,
  lastSyncedAt,
  allowUnlink = false,
}) => {
  const router = useRouter();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const p = platform.toLowerCase();

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const res = await fetch(`/api/accounts?platform=${encodeURIComponent(p)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmUnlink(false);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setUnlinking(false);
    }
  };

  const getPlatformMeta = () => {
    switch (p) {
      case 'codeforces':
        return {
          glowDot: 'bg-[#21C3FC]',
          badgeBg: 'bg-[#21C3FC]/10 text-[#21C3FC] border-[#21C3FC]/30',
        };
      case 'leetcode':
        return {
          glowDot: 'bg-[#FDB52A]',
          badgeBg: 'bg-[#FDB52A]/10 text-[#FDB52A] border-[#FDB52A]/30',
        };
      case 'codechef':
        return {
          glowDot: 'bg-[#8B5CF6]',
          badgeBg: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30',
        };
      case 'gfg':
        return {
          glowDot: 'bg-[#14CA74]',
          badgeBg: 'bg-[#14CA74]/10 text-[#14CA74] border-[#14CA74]/30',
        };
      default:
        return {
          glowDot: 'bg-[#2563EB]',
          badgeBg: 'bg-[#2563EB]/10 text-[#D1DBF9] border-[#2563EB]/30',
        };
    }
  };

  const meta = getPlatformMeta();

  return (
    <div className="group relative rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)] transition-all duration-200 hover:border-[rgba(37,99,235,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.25)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${meta.glowDot}`} />
          <div>
            <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.badgeBg}`}>
              {platform}
            </span>
            <h3 className="mt-1 text-sm font-semibold text-white font-mono">@{handle}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {allowUnlink && (
            confirmUnlink ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={unlinking}
                  onClick={handleUnlink}
                  className="rounded-lg border border-[#FF5A65]/40 bg-[#FF5A65]/15 px-2 py-1 text-[11px] font-bold text-[#FF5A65] hover:bg-[#FF5A65] hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  {unlinking ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Unlink'}
                </button>
                <button
                  type="button"
                  disabled={unlinking}
                  onClick={() => setConfirmUnlink(false)}
                  className="rounded-lg border border-[rgba(126,137,172,0.2)] bg-[#0B1222] px-2 py-1 text-[11px] font-semibold text-[#7E89AC] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmUnlink(true)}
                className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0B1222] p-2 text-[#7E89AC] transition hover:border-[#FF5A65]/40 hover:text-[#FF5A65] cursor-pointer"
                title={`Unlink ${platform} handle`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )
          )}
          <Link
            href={`/platform/${platform.toLowerCase()}?handle=${encodeURIComponent(handle)}`}
            className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0B1222] p-2 text-[#AEB9E1] transition hover:border-[#2563EB] hover:bg-[#2563EB] hover:text-white"
            title={`View ${platform} details`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[rgba(126,137,172,0.14)] pt-3.5">
        <div>
          <p className="text-xs font-medium text-[#7E89AC]">Solved</p>
          <p className="text-xl font-bold text-white font-mono">{solvedTotal}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#7E89AC]">Rating</p>
          <p className="text-xl font-bold text-white font-mono">
            {rating ? (
              <>
                <span className="text-[#00C2FF]">{rating}</span>
                {maxRating && <span className="text-xs font-normal text-[#7E89AC] ml-1">/ {maxRating}</span>}
              </>
            ) : (
              <span className="text-sm font-normal text-[#7E89AC]">Unrated</span>
            )}
          </p>
        </div>
      </div>

      {/* Difficulty Breakdown Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#14CA74] font-medium">E: {easy}</span>
          <span className="text-[#FDB52A] font-medium">M: {medium}</span>
          <span className="text-[#FF5A65] font-medium">H: {hard}</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#0B1222] p-0.5 border border-[rgba(126,137,172,0.12)]">
          {solvedTotal > 0 ? (
            <>
              <div style={{ width: `${(easy / solvedTotal) * 100}%` }} className="bg-[#14CA74] rounded-l-full" />
              <div style={{ width: `${(medium / solvedTotal) * 100}%` }} className="bg-[#FDB52A]" />
              <div style={{ width: `${(hard / solvedTotal) * 100}%` }} className="bg-[#FF5A65] rounded-r-full" />
            </>
          ) : (
            <div className="w-full bg-[#0B1222] rounded-full" />
          )}
        </div>
      </div>

      {lastSyncedAt && (
        <p className="mt-3.5 text-[11px] text-[#7E89AC] font-mono flex items-center justify-between">
          <span>Synced</span>
          <span><LocalTime iso={lastSyncedAt} mode="datetime" /></span>
        </p>
      )}
    </div>
  );
};
