'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Terminal, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, User, ShieldCheck, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Authentication failed';
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Where to go after signing in (e.g. back to a clan invite); same-site paths only
  const getSafeNext = () => {
    if (typeof window === 'undefined') return '/dashboard';
    const next = new URLSearchParams(window.location.search).get('next');
    return next && /^\/(?!\/)[^\\@]*$/.test(next) ? next : '/dashboard';
  };

  React.useEffect(() => {
    // Auto-detect password recovery tokens or redirect parameters
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const requestedMode = params.get('mode');

      if (
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        requestedMode === 'reset'
      ) {
        router.replace(`/reset-password${hash || search}`);
        return;
      }

      if (requestedMode === 'signup' || requestedMode === 'register') {
        setMode('signup');
      } else if (requestedMode === 'forgot') {
        setMode('forgot');
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        setSuccessMsg('Password reset instructions sent! Check your inbox to set a new password.');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_name: username || email.split('@')[0],
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push(getSafeNext());
          router.refresh();
        } else {
          setSuccessMsg('Account registered! If confirmation is required, check your email, then return here to sign in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push(getSafeNext());
        router.refresh();
      }
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error) || 'Authentication failed');
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
                PREP
              </span>
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {mode === 'signin' && 'Sign in to DashCode'}
            {mode === 'signup' && 'Create your Developer Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-[#94A3B8]">
            {mode === 'signin' && 'Enter your credentials to access your unified coding intelligence'}
            {mode === 'signup' && 'Join to automatically sync Codeforces, LeetCode, and CodeChef'}
            {mode === 'forgot' && 'Enter your email address and we will send you a password reset link'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-[rgba(148,163,184,0.15)] bg-[#0E1628] p-7 shadow-2xl shadow-[rgba(1,5,17,0.8)] backdrop-blur-xl space-y-5">
          {/* Segmented Mode Switcher */}
          {mode !== 'forgot' ? (
            <div className="grid grid-cols-2 rounded-xl bg-[#090D1A] p-1 border border-[rgba(148,163,184,0.12)]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#00EA64] text-[#090D1A] shadow-[0_0_15px_rgba(0,234,100,0.3)]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#00EA64] text-[#090D1A] shadow-[0_0_15px_rgba(0,234,100,0.3)]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-mono font-bold text-[#00EA64] flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Password Recovery
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-[#94A3B8] hover:text-white transition"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

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

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label htmlFor="auth-username" className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                  <input
                    id="auth-username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. alex_coder"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#00EA64] focus:outline-hidden transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#00EA64] focus:outline-hidden transition"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-[#00EA64] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:border-[#00EA64] focus:outline-hidden transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#00EA64] py-2.5 text-xs font-bold text-[#090D1A] shadow-[0_0_20px_rgba(0,234,100,0.3)] transition hover:bg-[#00C853] active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Processing...'
                  : mode === 'signin'
                  ? 'Sign In to Dashboard'
                  : mode === 'signup'
                  ? 'Complete Registration'
                  : 'Send Reset Link'}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            {mode === 'signup' && (
              <p className="text-center text-[10px] text-[#64748B]">
                By creating an account you agree to the{' '}
                <Link href="/terms" className="text-[#94A3B8] underline hover:text-white">Terms of Use</Link> and{' '}
                <Link href="/privacy" className="text-[#94A3B8] underline hover:text-white">Privacy Policy</Link>.
              </p>
            )}
          </form>

          {/* Security Note */}
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#64748B] font-mono">
              <ShieldCheck className="h-3 w-3 text-[#00EA64]" />
              Secured with Supabase PostgreSQL Auth
            </span>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-[#94A3B8] hover:text-white transition">
            ← Back to DashCode Home
          </Link>
        </div>
      </div>
    </div>
  );
}
