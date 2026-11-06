import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { requireSessionUser } from '@/lib/auth';
import { generateInviteCode, getClanDetail, isMissingTableError } from '@/lib/clans';

type Ctx = { params: Promise<{ id: string }> };
const UUID_RE = /^[0-9a-f-]{36}$/i;

async function membership(clanId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('clan_members')
    .select('role, clans(owner_id)')
    .eq('clan_id', clanId)
    .eq('user_id', userId)
    .maybeSingle();
  return data as { role: string; clans: { owner_id: string } | null } | null;
}

function failure(error: unknown, action: string) {
  if (isMissingTableError(error)) return NextResponse.json({ success: false, error: 'Clans are not set up yet.' }, { status: 503 });
  console.error(`[Clans] ${action} failed`, error);
  return NextResponse.json({ success: false, error: `Could not ${action}` }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in to view this clan.' }, { status: 401 });
  if (!UUID_RE.test(id)) return NextResponse.json({ success: false, error: 'Clan not found' }, { status: 404 });
  try {
    const clan = await getClanDetail(id, user.id);
    if (!clan) return NextResponse.json({ success: false, error: 'Clan not found or you are not a member.' }, { status: 404 });
    return NextResponse.json({ success: true, clan });
  } catch (error) {
    return failure(error, 'load the clan');
  }
}

/** Leader-only settings: tagline, avatar, weekly target, new invite code, remove a member */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in first.' }, { status: 401 });
  if (!UUID_RE.test(id)) return NextResponse.json({ success: false, error: 'Clan not found' }, { status: 404 });

  let body: { tagline?: string; avatar?: string; weeklyTarget?: number; regenerateInvite?: boolean; removeUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const m = await membership(id, user.id);
    if (!m || m.clans?.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Only the clan leader can change settings.' }, { status: 403 });
    }

    if (body.removeUserId) {
      if (body.removeUserId === user.id) {
        return NextResponse.json({ success: false, error: 'The leader cannot remove themselves. Delete the clan instead.' }, { status: 400 });
      }
      const { error } = await supabaseAdmin.from('clan_members').delete().eq('clan_id', id).eq('user_id', body.removeUserId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const update: Record<string, unknown> = {};
    if (typeof body.tagline === 'string') update.tagline = body.tagline.trim().slice(0, 120);
    if (typeof body.avatar === 'string' && body.avatar.trim()) update.avatar = Array.from(body.avatar.trim()).slice(0, 2).join('');
    if (body.weeklyTarget !== undefined) update.weekly_target = Math.max(1, Math.min(10_000, Math.round(Number(body.weeklyTarget) || 50)));
    if (body.regenerateInvite) update.invite_code = generateInviteCode();
    if (Object.keys(update).length === 0) return NextResponse.json({ success: true });

    const { error } = await supabaseAdmin.from('clans').update(update).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return failure(error, 'update the clan');
  }
}

/** ?action=leave (members) or ?action=delete (leader) */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const action = new URL(req.url).searchParams.get('action');
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in first.' }, { status: 401 });
  if (!UUID_RE.test(id)) return NextResponse.json({ success: false, error: 'Clan not found' }, { status: 404 });

  try {
    const m = await membership(id, user.id);
    if (!m) return NextResponse.json({ success: false, error: 'You are not in this clan.' }, { status: 404 });
    const isOwner = m.clans?.owner_id === user.id;

    if (action === 'delete') {
      if (!isOwner) return NextResponse.json({ success: false, error: 'Only the leader can delete the clan.' }, { status: 403 });
      const { error } = await supabaseAdmin.from('clans').delete().eq('id', id); // members cascade
      if (error) throw error;
      return NextResponse.json({ success: true, deleted: true });
    }

    if (action === 'leave') {
      if (isOwner) {
        // Hand leadership to the longest-standing member, or delete an otherwise empty clan
        const { data: next } = await supabaseAdmin
          .from('clan_members')
          .select('user_id')
          .eq('clan_id', id)
          .neq('user_id', user.id)
          .order('joined_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!next) {
          const { error } = await supabaseAdmin.from('clans').delete().eq('id', id);
          if (error) throw error;
          return NextResponse.json({ success: true, deleted: true });
        }
        await supabaseAdmin.from('clans').update({ owner_id: next.user_id }).eq('id', id);
        await supabaseAdmin.from('clan_members').update({ role: 'leader' }).eq('clan_id', id).eq('user_id', next.user_id);
      }
      const { error } = await supabaseAdmin.from('clan_members').delete().eq('clan_id', id).eq('user_id', user.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return failure(error, 'update membership');
  }
}
