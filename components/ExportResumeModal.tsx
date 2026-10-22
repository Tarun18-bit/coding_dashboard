'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  Copy,
  Check,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface ExportResumeModalProps {
  username?: string;
  totalSolved?: number;
  difficulty?: { easy: number; medium: number; hard: number };
  streaks?: { currentStreak: number; longestStreak: number };
  accounts?: { platform: string; handle: string; rating?: number | null }[];
  companyReadiness?: { company: string; score: number }[];
  strengths?: { tag: string; count: number }[];
  rpgTitle?: string;
  rpgLevel?: number;
  buttonVariant?: 'hero' | 'nav';
}

export const ExportResumeModal: React.FC<ExportResumeModalProps> = ({
  username = 'oggy',
  totalSolved = 0,
  difficulty = { easy: 0, medium: 0, hard: 0 },
  streaks = { currentStreak: 0, longestStreak: 0 },
  accounts = [],
  companyReadiness = [],
  strengths = [],
  rpgTitle = 'Problem Solver',
  rpgLevel = 1,
  buttonVariant = 'nav',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://coding-dashboard-two.vercel.app';
  const profileUrl = `${origin}/u/${encodeURIComponent(username)}`;

  const generateMarkdownSummary = () => {
    const accList = accounts.length > 0
      ? accounts.map((a) => `${a.platform.toUpperCase()} (@${a.handle}${a.rating ? ` - Rating: ${a.rating}` : ''})`).join(', ')
      : 'Multi-platform verified';

    const compList = companyReadiness.length > 0
      ? companyReadiness.slice(0, 4).map((c) => `${c.company}: ${c.score}%`).join(' | ')
      : 'Interview prep in progress';

    const topSkills = strengths.length > 0
      ? strengths.slice(0, 5).map((s) => `${s.tag} (${s.count} solved)`).join(', ')
      : 'General problem solving';

    return `## Verified Technical Assessment Profile - @${username}
- **Total Problems Solved**: ${totalSolved} (Easy: ${difficulty.easy}, Medium: ${difficulty.medium}, Hard: ${difficulty.hard})
- **Daily Streak**: ${streaks.currentStreak} Days (Peak: ${streaks.longestStreak} Days)
- **Verified Platforms**: ${accList}
- **Tier-1 Company Readiness**: ${compList}
- **Top Algorithmic Proficiencies**: ${topSkills}
- **Verified Portfolio Link**: ${profileUrl}
*(Generated via DashCode Developer Dashboard)*`;
  };

  const handleCopySummary = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(generateMarkdownSummary());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {buttonVariant === 'hero' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(20,202,116,0.3)] bg-[#14CA74]/15 px-3.5 py-2 text-xs font-bold text-[#14CA74] shadow-sm transition hover:bg-[#14CA74]/25 hover:border-[#14CA74] cursor-pointer"
          title="Export ATS-Friendly Resume Sheet"
        >
          <FileText className="h-4 w-4 text-[#14CA74]" />
          <span>Export Resume</span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#94A3B8] hover:text-white hover:bg-[#131E35] transition text-left cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5 text-[#14CA74]" />
          <span>Export Resume PDF</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[rgba(126,137,172,0.25)] bg-[#0B1739] p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.15)] pb-4 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14CA74]/15 border border-[#14CA74]/30 text-[#14CA74]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ATS Recruiter Technical Sheet</h3>
                  <p className="text-xs text-[#7E89AC]">
                    Print or save as clean white PDF to attach to job applications
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(126,137,172,0.25)] bg-[#0A1330] px-3.5 py-2 text-xs font-bold text-[#AEB9E1] transition hover:text-white hover:border-[#00EA64]"
                  title="Copy text snippet for resumes or emails"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#14CA74]" />
                      <span className="text-[#14CA74]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0E43FB] to-[#00C2FF] px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:scale-105"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] p-2 text-[#AEB9E1] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Resume Document */}
            <div
              id="printable-resume"
              className="rounded-2xl border border-[rgba(126,137,172,0.2)] bg-[#081028] p-7 text-white space-y-6 shadow-inner print:border-none print:bg-white print:text-black print:p-0"
            >
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(126,137,172,0.18)] pb-5 print:border-gray-300">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md border border-[#00C2FF]/40 bg-[#00C2FF]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00C2FF] uppercase print:border-blue-600 print:text-blue-600 print:bg-transparent">
                      VERIFIED CODING PORTFOLIO
                    </span>
                    <span className="text-xs text-[#7E89AC] font-mono print:text-gray-600">
                      Level {rpgLevel} • {rpgTitle}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-white print:text-gray-900">
                    @{username}
                  </h1>
                  <p className="text-xs text-[#AEB9E1] font-mono mt-0.5 print:text-gray-600">
                    Verified Link: {profileUrl}
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(126,137,172,0.2)] bg-[#0B1739] p-3 text-center min-w-[150px] print:border-gray-300 print:bg-gray-50">
                  <span className="text-[10px] font-bold uppercase text-[#7E89AC] print:text-gray-600">
                    Verified Solves
                  </span>
                  <p className="text-3xl font-black font-mono text-[#00C2FF] print:text-blue-600">
                    {totalSolved}
                  </p>
                  <span className="text-[10px] font-mono text-[#14CA74] print:text-green-600 font-bold">
                    {streaks.currentStreak}d Active Streak
                  </span>
                </div>
              </div>

              {/* Competitive Matrix (Platforms) */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#AEB9E1] print:text-gray-800">
                  Platform Verification &amp; Contest Ratings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {accounts.length > 0 ? (
                    accounts.map((acc) => (
                      <div
                        key={acc.platform}
                        className="rounded-xl border border-[rgba(126,137,172,0.15)] bg-[#0B1739] p-3 print:border-gray-200 print:bg-gray-50"
                      >
                        <p className="text-[10px] font-bold uppercase text-[#7E89AC] print:text-gray-500">
                          {acc.platform}
                        </p>
                        <p className="text-xs font-mono font-bold text-white print:text-gray-900">
                          @{acc.handle}
                        </p>
                        <p className="text-sm font-black font-mono text-[#00C2FF] mt-1 print:text-blue-600">
                          {acc.rating ? `Rating: ${acc.rating}` : 'Active Contender'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 rounded-xl border border-[rgba(126,137,172,0.15)] bg-[#0B1739] p-3 text-xs text-[#7E89AC]">
                      No platforms linked yet. Sync your LeetCode or Codeforces accounts to display contest ratings.
                    </div>
                  )}
                </div>
              </div>

              {/* Difficulty Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#AEB9E1] print:text-gray-800">
                  Problem Difficulty Distribution
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-[#14CA74]/30 bg-[#14CA74]/10 p-2.5 print:border-green-300 print:bg-green-50">
                    <p className="text-[10px] font-bold uppercase text-[#14CA74] print:text-green-700">Easy</p>
                    <p className="text-lg font-black font-mono text-white print:text-gray-900">{difficulty.easy}</p>
                  </div>
                  <div className="rounded-xl border border-[#FDB52A]/30 bg-[#FDB52A]/10 p-2.5 print:border-yellow-300 print:bg-yellow-50">
                    <p className="text-[10px] font-bold uppercase text-[#FDB52A] print:text-yellow-700">Medium</p>
                    <p className="text-lg font-black font-mono text-white print:text-gray-900">{difficulty.medium}</p>
                  </div>
                  <div className="rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/10 p-2.5 print:border-red-300 print:bg-red-50">
                    <p className="text-[10px] font-bold uppercase text-[#FF5A65] print:text-red-700">Hard</p>
                    <p className="text-lg font-black font-mono text-white print:text-gray-900">{difficulty.hard}</p>
                  </div>
                </div>
              </div>

              {/* Company Readiness Match */}
              {companyReadiness.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#AEB9E1] print:text-gray-800">
                    Tier-1 Company Interview Readiness
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    {companyReadiness.slice(0, 5).map((comp) => (
                      <div
                        key={comp.company}
                        className="rounded-xl border border-[rgba(126,137,172,0.15)] bg-[#0B1739] p-2.5 print:border-gray-200 print:bg-gray-50"
                      >
                        <p className="text-[10px] font-bold text-[#AEB9E1] print:text-gray-700">{comp.company}</p>
                        <p className="text-base font-black font-mono text-[#00C2FF] mt-0.5 print:text-blue-600">
                          {comp.score}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Topic Proficiencies */}
              {strengths.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#AEB9E1] print:text-gray-800">
                    Verified Core Algorithmic Proficiencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((str) => (
                      <span
                        key={str.tag}
                        className="rounded-lg border border-[rgba(126,137,172,0.2)] bg-[#0B1739] px-3 py-1 text-xs font-mono text-white print:border-gray-300 print:bg-gray-100 print:text-gray-900"
                      >
                        {str.tag}: <strong className="text-[#00C2FF] print:text-blue-700">{str.count} Solves</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter Verification Footer */}
              <div className="flex items-center justify-between border-t border-[rgba(126,137,172,0.15)] pt-4 text-[10px] text-[#7E89AC] font-mono print:border-gray-300 print:text-gray-500">
                <p>Verified via DashCode Multi-Platform Sync • Timestamp: {new Date().toLocaleDateString()}</p>
                <p>Live Profile: {profileUrl}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
