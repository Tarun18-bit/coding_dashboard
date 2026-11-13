'use client';

import React from 'react';
import Link from 'next/link';
import { User, LogIn, LogOut } from 'lucide-react';

interface UserNavProps {
  user: {
    id: string;
    email?: string | null;
    username?: string;
  } | null;
}

export const UserNav: React.FC<UserNavProps> = ({ user }) => {
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] transition hover:bg-[#0B34C7] active:scale-98"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>Sign In</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      <Link
        href={user.username ? `/u/${encodeURIComponent(user.username)}` : '/dashboard'}
        title="Your public profile"
        aria-label="Your public profile"
        className="flex items-center gap-2 rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] py-1.5 px-2 sm:px-3 hover:border-[#0E43FB] transition"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#0E43FB]/20 text-[#00C2FF] text-[10px] font-mono font-bold">
          <User className="h-3 w-3" />
        </div>
        <span className="hidden md:inline max-w-[120px] truncate text-xs font-semibold text-white font-mono">
          {user.username || user.email?.split('@')[0] || 'User'}
        </span>
      </Link>

      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          title="Sign Out"
          aria-label="Sign out"
          className="rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] p-2 text-[#AEB9E1] hover:border-[#FF5A65] hover:text-[#FF5A65] hover:bg-[#FF5A65]/10 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
