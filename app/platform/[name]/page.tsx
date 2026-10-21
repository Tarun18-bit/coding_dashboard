import { supabaseAdmin } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RatingChart } from '@/components/RatingChart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PlatformPageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function PlatformDetailPage({ params }: PlatformPageProps) {
  const { name } = await params;
  const platformName = name.toLowerCase();

  // Fetch account from DB
  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .ilike('platform', platformName)
    .maybeSingle();

  if (!account) {
    return (
      <div className="min-h-screen bg-[#081028] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">Platform &quot;{name}&quot; Not Found</h1>
        <p className="text-[#7E89AC] mt-1.5 text-xs">No account has been synced for this platform yet.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgba(14,67,251,0.5)] bg-[#0E43FB] px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,67,251,0.4)] hover:bg-[#0B34C7] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Fetch snapshots, contests, submissions
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
      .limit(20),
  ]);

  const latestSnap = snapshots?.[0];
  const chartData = (contests || []).map((c) => ({
    date: new Date(c.date).toISOString().slice(0, 10),
    rating: c.rating_after || 0,
    contestName: c.contest_name,
    platform: account.platform,
  }));

  return (
    <div className="min-h-screen bg-[#081028] text-white selection:bg-[#0E43FB] selection:text-white pb-14">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[rgba(126,137,172,0.18)] bg-[#0B1739]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(126,137,172,0.18)] bg-[#0A1330] text-[#AEB9E1] hover:border-[#0E43FB] hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold capitalize text-white">{account.platform} Overview</h1>
              <p className="text-[11px] text-[#7E89AC] font-mono">@{account.handle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)]">
            <p className="text-[11px] uppercase tracking-wider text-[#7E89AC] font-bold">Total Solved</p>
            <p className="mt-2 text-3xl font-bold text-white font-mono">{latestSnap?.solved_total || 0}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)]">
            <p className="text-[11px] uppercase tracking-wider text-[#14CA74] font-bold">Easy</p>
            <p className="mt-2 text-3xl font-bold text-white font-mono">{latestSnap?.easy || 0}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)]">
            <p className="text-[11px] uppercase tracking-wider text-[#FDB52A] font-bold">Medium</p>
            <p className="mt-2 text-3xl font-bold text-white font-mono">{latestSnap?.medium || 0}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)]">
            <p className="text-[11px] uppercase tracking-wider text-[#FF5A65] font-bold">Hard</p>
            <p className="mt-2 text-3xl font-bold text-white font-mono">{latestSnap?.hard || 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
          <RatingChart data={chartData} />
        </div>

        <div className="rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-6 shadow-lg shadow-[rgba(1,5,17,0.4)]">
          <h2 className="text-base font-bold tracking-tight text-white mb-4">Recent Submissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(126,137,172,0.16)] bg-[#0A1330] text-[11px] uppercase tracking-wider text-[#AEB9E1]">
                <tr>
                  <th className="py-3 px-3.5 rounded-l-xl">Problem</th>
                  <th className="py-3 px-3.5">Verdict</th>
                  <th className="py-3 px-3.5">Tags</th>
                  <th className="py-3 px-3.5 text-right rounded-r-xl">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(126,137,172,0.1)]">
                {(submissions || []).map((s) => (
                  <tr key={s.id} className="hover:bg-[#0A1330]/70 transition-colors">
                    <td className="py-3 px-3.5 font-semibold text-white">{s.title}</td>
                    <td className="py-3 px-3.5">
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#14CA74]/15 text-[#14CA74] border border-[#14CA74]/30 shadow-[0_0_8px_rgba(20,202,116,0.2)]">
                        {s.verdict}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#AEB9E1]">{(s.tags || []).join(', ')}</td>
                    <td className="py-3 px-3.5 text-right font-mono text-[11px] text-[#7E89AC]">
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
