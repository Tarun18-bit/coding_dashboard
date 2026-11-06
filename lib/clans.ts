import { supabaseAdmin } from './db';
import { problemUrl } from './problem-links';

/**
 * Study clans: real, shared groups stored in Supabase (tables `clans` and `clan_members`,
 * see supabase/migrations/002_clans_profiles.sql). Weekly progress comes from the daily
 * snapshots, so it counts genuinely new problems across every linked platform.
 */

export const CLAN_CATEGORIES = ['University', 'FAANG Prep', 'Competitive', 'Casual'] as const;
export type ClanCategory = (typeof CLAN_CATEGORIES)[number];
export type ClanRole = 'leader' | 'member';

export const MAX_CLANS_PER_USER = 10;
export const MAX_MEMBERS_PER_CLAN = 50;

export interface ClanSummary {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  category: ClanCategory;
  weeklyTarget: number;
  inviteCode: string;
  role: ClanRole;
  memberCount: number;
}

export interface ClanMemberStats {
  userId: string;
  username: string;
  role: ClanRole;
  joinedAt: string;
  solvedThisWeek: number;
  totalSolved: number;
  currentStreak: number;
  bestPlatform: string;
}

export interface ClanActivityItem {
  username: string;
  title: string;
  platform: string;
  difficulty: string | null;
  submittedAt: string;
  url: string | null;
}

export interface ClanDetail extends ClanSummary {
  ownerId: string;
  weekStart: string;
  weekSolves: number;
  members: ClanMemberStats[];
  activity: ClanActivityItem[];
}

type ClanRow = {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  category: string;
  weekly_target: number;
  invite_code: string;
  owner_id: string;
};

/** True when the clans tables exist (the migration has been run). */
export function isMissingTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const msg = String((error as { message?: string } | null)?.message || '');
  return code === '42P01' || code === 'PGRST205' || /does not exist|Could not find the table/i.test(msg);
}

/** Monday 00:00 UTC of the current week */
export function currentWeekStart(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return d;
}

export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes (0/O, 1/I)
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function toSummary(row: ClanRow, role: ClanRole, memberCount: number): ClanSummary {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    avatar: row.avatar,
    category: (CLAN_CATEGORIES as readonly string[]).includes(row.category) ? (row.category as ClanCategory) : 'Casual',
    weeklyTarget: row.weekly_target,
    inviteCode: row.invite_code,
    role,
    memberCount,
  };
}

