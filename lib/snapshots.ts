import { supabaseAdmin } from './db';
import type { Snapshot } from './platforms/types';

/**
 * Stores a profile snapshot and keeps the table small:
 *  - only the newest snapshot of each UTC day is kept per account (daily history for charts)
 *  - raw_json (large: LeetCode's submission calendar etc.) is kept only on the newest snapshot
 * Without this, hourly syncs add ~24 rows/day/account with big JSON blobs and quickly
 * exhaust the Supabase free tier.
 */
export async function saveSnapshot(accountId: string, profile: Snapshot, takenAt = new Date()): Promise<void> {
  const takenAtIso = takenAt.toISOString();
  const { data: inserted, error } = await supabaseAdmin
    .from('snapshots')
    .insert({
      account_id: accountId,
      taken_at: takenAtIso,
      solved_total: profile.solvedTotal,
      easy: profile.easy,
      medium: profile.medium,
      hard: profile.hard,
      rating: profile.rating,
      max_rating: profile.maxRating,
      raw_json: profile.rawJson,
    })
    .select('id')
    .single();
  if (error) throw error;

  const dayStart = `${takenAtIso.slice(0, 10)}T00:00:00.000Z`;
  await Promise.all([
    // Older snapshots from the same day are superseded by this one
    supabaseAdmin
      .from('snapshots')
      .delete()
      .eq('account_id', accountId)
      .gte('taken_at', dayStart)
      .neq('id', inserted.id),
    // Earlier days keep their numbers but drop the heavy raw payload
    supabaseAdmin
      .from('snapshots')
      .update({ raw_json: null })
      .eq('account_id', accountId)
      .lt('taken_at', dayStart)
      .not('raw_json', 'is', null),
  ]).catch((e) => console.error('[Snapshots] Prune failed for', accountId, e));
}
