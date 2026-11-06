import { supabaseAdmin } from './db';
import { clearStatsCache } from './aggregate';
import { updateUserLeaderboardCache } from './leaderboard';
import { saveSnapshot } from './snapshots';
import { ensurePublicUser } from './users';
import { codeforcesFetcher } from './platforms/codeforces';
import { leetcodeFetcher } from './platforms/leetcode';
import { codechefFetcher } from './platforms/codechef';
import type { PlatformFetcher } from './platforms/types';

export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
const SYNC_CACHE_WINDOW_MS = 60 * 1000;

export function getFetcher(platform: string): PlatformFetcher | null {
  if (platform === 'codeforces') return codeforcesFetcher;
  if (platform === 'leetcode') return leetcodeFetcher;
  if (platform === 'codechef') return codechefFetcher;
  return null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return 'Unknown error';
}

export type AccountSyncResult =
  | { status: 'success'; platform: string; handle: string; solvedTotal: number; rating?: number | null }
  | { status: 'skipped'; platform: string; handle: string; reason: string }
  | { status: 'error'; platform: string; handle: string; error: string };

/** Fetches one platform account and stores snapshot, submissions and contests. Never throws. */
export async function syncAccount(
  userId: string,
  platform: string,
  handle: string,
  force: boolean,
  minIntervalMs = SYNC_CACHE_WINDOW_MS
): Promise<AccountSyncResult> {
  const fetcher = getFetcher(platform);
  if (!fetcher) return { status: 'error', platform, handle, error: 'Unsupported platform' };

  try {
    const { data: existing, error: accError } = await supabaseAdmin
      .from('accounts')
      .select('id, last_synced_at')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('handle', handle)
      .maybeSingle();
    if (accError) throw accError;

    let account = existing;
    if (!account) {
      const { data: created, error: insertError } = await supabaseAdmin
        .from('accounts')
        .insert({ user_id: userId, platform, handle })
        .select('id, last_synced_at')
        .single();
      if (insertError) throw insertError;
      account = created;
    }

    if (!force && account.last_synced_at) {
      const since = Date.now() - new Date(account.last_synced_at).getTime();
      if (since < minIntervalMs) {
        return { status: 'skipped', platform, handle, reason: `Synced ${Math.round(since / 1000)}s ago` };
      }
    }

    const [profile, contests, submissions] = await Promise.all([
      fetcher.fetchProfile(handle),
      fetcher.fetchContests(handle),
      fetcher.fetchRecentSubmissions(handle, 100),
    ]);

    await saveSnapshot(account.id, profile);

    if (submissions.length > 0) {
      const { error: subError } = await supabaseAdmin.from('submissions').upsert(
        submissions.map((sub) => ({
          account_id: account.id,
          platform_submission_id: sub.platformSubmissionId,
          problem_id: sub.problemId,
          title: sub.title,
          verdict: sub.verdict,
          tags: sub.tags,
          difficulty: sub.difficulty,
          submitted_at: sub.submittedAt,
        })),
        { onConflict: 'account_id,platform_submission_id', ignoreDuplicates: false }
      );
      if (subError) throw subError;
    }

    if (contests.length > 0) {
      await supabaseAdmin.from('contests').delete().eq('account_id', account.id);
      const { error: contestError } = await supabaseAdmin.from('contests').insert(
        contests.map((contest) => ({
          account_id: account.id,
          contest_name: contest.contestName,
          date: contest.date,
          rank: contest.rank,
          rating_before: contest.ratingBefore,
          rating_after: contest.ratingAfter,
        }))
      );
      if (contestError) throw contestError;
    }

    await supabaseAdmin.from('accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);

    return { status: 'success', platform, handle, solvedTotal: profile.solvedTotal, rating: profile.rating };
  } catch (error) {
    console.error(`[Sync] ${platform}/${handle} failed:`, error);
    return { status: 'error', platform, handle, error: errorMessage(error) };
  }
}

/**
 * Syncs every linked account of a user (platforms are fault-isolated), then refreshes
 * their cached stats and leaderboard row.
 */
export async function syncUser(
  userId: string,
  opts: { force?: boolean; minIntervalMs?: number; handleOverrides?: Partial<Record<string, string>> } = {}
): Promise<AccountSyncResult[]> {
  const force = !!opts.force;
  await ensurePublicUser(userId, userId === DEFAULT_USER_ID ? 'default_user' : 'user');

  const { data: userAccounts } = await supabaseAdmin
    .from('accounts')
    .select('platform, handle')
    .eq('user_id', userId);

  let targets: { platform: string; handle: string }[] = userAccounts || [];
  if (targets.length === 0 && userId === DEFAULT_USER_ID) {
    // Demo profile with no account rows yet: seed with the default handles
    targets = [
      { platform: 'codeforces', handle: opts.handleOverrides?.codeforces || process.env.DEFAULT_CODEFORCES_HANDLE || 'oggy_18' },
      { platform: 'leetcode', handle: opts.handleOverrides?.leetcode || process.env.DEFAULT_LEETCODE_USERNAME || 'txrun_18' },
      { platform: 'codechef', handle: opts.handleOverrides?.codechef || process.env.DEFAULT_CODECHEF_HANDLE || 'txrun_18' },
    ];
  }

  const results = await Promise.all(
    targets.map((t) => syncAccount(userId, t.platform, t.handle, force, opts.minIntervalMs))
  );

  if (results.some((r) => r.status === 'success')) {
    clearStatsCache(userId);
    await updateUserLeaderboardCache(userId).catch((e) => console.error('[Sync] Leaderboard update failed', e));
  }
  return results;
}

/**
 * Background job: syncs users whose accounts are the most out of date, within a time budget.
 * Called hourly by the GitHub Action, so over a few runs every user gets refreshed.
 */
export async function syncAllUsers(budgetMs: number, minIntervalMs = 45 * 60 * 1000) {
  const startedAt = Date.now();
  const { data: rows } = await supabaseAdmin
    .from('accounts')
    .select('user_id, last_synced_at')
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(1000);

  // Unique users, stalest first
  const queue: string[] = [];
  const seen = new Set<string>();
  for (const row of rows || []) {
    if (!seen.has(row.user_id)) {
      seen.add(row.user_id);
      queue.push(row.user_id);
    }
  }
  if (!seen.has(DEFAULT_USER_ID)) queue.push(DEFAULT_USER_ID);

  let synced = 0;
  let failed = 0;
  const CONCURRENCY = 3;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0 && Date.now() - startedAt < budgetMs) {
      const userId = queue.shift()!;
      const results = await syncUser(userId, { minIntervalMs });
      if (results.some((r) => r.status === 'error')) failed++;
      if (results.some((r) => r.status === 'success')) synced++;
    }
  });
  await Promise.all(workers);

  console.log(`[SyncAll] synced=${synced} withErrors=${failed} remaining=${queue.length} in ${Date.now() - startedAt}ms`);
  return { synced, failed, remaining: queue.length };
}
