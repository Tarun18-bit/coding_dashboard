'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ProgressPoint {
  date: string;
  totalSolved: number;
}

interface ProgressChartProps {
  data: ProgressPoint[];
  heatmap: { date: string; count: number }[];
}

/** Total solved at (or before) a given date, from the daily series */
function solvedAt(data: ProgressPoint[], isoDate: string): number | null {
  let value: number | null = null;
  for (const p of data) {
    if (p.date <= isoDate) value = p.totalSolved;
    else break;
  }
  return value;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ data, heatmap }) => {
  const latest = data[data.length - 1]?.totalSolved ?? 0;
  const gain = (days: number) => {
    const base = solvedAt(data, daysAgoIso(days)) ?? data[0]?.totalSolved;
    return base === undefined || base === null ? null : Math.max(0, latest - base);
  };
  const week = gain(7);
  const month = gain(30);
  const activeDays30 = heatmap.slice(-30).filter((d) => d.count > 0).length;

  const tiles = [
    { label: 'Last 7 days', value: week === null ? '–' : `+${week}`, tone: 'text-[#00EA64]' },
    { label: 'Last 30 days', value: month === null ? '–' : `+${month}`, tone: 'text-[#00C2FF]' },
    { label: 'Active days (30d)', value: `${activeDays30}/30`, tone: 'text-[#FFB016]' },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white">Solved Over Time</h2>
          <p className="text-xs text-[#7E89AC]">Total problems solved across all platforms (last 6 months)</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl border border-[rgba(148,163,184,0.14)] bg-[#090D1A] px-3 py-2 text-center min-w-[92px]">
              <p className="text-[9px] uppercase font-bold tracking-wider text-[#64748B]">{t.label}</p>
              <p className={`text-base font-black font-mono ${t.tone}`}>{t.value}</p>
            </div>
          ))}
        </div>
      </div>

      {data.length < 2 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[rgba(148,163,184,0.2)] bg-[#090D1A]/60 px-6 text-center text-xs text-[#94A3B8]">
          Your progress line fills in automatically as your stats sync each day. Check back tomorrow!
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="solvedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00EA64" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00EA64" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickFormatter={(d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                minTickGap={28}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#0E1628', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#94A3B8' }}
                labelFormatter={(d) => new Date(String(d) + 'T00:00:00Z').toLocaleDateString(undefined, { dateStyle: 'medium' })}
                formatter={(v) => [String(v), 'Total solved']}
              />
              <Area type="monotone" dataKey="totalSolved" stroke="#00EA64" strokeWidth={2} fill="url(#solvedFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
