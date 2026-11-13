'use client';

import React, { useState } from 'react';
import { Plus, X, Check, Loader2, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Linking failed';
}

interface AccountModalProps {
  /** Show the "Add Platform" text on small screens too (e.g. the empty-state call to action) */
  alwaysShowLabel?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({ alwaysShowLabel = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState('codeforces');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handle }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to link account');
      }

      setStatus('success');
      setHandle('');
      router.refresh();

      setTimeout(() => {
        setStatus('idle');
        setIsOpen(false);
      }, 1500);
    } catch (error: unknown) {
      setStatus('error');
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Add a coding platform"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:border-[#0E43FB] hover:bg-[#0B1739] active:scale-98"
      >
        <Plus className="h-3.5 w-3.5 text-[#00C2FF]" />
        <span className={alwaysShowLabel ? '' : 'hidden sm:inline'}>Add Platform</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081028]/80 backdrop-blur-md animate-fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-label="Link platform account" className="relative w-full max-w-md rounded-2xl border border-[rgba(126,137,172,0.22)] bg-[#0B1739] p-6 shadow-2xl shadow-[rgba(1,5,17,0.8)] space-y-5">
            <div className="flex items-center justify-between border-b border-[rgba(126,137,172,0.14)] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0E43FB]/15 border border-[#0E43FB]/30 text-[#00C2FF]">
                  <Link2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Link Platform Account</h3>
                  <p className="text-[11px] text-[#7E89AC]">Connect your Codeforces, LeetCode, or CodeChef profiles</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-[#AEB9E1] hover:bg-[#0A1330] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-2 rounded-xl border border-[#14CA74]/30 bg-[#14CA74]/15 p-3 text-xs text-[#14CA74] font-medium">
                <Check className="h-4 w-4 text-[#14CA74]" />
                <span>Account linked and synced!</span>
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/15 p-3 text-xs text-[#FF5A65] font-medium">
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLink} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="link-platform" className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                  Select Platform
                </label>
                <select
                  id="link-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2.5 text-xs text-white focus:border-[#0E43FB] focus:outline-hidden"
                >
                  <option value="codeforces">Codeforces</option>
                  <option value="leetcode">LeetCode</option>
                  <option value="codechef">CodeChef</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="link-handle" className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                  Handle / Username
                </label>
                <input
                  id="link-handle"
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. your_handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] px-3.5 py-2.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#0E43FB] focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[rgba(126,137,172,0.14)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] px-4 py-2 text-xs font-semibold text-[#AEB9E1] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:bg-[#0B34C7]"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{loading ? 'Linking & Syncing...' : 'Link Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
