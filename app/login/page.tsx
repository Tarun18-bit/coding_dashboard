'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Terminal, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Authentication failed';
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error) || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_name: username || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push('/');
          router.refresh();
        } else {
          setSuccessMsg('Check your email for the confirmation link to complete registration!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push('/');
        router.refresh();
      }
    } catch (error: unknown) {
      setErrorMsg(getErrorMessage(error) || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#081028] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-[#0E43FB] selection:text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#0E43FB]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-[#00C2FF]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0E43FB] to-[#00C2FF] text-white shadow-[0_0_20px_rgba(14,67,251,0.5)] transition group-hover:scale-105">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">DashCode</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-[#7E89AC]">
            {mode === 'signin'
              ? 'Enter your credentials to access your unified coding dashboard'
              : 'Join DashCode to track your competitive programming journey'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-[rgba(126,137,172,0.2)] bg-[#0B1739] p-7 shadow-2xl shadow-[rgba(1,5,17,0.8)] backdrop-blur-xl space-y-5">
          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 rounded-xl bg-[#0A1330] p-1 border border-[rgba(126,137,172,0.14)]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-[#0E43FB] text-white shadow-[0_0_15px_rgba(14,67,251,0.4)]'
                  : 'text-[#AEB9E1] hover:text-white'
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
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-[#0E43FB] text-white shadow-[0_0_15px_rgba(14,67,251,0.4)]'
                  : 'text-[#AEB9E1] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-[#FF5A65]/30 bg-[#FF5A65]/15 p-3 text-xs text-[#FF5A65]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-[#14CA74]/30 bg-[#14CA74]/15 p-3 text-xs text-[#14CA74]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-[#7E89AC]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex_coder"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#0E43FB] focus:outline-hidden transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#7E89AC]" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#0E43FB] focus:outline-hidden transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB9E1]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#7E89AC]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[rgba(126,137,172,0.2)] bg-[#0A1330] pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-[#7E89AC] focus:border-[#0E43FB] focus:outline-hidden transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(14,67,251,0.4)] transition hover:bg-[#0B34C7] active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In to Dashboard' : 'Create Account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(126,137,172,0.14)]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-[#0B1739] px-2.5 text-[#7E89AC] font-mono">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] py-2 text-xs font-semibold text-[#AEB9E1] hover:border-[#0E43FB] hover:text-white transition disabled:opacity-50"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] py-2 text-xs font-semibold text-[#AEB9E1] hover:border-[#0E43FB] hover:text-white transition disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
