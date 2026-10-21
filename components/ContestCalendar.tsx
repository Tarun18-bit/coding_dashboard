'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ExternalLink, CalendarPlus, Trophy, Sparkles } from 'lucide-react';
import { UpcomingContest } from '@/lib/contests-calendar';

interface ContestCalendarProps {
  initialContests?: UpcomingContest[];
}

export const ContestCalendar: React.FC<ContestCalendarProps> = ({ initialContests = [] }) => {
  const [contests, setContests] = useState<UpcomingContest[]>(initialContests);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(initialContests.length === 0);

  useEffect(() => {
    if (initialContests.length === 0) {
      setLoading(true);
      fetch('/api/contests/upcoming')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setContests(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [initialContests]);

  const filtered = contests.filter((c) => {
    if (filter === 'all') return true;
    return c.platform.toLowerCase() === filter.toLowerCase();
  });

  const getPlatformMeta = (p: string) => {
    switch (p.toLowerCase()) {
      case 'codeforces':
        return {
          name: 'Codeforces',
          badge: 'bg-[#21C3FC]/15 text-[#21C3FC] border-[#21C3FC]/30',
          dot: 'bg-[#21C3FC] shadow-[0_0_8px_#21C3FC]',
        };
      case 'leetcode':
        return {
          name: 'LeetCode',
          badge: 'bg-[#FDB52A]/15 text-[#FDB52A] border-[#FDB52A]/30',
          dot: 'bg-[#FDB52A] shadow-[0_0_8px_#FDB52A]',
        };
      case 'codechef':
        return {
          name: 'CodeChef',
          badge: 'bg-[#CB3CFF]/15 text-[#CB3CFF] border-[#CB3CFF]/30',
          dot: 'bg-[#CB3CFF] shadow-[0_0_8px_#CB3CFF]',
        };
      default:
        return {
          name: p,
          badge: 'bg-[#00EA64]/15 text-[#00EA64] border-[#00EA64]/30',
          dot: 'bg-[#00EA64]',
        };
    }
  };

  const getCountdownString = (isoString: string) => {
    const diff = new Date(isoString).getTime() - Date.now();
    if (diff <= 0) return 'Live Now!';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `In ${days}d ${remHours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(148,163,184,0.12)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#00EA64]" />
            <h2 className="text-base font-bold tracking-tight text-white">
              Upcoming Contest Radar
            </h2>
            <span className="rounded-md bg-[#00EA64]/10 border border-[#00EA64]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00EA64]">
              {filtered.length} SCHEDULED
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time contest radar across Codeforces, LeetCode &amp; CodeChef with 1-click Google Calendar sync.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[rgba(148,163,184,0.15)] bg-[#090D1A] p-1 text-xs shrink-0">
          {['all', 'codeforces', 'leetcode', 'codechef'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-lg px-3 py-1 font-semibold capitalize transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-[#00EA64] text-[#090D1A] font-bold shadow-[0_0_12px_rgba(0,234,100,0.3)]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contest Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#64748B] space-y-2">
          <Clock className="h-5 w-5 animate-spin mx-auto text-[#00EA64]" />
          <p>Fetching upcoming contest schedules...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#64748B] space-y-1">
          <p className="font-semibold text-white">No upcoming contests found for this filter</p>
          <p>Switch to &quot;all&quot; to see upcoming events from all platforms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const meta = getPlatformMeta(c.platform);
            const countdown = getCountdownString(c.startTime);
            const startDate = new Date(c.startTime);
            const dateStr = startDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={c.id}
                className="group relative rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#090D1A] p-5 shadow-md transition-all duration-200 hover:border-[#00EA64] hover:shadow-[0_4px_25px_-2px_rgba(0,234,100,0.15)] hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Platform & Countdown Pill */}
                  <div className="flex items-center justify-between">
                    <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${meta.badge}`}>
                      {meta.name}
                    </span>
                    <span className="rounded-full bg-[#00EA64]/10 border border-[#00EA64]/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#00EA64]">
                      {countdown}
                    </span>
                  </div>

                  {/* Contest Name */}
                  <h3 className="text-sm font-bold text-white group-hover:text-[#00EA64] transition line-clamp-2 leading-snug">
                    {c.name}
                  </h3>

                  {/* Date & Duration Info */}
                  <div className="space-y-1.5 pt-1 text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                      <span>{dateStr} at <strong className="text-white font-mono">{timeStr}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                      <span>Duration: <strong className="text-white font-mono">{c.durationMinutes} mins</strong></span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Strict 2-column grid, no overflow or clipping */}
                <div className="mt-5 pt-3.5 border-t border-[rgba(148,163,184,0.12)] grid grid-cols-2 gap-2">
                  <a
                    href={c.googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#0E1628] px-3 py-2 text-xs font-semibold text-[#94A3B8] transition hover:border-[#00EA64] hover:text-white"
                    title="Add to Google Calendar"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-[#00EA64] shrink-0" />
                    <span className="truncate">Remind Me</span>
                  </a>

                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#00EA64] px-3 py-2 text-xs font-bold text-[#090D1A] transition hover:bg-[#00C853] shadow-sm"
                  >
                    <span className="truncate">Register</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
