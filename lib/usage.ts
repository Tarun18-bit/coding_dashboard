import { supabaseAdmin } from './db';

/** Daily per-user limits (UTC day). Shared free services, so each user gets a fair share. */
export const DAILY_LIMITS = {
  ai_review: 25,
  code_run: 40,
  account_link: 20,
} as const;

export type UsageKind = keyof typeof DAILY_LIMITS;

/**
 * Uses one unit of the user's daily quota. Fails open (allows) if the usage table/function
 * hasn't been created yet, so the app keeps working before migration 003 is run.
 */
export async function consumeDailyQuota(
  userId: string,
  kind: UsageKind
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = DAILY_LIMITS[kind];
  const { data, error } = await supabaseAdmin.rpc('consume_usage', { p_user: userId, p_kind: kind, p_limit: limit });
  if (error) {
    console.warn('[Usage] quota check unavailable, allowing request:', error.message);
    return { allowed: true, used: 0, limit };
  }
  const count = Number(data);
  return count === -1 ? { allowed: false, used: limit, limit } : { allowed: true, used: count, limit };
}

export function quotaMessage(kind: UsageKind): string {
  const limit = DAILY_LIMITS[kind];
  const what = kind === 'ai_review' ? 'AI reviews' : kind === 'code_run' ? 'C++/Java runs' : 'account links';
  return `You've used all ${limit} ${what} for today. The limit resets at 00:00 UTC (05:30 IST).`;
}
