'use client';

import React, { useMemo } from 'react';
import { HeatmapDay } from '@/lib/aggregate';

interface HeatmapProps {
  data: HeatmapDay[];
  totalActiveDays: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, totalActiveDays }) => {
  const weeks = useMemo(() => {
    if (!data || data.length === 0) return [];

    const result: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    const firstDate = new Date(data[0].date + 'T00:00:00Z');
    const firstDayOfWeek = firstDate.getUTCDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1 });
    }

    for (const item of data) {
      currentWeek.push(item);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  const getColorClass = (count: number) => {
    if (count === -1) return 'bg-transparent';
    if (count === 0) return 'bg-[#0B1222] border border-[rgba(126,137,172,0.14)] hover:border-[#7E89AC]';
    if (count === 1) return 'bg-[#082366] border border-[#2563EB]/40 hover:border-[#2563EB]';
    if (count <= 3) return 'bg-[#2563EB] border border-[#00C2FF]/40 hover:border-[#00C2FF]';
    if (count <= 6) return 'bg-[#00C2FF] border border-white/50 hover:border-white';
    return 'bg-[#38E1FF] border border-white hover:border-white';
  };

  const totalSubmissionsInYear = useMemo(() => {
    return data.reduce((acc, d) => acc + (d.count > 0 ? d.count : 0), 0);
  }, [data]);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(126,137,172,0.14)] pb-3.5">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>Activity Heatmap</span>
            <span className="rounded-full bg-[#2563EB]/20 border border-[#2563EB]/30 px-2.5 py-0.5 text-xs font-semibold text-[#D1DBF9]">
              365 Days
            </span>
          </h3>
          <p className="text-xs text-[#7E89AC] mt-1">
            <span className="text-[#00C2FF] font-mono font-bold">{totalSubmissionsInYear}</span> problem submissions across{' '}
            <span className="text-[#14CA74] font-mono font-bold">{totalActiveDays}</span> active days this year
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#7E89AC]">
          <span>Less</span>
          <div className="h-3 w-3 rounded-[3px] bg-[#0B1222] border border-[rgba(126,137,172,0.18)]" />
          <div className="h-3 w-3 rounded-[3px] bg-[#082366] border border-[#2563EB]/40" />
          <div className="h-3 w-3 rounded-[3px] bg-[#2563EB]" />
          <div className="h-3 w-3 rounded-[3px] bg-[#00C2FF]" />
          <div className="h-3 w-3 rounded-[3px] bg-[#38E1FF]" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 pt-1">
        <div className="inline-flex gap-[3.5px] min-w-full">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3.5px]">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  title={day.date ? `${day.date}: ${day.count} submission${day.count === 1 ? '' : 's'}` : ''}
                  className={`h-3 w-3 rounded-[3px] transition-all duration-150 cursor-pointer ${getColorClass(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
