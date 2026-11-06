'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  username?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ username }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = username
      ? `${window.location.origin}/u/${encodeURIComponent(username)}`
      : window.location.href;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2.5 py-1.5 text-xs font-semibold text-[#AEB9E1] shadow-sm transition hover:border-[#0E43FB] hover:bg-[#0B1739] hover:text-white active:scale-98"
      title="Copy public profile link"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#14CA74]" />
          <span className="text-[#14CA74] font-mono">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-[#00C2FF]" />
          <span className="hidden xl:inline">Share</span>
        </>
      )}
    </button>
  );
};
