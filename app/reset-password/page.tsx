'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Terminal, Lock, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user has an active recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // If there's a hash with access_token, the browser client will parse it
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          setHasSession(true);
        } else {
          // Wait slightly for onAuthStateChange to fire
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            setHasSession(!!retrySession);
          }, 1200);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Your password has been successfully updated! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to update password. Please try requesting a new link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D1A] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-[#00EA64] selection:text-[#090D1A] relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00EA64]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-[#0E43FB]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00EA64] text-[#090D1A] font-black shadow-[0_0_20px_rgba(0,234,100,0.4)] transition group-hover:scale-105">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-[#00EA64] transition-colors">
                DashCode
              </span>
              <span className="rounded bg-[#00EA64]/10 border border-[#00EA64]/30 px-1 py-0.2 text-[9px] font-mono font-bold text-[#00EA64]">
                SECURITY
              </span>
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Set New Password
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Enter your new password below to regain full access to your account.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[rgba(148,163,184,0.15)] bg-[#0E1628] p-7 shadow-2xl shadow-[rgba(1,5,17,0.8)] backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-[rgba(148,163,184,0.12)] pb-3">
            <KeyRound className="h-4 w-4 text-[#00EA64]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Password Reset Session
            </span>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/15 p-3 text-xs text-[#FF5A65]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-[#00EA64]/30 bg-[#00EA64]/15 p-3 text-xs text-[#00EA64]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {hasSession === false && !errorMsg && !successMsg && (
            <div className="rounded-xl border border-[#FFB016]/30 bg-[#FFB016]/10 p-3.5 space-y-2 text-xs text-[#FFB016]">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Recovery Link Notice</span>
              </div>
              <p className="text-[11px] text-[#AEB9E1] leading-relaxed">
                If your reset link has expired or was already used, please request a fresh reset link from the login page.
              </p>
              <div className="pt-1">
                <Link
                  href="/login"
                  className="inline-block text-xs font-bold text-[#00EA64] hover:underline"
                >
                  ← Request a new reset link
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#00EA64] focus:outline-hidden transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#00EA64] focus:outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#00EA64] py-2.5 text-xs font-bold text-[#090D1A] shadow-[0_0_20px_rgba(0,234,100,0.3)] transition hover:bg-[#00C853] active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Updating Password...' : 'Save & Update Password'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Security Note */}
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#64748B] font-mono">
              <ShieldCheck className="h-3 w-3 text-[#00EA64]" />
              End-to-end encrypted with Supabase Auth
            </span>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link href="/login" className="text-xs text-[#94A3B8] hover:text-white transition">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
