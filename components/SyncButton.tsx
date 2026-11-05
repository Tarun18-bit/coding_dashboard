'use client';

import React, { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error';
}

export const SyncButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  const handleSync = async () => {
    if (loading) return;

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Authenticated via the user's session cookie; the server only syncs the logged-in user.
      const res = await fetch('/api/sync?force=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

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
      setStatus('error');
      setMessage(getErrorMessage(error));
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {status === 'success' && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#14CA74] font-mono animate-fade-in bg-[#14CA74]/10 border border-[#14CA74]/30 px-2 py-1 rounded-lg">
          <Check className="h-3.5 w-3.5" /> {message}
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#FF5A65] font-mono animate-fade-in bg-[#FF5A65]/10 border border-[#FF5A65]/30 px-2 py-1 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5" /> {message}
        </span>
      )}

      <button
        onClick={handleSync}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(14,67,251,0.4)] transition-all duration-150 hover:bg-[#0B34C7] hover:shadow-[0_0_25px_rgba(14,67,251,0.6)] active:scale-98 ${
          loading ? 'cursor-not-allowed opacity-70' : ''
        }`}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Syncing...' : 'Sync'}</span>
      </button>
    </div>
  );
};
