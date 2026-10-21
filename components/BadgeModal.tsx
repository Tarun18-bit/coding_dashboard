'use client';

import React, { useState } from 'react';
import { Code, Check, X, Sparkles, Copy, ExternalLink } from 'lucide-react';

interface BadgeModalProps {
  username?: string;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({ username = 'txrun_18' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<'md' | 'html' | 'url' | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const badgeUrl = `${origin}/api/badge/${encodeURIComponent(username)}`;
  const profileUrl = `${origin}/u/${encodeURIComponent(username)}`;

  const markdownSnippet = `[![Coding Progress](${badgeUrl})](${profileUrl})`;
  const htmlSnippet = `<a href="${profileUrl}">\n  <img src="${badgeUrl}" alt="${username}'s Coding Stats" />\n</a>`;

  const copyToClipboard = async (text: string, type: 'md' | 'html' | 'url') => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-3.5 py-1.5 text-xs font-semibold text-[#AEB9E1] shadow-sm transition hover:border-[#0E43FB] hover:bg-[#0B1739] hover:text-white active:scale-98"
        title="Get GitHub README Badge"
      >
        <Code className="h-3.5 w-3.5 text-[#CB3CFF]" />
        <span>GitHub Badge</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081028]/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-[rgba(126,137,172,0.22)] bg-[#0B1739] p-6 shadow-2xl shadow-[rgba(1,5,17,0.9)] space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#CB3CFF]/15 border border-[#CB3CFF]/30 text-[#CB3CFF]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Dynamic GitHub Profile Badge</h3>
                  <p className="text-[11px] text-[#7E89AC]">Auto-updating SVG badge for your GitHub README & Portfolio</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-[#AEB9E1] hover:bg-[#0A1330] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live Visual Preview */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                Live Preview
              </label>
              <div className="flex justify-center rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#081028] p-4 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badgeUrl}
                  alt={`${username}'s live coding stats badge`}
                  className="max-w-full h-auto rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Markdown Code Snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                  Markdown (for GitHub README.md)
                </label>
                <button
                  onClick={() => copyToClipboard(markdownSnippet, 'md')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00C2FF] hover:underline"
                >
                  {copiedType === 'md' ? (
                    <>
                      <Check className="h-3 w-3 text-[#14CA74]" />
                      <span className="text-[#14CA74]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] p-3 text-[11px] font-mono text-[#D1DBF9] overflow-x-auto select-all">
                {markdownSnippet}
              </pre>
            </div>

            {/* Direct Image URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                  Direct SVG URL
                </label>
                <button
                  onClick={() => copyToClipboard(badgeUrl, 'url')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00C2FF] hover:underline"
                >
                  {copiedType === 'url' ? (
                    <>
                      <Check className="h-3 w-3 text-[#14CA74]" />
                      <span className="text-[#14CA74]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={badgeUrl}
                className="w-full rounded-xl border border-[rgba(126,137,172,0.16)] bg-[#0A1330] px-3.5 py-2 text-xs font-mono text-[#AEB9E1] select-all focus:outline-hidden"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-[rgba(126,137,172,0.14)]">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-4 py-2 text-xs font-semibold text-[#AEB9E1] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
