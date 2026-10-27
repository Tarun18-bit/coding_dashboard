import { supabaseAdmin } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Bot, Trophy, CheckCircle2 } from 'lucide-react';
import { RatingChart } from '@/components/RatingChart';
import { Navbar } from '@/components/Navbar';

export const revalidate = 60;

interface PlatformPageProps {
  params: Promise<{
    name: string;
  }>;
  searchParams?: Promise<{
    handle?: string;
  }>;
}

function getExternalProfileUrl(platform: string, handle: string) {
  const p = platform.toLowerCase();
  if (p === 'codeforces') return `https://codeforces.com/profile/${handle}`;
  if (p === 'leetcode') return `https://leetcode.com/u/${handle}`;
  if (p === 'codechef') return `https://www.codechef.com/users/${handle}`;
  return '#';
}

export default async function PlatformDetailPage({ params, searchParams }: PlatformPageProps) {
  const { name } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const requestedHandle = resolvedSearch?.handle?.trim();
  const platformName = decodeURIComponent(name).toLowerCase();

  let authUser: any = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    authUser = data?.user ?? null;
  } catch {
    // offline fallback
  }

  const currentUser = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        username: authUser.user_metadata?.user_name || authUser.email?.split('@')[0],
      }
    : null;

  let account: any = null;

  // 1. If a specific handle was requested via ?handle=..., look up that exact platform + handle
  if (requestedHandle) {
    const { data } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .ilike('platform', platformName)
      .ilike('handle', requestedHandle)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    account = data;
  }

  // 2. Otherwise, if the user is logged in, fetch their linked account for this platform
  if (!account && authUser?.id) {
    const { data } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', authUser.id)
      .ilike('platform', platformName)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    account = data;
  }

  // 3. Fallback: pick the most recently synced account for this platform
  if (!account) {
    const { data } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .ilike('platform', platformName)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    account = data;
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-[#090D1A] text-white flex flex-col">
        <Navbar currentUser={currentUser} activeUsername={currentUser?.username || 'oggy'} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-bold capitalize">Platform &quot;{platformName}&quot; Not Linked Yet</h1>
          <p className="text-[#94A3B8] mt-1.5 text-xs max-w-md">
            You haven&apos;t connected a {platformName} handle yet. Link your handle from the dashboard to inspect platform-specific ratings and submissions.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00EA64] px-4 py-2 text-xs font-bold text-[#090D1A] shadow-[0_0_15px_rgba(0,234,100,0.3)] hover:bg-[#00C853] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Fetch snapshots, contests, submissions in parallel
  const [{ data: snapshots }, { data: contests }, { data: submissions }] = await Promise.all([
    supabaseAdmin
      .from('snapshots')
      .select('*')
      .eq('account_id', account.id)
      .order('taken_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('contests')
      .select('*')
      .eq('account_id', account.id)
      .order('date', { ascending: true }),
    supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('account_id', account.id)
      .order('submitted_at', { ascending: false })
      .limit(30),
  ]);

  const latestSnap = snapshots?.[0];
  const chartData = (contests || []).map((c) => ({
    date: new Date(c.date).toISOString().slice(0, 10),
    rating: c.rating_after || 0,
    contestName: c.contest_name,
    platform: account.platform,
  }));

  const externalUrl = getExternalProfileUrl(account.platform, account.handle);

  return (
    <div className="min-h-screen bg-[#090D1A] text-white selection:bg-[#00EA64] selection:text-[#090D1A] pb-14">
      <Navbar currentUser={currentUser} activeUsername={currentUser?.username || 'oggy'} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-7">
        {/* Top Breadcrumb & Platform Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] text-[#94A3B8] hover:border-[#00EA64] hover:text-white transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold capitalize text-white">
                  {account.platform} Deep-Dive Analytics
                </h1>
                {latestSnap?.rating ? (
                  <span className="rounded-md border border-[#00EA64]/30 bg-[#00EA64]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#00EA64]">
                    Rating: {latestSnap.rating}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                Handle: <span className="text-white font-semibold">@{account.handle}</span>
                {account.last_synced_at && (
                  <span className="text-[#64748B] ml-2">
                    • Synced {new Date(account.last_synced_at).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(148,163,184,0.2)] bg-[#090D1A] px-3.5 py-2 text-xs font-bold text-[#D1DBF9] hover:border-[#00EA64] hover:text-[#00EA64] transition"
          >
            <span className="capitalize">Open on {account.platform}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
            <p className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Total Solved</p>
            <p className="mt-2 text-3xl font-bold text-white font-mono">{latestSnap?.solved_total || 0}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
            <p className="text-[11px] uppercase tracking-wider text-[#14CA74] font-bold">Easy</p>
            <p className="mt-2 text-3xl font-bold text-[#14CA74] font-mono">{latestSnap?.easy || 0}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
            <p className="text-[11px] uppercase tracking-wider text-[#FDB52A] font-bold">Medium</p>
            <p className="mt-2 text-3xl font-bold text-[#FDB52A] font-mono">{latestSnap?.medium || 0}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
            <p className="text-[11px] uppercase tracking-wider text-[#FF5A65] font-bold">Hard</p>
            <p className="mt-2 text-3xl font-bold text-[#FF5A65] font-mono">{latestSnap?.hard || 0}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-lg">
            <p className="text-[11px] uppercase tracking-wider text-[#00C2FF] font-bold flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" /> Peak Rating
            </p>
            <p className="mt-2 text-3xl font-bold text-[#00C2FF] font-mono">
              {latestSnap?.max_rating || latestSnap?.rating || '—'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-lg">
          <RatingChart data={chartData} />
        </div>

        <div className="rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00EA64]" />
              <span>Recent Submissions ({submissions?.length || 0})</span>
            </h2>
          </div>

          {!submissions || submissions.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#94A3B8]">
              No recent submissions recorded for @{account.handle}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[rgba(148,163,184,0.14)] bg-[#090D1A] text-[11px] uppercase tracking-wider text-[#94A3B8]">
                  <tr>
                    <th className="py-3 px-3.5 rounded-l-xl">Problem</th>
                    <th className="py-3 px-3.5">Verdict</th>
                    <th className="py-3 px-3.5">Tags</th>
                    <th className="py-3 px-3.5 text-center">AI Review</th>
                    <th className="py-3 px-3.5 text-right rounded-r-xl">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(148,163,184,0.08)]">
                  {submissions.map((s) => {
                    const isAc = s.verdict === 'AC' || s.verdict === 'OK';
                    return (
                      <tr key={s.id} className="hover:bg-[#131E35]/60 transition-colors">
                        <td className="py-3 px-3.5 font-semibold text-white">{s.title}</td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                              isAc
                                ? 'bg-[#14CA74]/15 text-[#14CA74] border border-[#14CA74]/30'
                                : 'bg-[#FF5A65]/15 text-[#FF5A65] border border-[#FF5A65]/30'
                            }`}
                          >
                            {s.verdict}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-[#94A3B8]">
                          {(s.tags || []).slice(0, 3).map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="mr-1.5 inline-block rounded-md bg-[#090D1A] border border-[rgba(148,163,184,0.15)] px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <Link
                            href={`/reviewer?problem=${encodeURIComponent(s.title)}&platform=${encodeURIComponent(account.platform)}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#CB3CFF]/30 bg-[#CB3CFF]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#CB3CFF] hover:bg-[#CB3CFF] hover:text-white transition"
                          >
                            <Bot className="h-3 w-3" />
                            <span>Inspect</span>
                          </Link>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-[11px] text-[#64748B]">
                          {new Date(s.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
