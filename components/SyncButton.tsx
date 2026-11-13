'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error';
}

/** Stats older than this are refreshed automatically when the dashboard opens. */
const AUTO_SYNC_AFTER_MS = 30 * 60 * 1000;
/** Don't auto-sync again within this window (per browser tab), even if a sync failed. */
const AUTO_SYNC_COOLDOWN_MS = 10 * 60 * 1000;
const AUTO_SYNC_KEY = 'dashcode:lastAutoSync';

interface SyncButtonProps {
  /** Oldest last-sync time across the user's linked accounts (ISO), when known */
  lastSyncedAt?: string | null;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ lastSyncedAt }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const runningRef = useRef(false);

  const runSync = useCallback(
    async (mode: 'manual' | 'auto') => {
      if (runningRef.current) return;
      runningRef.current = true;
      setLoading(true);
      setStatus('idle');
      setMessage('');

      try {
        // Authenticated via the user's session cookie; the server only syncs the logged-in user.
        const res = await fetch(mode === 'manual' ? '/api/sync?force=true' : '/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to sync');
        }

        setStatus('success');
        setMessage('Updated');
        router.refresh();
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      } catch (error: unknown) {
        // A failed background refresh shouldn't nag; the manual button still reports errors
        if (mode === 'manual') {
          setStatus('error');
          setMessage(getErrorMessage(error));
          setTimeout(() => {
            setStatus('idle');
            setMessage('');
          }, 4000);
        }
      } finally {
        runningRef.current = false;
        setLoading(false);
      }
    },
    [router]
  );

  // Keep stats fresh without relying only on the hourly job: refresh stale data on open
  useEffect(() => {
    if (!lastSyncedAt) return;
    const age = Date.now() - new Date(lastSyncedAt).getTime();
    if (!Number.isFinite(age) || age < AUTO_SYNC_AFTER_MS) return;
    try {
      const last = Number(sessionStorage.getItem(AUTO_SYNC_KEY) || 0);
      if (Date.now() - last < AUTO_SYNC_COOLDOWN_MS) return;
      sessionStorage.setItem(AUTO_SYNC_KEY, String(Date.now()));
    } catch {
      // storage unavailable (private mode): still sync once for this page view
    }
    const timer = setTimeout(() => void runSync('auto'), 0);
    return () => clearTimeout(timer);
  }, [lastSyncedAt, runSync]);

  return (
    <div className="flex items-center gap-2.5">
      {status === 'success' && (
        <span
          role="status"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#14CA74] font-mono animate-fade-in bg-[#14CA74]/10 border border-[#14CA74]/30 px-2 py-1 rounded-lg"
        >
          <Check className="h-3.5 w-3.5" /> {message}
        </span>
      )}
      {status === 'error' && (
        <span
          role="alert"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#FF5A65] font-mono animate-fade-in bg-[#FF5A65]/10 border border-[#FF5A65]/30 px-2 py-1 rounded-lg"
        >
          <AlertCircle className="h-3.5 w-3.5" /> {message}
        </span>
      )}

      <button
        type="button"
        onClick={() => void runSync('manual')}
        disabled={loading}
        title={status === 'error' ? message : 'Fetch your latest stats from every linked platform'}
        aria-label={loading ? 'Syncing your stats' : 'Sync your stats'}
        className={`inline-flex items-center gap-2 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(14,67,251,0.4)] transition-all duration-150 hover:bg-[#0B34C7] hover:shadow-[0_0_25px_rgba(14,67,251,0.6)] active:scale-98 ${
          loading ? 'cursor-not-allowed opacity-70' : ''
        }`}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{loading ? 'Syncing...' : 'Sync'}</span>
      </button>
    </div>
  );
};
