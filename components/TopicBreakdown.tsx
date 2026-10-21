'use client';

import React from 'react';

interface TopicItem {
  tag: string;
  count: number;
}

interface TopicBreakdownProps {
  topics: TopicItem[];
}

export const TopicBreakdown: React.FC<TopicBreakdownProps> = ({ topics }) => {
  if (!topics || topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] p-4 text-center text-xs text-[#7E89AC]">
        No tags recorded yet.
      </div>
    );
  }

  const maxCount = Math.max(...topics.map((t) => t.count), 1);

  return (
    <div className="space-y-3.5 pt-1">
      {topics.map((item, idx) => {
        const percent = Math.round((item.count / maxCount) * 100);
        return (
          <div key={item.tag} className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#AEB9E1] capitalize font-sans font-medium flex items-center gap-1.5">
                <span className="text-[10px] text-[#7E89AC]">#{idx + 1}</span>
                <span>{item.tag}</span>
              </span>
              <span className="text-white font-semibold font-mono">{item.count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#0A1330] p-0.5 border border-[rgba(126,137,172,0.1)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] transition-all duration-500 shadow-[0_0_8px_rgba(0,194,255,0.4)]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
