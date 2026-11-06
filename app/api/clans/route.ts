import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { requireSessionUser } from '@/lib/auth';
import {
  CLAN_CATEGORIES,
  MAX_CLANS_PER_USER,
  generateInviteCode,
  isMissingTableError,
  listUserClans,
} from '@/lib/clans';

const SETUP_ERROR = 'Clans are not set up yet: run supabase/migrations/002_clans_profiles.sql in Supabase.';

export async function GET() {
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in to see your clans.' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, clans: await listUserClans(user.id) });
  } catch (error) {
    if (isMissingTableError(error)) return NextResponse.json({ success: false, error: SETUP_ERROR }, { status: 503 });
    console.error('[Clans] list failed', error);
    return NextResponse.json({ success: false, error: 'Could not load clans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in to create a clan.' }, { status: 401 });

  let body: { name?: string; tagline?: string; avatar?: string; category?: string; weeklyTarget?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const name = (body.name || '').trim().slice(0, 40);
  if (name.length < 2) return NextResponse.json({ success: false, error: 'Clan name must be at least 2 characters.' }, { status: 400 });
  const tagline = (body.tagline || '').trim().slice(0, 120);
  const avatar = Array.from((body.avatar || '🔥').trim()).slice(0, 2).join('') || '🔥';
  const category = (CLAN_CATEGORIES as readonly string[]).includes(body.category || '') ? body.category! : 'Casual';
  const weeklyTarget = Math.max(1, Math.min(10_000, Math.round(Number(body.weeklyTarget) || 50)));

  try {
    const { count } = await supabaseAdmin
      .from('clans')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id);
    if ((count || 0) >= MAX_CLANS_PER_USER) {
      return NextResponse.json({ success: false, error: `You can own up to ${MAX_CLANS_PER_USER} clans.` }, { status: 400 });
    }

    // Retry on the (very unlikely) invite-code collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: clan, error } = await supabaseAdmin
        .from('clans')
        .insert({ name, tagline, avatar, category, weekly_target: weeklyTarget, invite_code: generateInviteCode(), owner_id: user.id })
        .select('id')
        .single();
      if (error) {
        if (error.code === '23505') continue;
        throw error;
      }
      const { error: memberErr } = await supabaseAdmin
        .from('clan_members')
        .insert({ clan_id: clan.id, user_id: user.id, role: 'leader' });
      if (memberErr) {
        await supabaseAdmin.from('clans').delete().eq('id', clan.id);
        throw memberErr;
      }
      return NextResponse.json({ success: true, clanId: clan.id });
    }
    return NextResponse.json({ success: false, error: 'Please try again.' }, { status: 500 });
  } catch (error) {
    if (isMissingTableError(error)) return NextResponse.json({ success: false, error: SETUP_ERROR }, { status: 503 });
    console.error('[Clans] create failed', error);
    return NextResponse.json({ success: false, error: 'Could not create the clan' }, { status: 500 });
  }
}
