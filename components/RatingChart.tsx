'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RatingPoint {
  date: string;
  rating: number;
  contestName: string;
  platform: string;
}

interface RatingChartProps {
  data: RatingPoint[];
}

export const RatingChart: React.FC<RatingChartProps> = ({ data }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const filteredData = data.filter((d) => {
    if (selectedPlatform === 'all') return true;
    return d.platform.toLowerCase() === selectedPlatform.toLowerCase();
  });

  const platforms = Array.from(new Set(data.map((d) => d.platform.toLowerCase())));

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#082366]/60 text-[#00C2FF] mb-3">
          📈
        </div>
        <p className="text-white text-sm font-semibold">No contest history recorded</p>
        <p className="text-[#7E89AC] text-xs mt-1 max-w-sm">
          Contest rating progression will appear here automatically upon rated contest participation.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white">Rating Progression</h2>
          <p className="text-xs text-[#7E89AC]">Historical performance in rated competitive contests</p>
        </div>

        {platforms.length > 1 && (
          <div className="inline-flex rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] p-1 text-xs">
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                selectedPlatform === 'all'
                  ? 'bg-[#0E43FB] text-white shadow-[0_0_15px_rgba(14,67,251,0.5)]'
                  : 'text-[#AEB9E1] hover:text-white'
              }`}
            >
              All
            </button>
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  selectedPlatform === p
                    ? 'bg-[#0E43FB] text-white shadow-[0_0_15px_rgba(14,67,251,0.5)]'
                    : 'text-[#AEB9E1] hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dashRatingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#0E43FB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0E43FB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(126, 137, 172, 0.12)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#7E89AC"
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={{ stroke: 'rgba(126, 137, 172, 0.18)' }}
            />
            <YAxis
              stroke="#7E89AC"
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={{ stroke: 'rgba(126, 137, 172, 0.18)' }}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as RatingPoint;
                  return (
                    <div className="rounded-xl border border-[rgba(126,137,172,0.25)] bg-[#0B1739]/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
                      <p className="font-semibold text-white">{item.contestName}</p>
                      <div className="flex items-center justify-between gap-4 pt-1 text-[11px] border-t border-[rgba(126,137,172,0.15)]">
                        <span className="capitalize text-[#7E89AC]">{item.platform}</span>
                        <span className="font-mono font-bold text-[#00C2FF] text-sm">
                          {item.rating} pts
                        </span>
                      </div>
                      <p className="text-[#AEB9E1] text-[10px] font-mono">{item.date}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rating"
              stroke="#00C2FF"
              strokeWidth={2.5}
              fill="url(#dashRatingGradient)"
              dot={{ r: 3, fill: '#00C2FF', stroke: '#0E43FB', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#00C2FF', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