/** Clans the user belongs to */
export async function listUserClans(userId: string): Promise<ClanSummary[]> {
  const { data: memberships, error } = await supabaseAdmin
    .from('clan_members')
    .select('role, clans(id, name, tagline, avatar, category, weekly_target, invite_code, owner_id)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });
  if (error) throw error;

  const rows = (memberships || []).filter((m) => m.clans) as unknown as { role: ClanRole; clans: ClanRow }[];
  if (rows.length === 0) return [];

  const { data: counts } = await supabaseAdmin
    .from('clan_members')
    .select('clan_id')
    .in('clan_id', rows.map((r) => r.clans.id));
  const countByClan = new Map<string, number>();
  for (const c of counts || []) countByClan.set(c.clan_id, (countByClan.get(c.clan_id) || 0) + 1);

  return rows.map((r) => toSummary(r.clans, r.role, countByClan.get(r.clans.id) || 1));
}

/** Full clan view with live member stats; returns null if the user is not a member */
export async function getClanDetail(clanId: string, viewerId: string): Promise<ClanDetail | null> {
  const [{ data: clan, error: clanErr }, { data: members, error: memErr }] = await Promise.all([
    supabaseAdmin
      .from('clans')
      .select('id, name, tagline, avatar, category, weekly_target, invite_code, owner_id')
      .eq('id', clanId)
      .maybeSingle(),
    supabaseAdmin
      .from('clan_members')
      .select('user_id, role, joined_at, users(username)')
      .eq('clan_id', clanId)
      .order('joined_at', { ascending: true }),
  ]);
  if (clanErr) throw clanErr;
  if (memErr) throw memErr;
  if (!clan) return null;

  const memberRows = (members || []) as unknown as {
    user_id: string;
    role: ClanRole;
    joined_at: string;
    users: { username: string } | null;
  }[];
  const viewer = memberRows.find((m) => m.user_id === viewerId);
  if (!viewer) return null;

  const userIds = memberRows.map((m) => m.user_id);
  const weekStart = currentWeekStart();
  const weekStartIso = weekStart.toISOString();
  // Look back a little before the week so each account has a baseline snapshot
  const lookbackIso = new Date(weekStart.getTime() - 8 * 86_400_000).toISOString();

  const [{ data: accounts }, { data: cacheRows }] = await Promise.all([
    supabaseAdmin.from('accounts').select('id, user_id, platform').in('user_id', userIds),
    supabaseAdmin
      .from('leaderboard_cache')
      .select('user_id, total_solved, current_streak, best_platform')
      .in('user_id', userIds),
  ]);
  const accountRows = (accounts || []) as { id: string; user_id: string; platform: string }[];
  const accountIds = accountRows.map((a) => a.id);
  const userByAccount = new Map(accountRows.map((a) => [a.id, a.user_id]));
  const platformByAccount = new Map(accountRows.map((a) => [a.id, a.platform]));

  // Snapshots around this week (at most ~1/day/account after pruning)
  const snapshots: { account_id: string; taken_at: string; solved_total: number | null }[] = [];
  if (accountIds.length > 0) {
    for (let page = 0; page < 5; page++) {
      const { data } = await supabaseAdmin
        .from('snapshots')
        .select('account_id, taken_at, solved_total')
        .in('account_id', accountIds)
        .gte('taken_at', lookbackIso)
        .order('taken_at', { ascending: false }) // newest first: the latest value is never cut off
        .range(page * 1000, page * 1000 + 999);
      if (!data) break;
      snapshots.push(...data);
      if (data.length < 1000) break;
    }
  }

  // Per account (rows are newest first): current = newest snapshot; baseline = newest snapshot
  // from before the week, or else the oldest one seen this week (account linked mid-week)
  const latest = new Map<string, number>();
  const beforeWeek = new Map<string, number>();
  const oldestThisWeek = new Map<string, number>();
  for (const s of snapshots) {
    const v = s.solved_total || 0;
    if (!latest.has(s.account_id)) latest.set(s.account_id, v);
    if (s.taken_at < weekStartIso) {
      if (!beforeWeek.has(s.account_id)) beforeWeek.set(s.account_id, v);
    } else {
      oldestThisWeek.set(s.account_id, v);
    }
  }
  const baseline = new Map<string, number>();
  for (const accountId of latest.keys()) {
    const b = beforeWeek.get(accountId) ?? oldestThisWeek.get(accountId);
    if (b !== undefined) baseline.set(accountId, b);
  }
  const weeklyByUser = new Map<string, number>();
  for (const [accountId, current] of latest) {
    const userId = userByAccount.get(accountId);
    if (!userId) continue;
    const delta = Math.max(0, current - (baseline.get(accountId) ?? current));
    weeklyByUser.set(userId, (weeklyByUser.get(userId) || 0) + delta);
  }

  const cacheByUser = new Map(
    ((cacheRows || []) as { user_id: string; total_solved: number; current_streak: number; best_platform: string }[]).map(
      (r) => [r.user_id, r]
    )
  );
  const usernameById = new Map(memberRows.map((m) => [m.user_id, m.users?.username || 'coder']));

  const memberStats: ClanMemberStats[] = memberRows
    .map((m) => {
      const cache = cacheByUser.get(m.user_id);
      return {
        userId: m.user_id,
        username: usernameById.get(m.user_id) || 'coder',
        role: m.role,
        joinedAt: m.joined_at,
        solvedThisWeek: weeklyByUser.get(m.user_id) || 0,
        totalSolved: cache?.total_solved || 0,
        currentStreak: cache?.current_streak || 0,
        bestPlatform: cache?.best_platform || 'Unrated',
      };
    })
    .sort((a, b) => b.solvedThisWeek - a.solvedThisWeek || b.totalSolved - a.totalSolved);

  // Activity feed: the group's most recent accepted solutions
  let activity: ClanActivityItem[] = [];
  if (accountIds.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from('submissions')
      .select('account_id, problem_id, title, difficulty, submitted_at')
      .in('account_id', accountIds)
      .eq('verdict', 'AC')
      .order('submitted_at', { ascending: false })
      .limit(20);
    activity = (subs || []).map((s) => {
      const platform = platformByAccount.get(s.account_id) || 'unknown';
      return {
        username: usernameById.get(userByAccount.get(s.account_id) || '') || 'coder',
        title: s.title,
        platform,
        difficulty: s.difficulty,
        submittedAt: s.submitted_at,
        url: problemUrl(platform, s.problem_id),
      };
    });
  }

  return {
    ...toSummary(clan as ClanRow, viewer.role, memberRows.length),
    ownerId: clan.owner_id,
    weekStart: weekStartIso,
    weekSolves: memberStats.reduce((sum, m) => sum + m.solvedThisWeek, 0),
    members: memberStats,
    activity,
  };
}
