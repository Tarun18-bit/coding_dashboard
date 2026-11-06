import { NextRequest, NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { syncUser, syncAllUsers, DEFAULT_USER_ID } from '@/lib/sync';

// Vercel Hobby allows 60s; the background job stays inside this budget
export const maxDuration = 60;

const BURST_SYNC_WINDOW_MS = 10 * 1000; // protects against double clicks
const lastSyncTimeByTarget = new Map<string, number>();

/**
 * True only when the request carries the server-side SYNC_SECRET_TOKEN (the scheduled
 * GitHub Action). Fails closed: if no secret is configured, token access is disabled.
 */
function hasValidSyncSecret(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET_TOKEN;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization');
  return !!authHeader && authHeader.startsWith('Bearer ') && authHeader.substring(7) === secret;
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  const isCron = hasValidSyncSecret(req);

  let sessionUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    sessionUserId = data?.user?.id ?? null;
  } catch {
    // treated as anonymous
  }

  if (!isCron && !sessionUserId) {
    return NextResponse.json({ success: false, error: 'Please log in to sync your stats.' }, { status: 401 });
  }

  // Scheduled job without a specific user: refresh everyone in the background
  if (isCron && !searchParams.get('user_id')) {
    after(async () => {
      await syncAllUsers(50_000);
      revalidateDashboards();
    });
    return NextResponse.json({ success: true, mode: 'all-users', message: 'Background sync started' }, { status: 202 });
  }

  // Only the trusted cron caller may target another user or override demo handles
  const targetUserId = isCron ? searchParams.get('user_id') || DEFAULT_USER_ID : sessionUserId!;

  const now = Date.now();
  const lastSync = lastSyncTimeByTarget.get(targetUserId);
  if (lastSync && now - lastSync < BURST_SYNC_WINDOW_MS) {
    return NextResponse.json({ success: true, throttled: true, message: 'Sync was just run. Stats are fresh!' });
  }
  lastSyncTimeByTarget.set(targetUserId, now);

  const results = await syncUser(targetUserId, {
    force,
    handleOverrides: isCron
      ? {
          codeforces: searchParams.get('cf_handle') || undefined,
          leetcode: searchParams.get('lc_handle') || undefined,
          codechef: searchParams.get('cc_handle') || undefined,
        }
      : undefined,
  });
  revalidateDashboards();

  const failed = results.filter((r) => r.status === 'error');
  if (results.length > 0 && failed.length === results.length) {
    return NextResponse.json(
      { success: false, error: `Sync failed: ${failed.map((f) => `${f.platform} (${'error' in f ? f.error : ''})`).join(', ')}`, results },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    syncedAccounts: results.length,
    failedPlatforms: failed.map((f) => f.platform),
    results,
  });
}

function revalidateDashboards() {
  try {
    revalidatePath('/leaderboard');
    revalidatePath('/dashboard');
  } catch {
    // Ignore outside ISR runtime
  }
}
