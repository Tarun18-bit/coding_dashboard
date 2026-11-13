import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { LocalTime } from '@/components/LocalTime';
import { supabaseAdmin, escapeLike } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { problemUrl } from '@/lib/problem-links';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Bot, Trophy, CheckCircle2 } from 'lucide-react';
import { RatingChart } from '@/components/RatingChart';
import { Navbar } from '@/components/Navbar';

export const dynamic = 'force-dynamic';

const PLATFORM_LABEL: Record<string, string> = {
  codeforces: 'Codeforces',
  leetcode: 'LeetCode',
  codechef: 'CodeChef',
};

interface PlatformPageProps {
  params: Promise<{
    name: string;
  }>;
  searchParams?: Promise<{
    handle?: string;
  }>;
}

interface AccountRow {
  id: string;
  user_id: string;
  platform: string;
  handle: string;
  last_synced_at: string | null;
}

function getExternalProfileUrl(platform: string, handle: string) {
  const p = platform.toLowerCase();
  const h = encodeURIComponent(handle);
  if (p === 'codeforces') return `https://codeforces.com/profile/${h}`;
  if (p === 'leetcode') return `https://leetcode.com/u/${h}`;
  if (p === 'codechef') return `https://www.codechef.com/users/${h}`;
  return '#';
}

export async function generateMetadata({ params, searchParams }: PlatformPageProps): Promise<Metadata> {
  const { name } = await params;
  const handle = (searchParams ? (await searchParams)?.handle : undefined)?.trim().slice(0, 40);
  const label = PLATFORM_LABEL[decodeURIComponent(name).toLowerCase()];
  if (!label) return { title: 'Page not found', robots: { index: false } };
  return { title: handle ? `@${handle} on ${label}` : `${label} analytics` };
}

function EmptyState({
  currentUser,
  title,
  message,
}: {
  currentUser: Awaited<ReturnType<typeof getSessionUser>>;
  title: string;
  message: string;
}) {
  return (
    <div className="min-h-screen bg-[#090D1A] text-white flex flex-col">
      <Navbar currentUser={currentUser} activeUsername={currentUser?.username || ''} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-[#94A3B8] mt-1.5 text-xs max-w-md">{message}</p>
        <Link
          href={currentUser ? '/dashboard' : '/leaderboard'}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#00EA64] px-4 py-2 text-xs font-bold text-[#090D1A] shadow-[0_0_15px_rgba(0,234,100,0.3)] hover:bg-[#00C853] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {currentUser ? 'Back to Dashboard' : 'View Leaderboard'}
        </Link>
      </div>
    </div>
  );
}

export default async function PlatformDetailPage({ params, searchParams }: PlatformPageProps) {
  const { name } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const requestedHandle = resolvedSearch?.handle?.trim().slice(0, 60);
  const platformName = decodeURIComponent(name).toLowerCase();
  const platformLabel = PLATFORM_LABEL[platformName];
  if (!platformLabel) notFound();

  const currentUser = await getSessionUser();
  const columns = 'id, user_id, platform, handle, last_synced_at';
  let account: AccountRow | null = null;

  if (requestedHandle) {
    // A specific (public) handle, e.g. linked from someone's profile
    const { data } = await supabaseAdmin
      .from('accounts')
      .select(columns)
      .eq('platform', platformName)
      .ilike('handle', escapeLike(requestedHandle))
      .order('last_synced_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    account = data as AccountRow | null;
    if (!account) {
      return (
        <EmptyState
          currentUser={currentUser}
          title={`@${requestedHandle} isn't on DashCode`}
          message={`No DashCode user has linked the ${platformLabel} handle @${requestedHandle}.`}
        />
      );
    }
  } else if (currentUser) {
    // Your own linked account for this platform
    const { data } = await supabaseAdmin
      .from('accounts')
      .select(columns)
      .eq('user_id', currentUser.id)
      .eq('platform', platformName)
      .order('last_synced_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    account = data as AccountRow | null;
    if (!account) {
      return (
        <EmptyState
          currentUser={currentUser}
          title={`${platformLabel} isn't linked yet`}
          message={`Use "Add Platform" in the top bar to link your ${platformLabel} handle, then its ratings and submissions show up here.`}
        />
      );
    }
  } else {
    // Without a handle this page is personal: never show someone else's account to a visitor
    redirect(`/login?next=${encodeURIComponent(`/platform/${platformName}`)}`);
  }

  const isOwn = !!currentUser && account.user_id === currentUser.id;

  // Fetch snapshots, contests, submissions in parallel
  const [{ data: snapshots }, { data: contests }, { data: submissions }, { data: owner }] = await Promise.all([
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
    isOwn
      ? Promise.resolve({ data: null })
      : supabaseAdmin.from('users').select('username').eq('id', account.user_id).maybeSingle(),
  ]);
  const backHref = isOwn ? '/dashboard' : owner?.username ? `/u/${encodeURIComponent(owner.username)}` : '/leaderboard';
  const backLabel = isOwn ? 'Back to Dashboard' : owner?.username ? `Back to @${owner.username}` : 'Back to Leaderboard';

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
      <Navbar currentUser={currentUser} activeUsername={currentUser?.username || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-7">
        {/* Top Breadcrumb & Platform Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[#0E1628] p-5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <Link
              href={backHref}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(148,163,184,0.18)] bg-[#090D1A] text-[#94A3B8] hover:border-[#00EA64] hover:text-white transition"
              title={backLabel}
              aria-label={backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">
                  {platformLabel} Deep-Dive Analytics
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
                    • Synced <LocalTime iso={account.last_synced_at} mode="datetime" />
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
            <span>Open on {platformLabel}</span>
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
                    const link = problemUrl(account.platform, s.problem_id);
                    return (
                      <tr key={s.id} className="hover:bg-[#131E35]/60 transition-colors">
                        <td className="py-3 px-3.5 font-semibold text-white">
                          {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-[#00EA64] hover:underline">
                              {s.title}
                            </a>
                          ) : (
                            s.title
                          )}
                        </td>
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
                          <LocalTime iso={s.submitted_at} />
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
