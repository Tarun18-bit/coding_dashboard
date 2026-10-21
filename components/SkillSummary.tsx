'use client';

import React from 'react';
import { Target, Compass } from 'lucide-react';

interface SkillSummaryProps {
  strengths: { tag: string; count: number }[];
  weaknesses: { tag: string; reason: string }[];
}

export const SkillSummary: React.FC<SkillSummaryProps> = ({ strengths, weaknesses }) => {
  return (
    <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
      <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>Proficiency & Learning Focus</span>
            <span className="rounded-full bg-[#14CA74]/15 border border-[#14CA74]/30 px-2 py-0.5 text-[10px] font-semibold text-[#14CA74]">
              AI Insights
            </span>
          </h2>
          <p className="text-xs text-[#7E89AC] mt-1">
            Algorithmic topic distribution and tailored improvement recommendations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Established Strengths */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#14CA74]/15 text-[#14CA74] border border-[#14CA74]/30">
              <Target className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1]">
              Established Strengths
            </h3>
          </div>

          {strengths.length === 0 ? (
            <p className="text-xs text-[#7E89AC] rounded-xl border border-[rgba(126,137,172,0.14)] bg-[#0A1330] p-4">
              Solve more tagged problems to calculate topic proficiencies.
            </p>
          ) : (
            <div className="space-y-2.5">
              {strengths.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[rgba(126,137,172,0.14)] bg-[#0A1330] px-4 py-3 transition hover:border-[#14CA74]/40 hover:bg-[#0A1330]/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#14CA74]/10 text-[10px] font-mono font-bold text-[#14CA74]">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white capitalize">{s.tag}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-[#14CA74] bg-[#14CA74]/15 border border-[#14CA74]/30 px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(20,202,116,0.25)]">
                    {s.count} Solved
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Focus / Growth */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FDB52A]/15 text-[#FDB52A] border border-[#FDB52A]/30">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#AEB9E1]">
              Recommended Focus Areas
            </h3>
          </div>

          {weaknesses.length === 0 ? (
            <p className="text-xs text-[#7E89AC] rounded-xl border border-[rgba(126,137,172,0.14)] bg-[#0A1330] p-4">
              No critical gaps detected. Keep maintaining regular problem diversity.
            </p>
          ) : (
            <div className="space-y-2.5">
              {weaknesses.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-[rgba(126,137,172,0.14)] bg-[#0A1330] px-4 py-3 transition hover:border-[#FDB52A]/40 hover:bg-[#0A1330]/80"
                >
                  <div>
                    <span className="text-xs font-semibold text-white capitalize">{w.tag}</span>
                    <p className="text-[11px] text-[#7E89AC] mt-0.5">{w.reason}</p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#FDB52A] bg-[#FDB52A]/15 border border-[#FDB52A]/30 px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(253,181,42,0.25)]">
                    Practice
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
