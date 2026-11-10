import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { clearStatsCache } from '@/lib/aggregate';

/**
 * Permanently deletes the logged-in user's account and data.
 * Body: { confirm: "<username>" } must match the public username.
 * Deleting the public.users row cascades to accounts, snapshots, submissions, contests,
 * clan memberships, leaderboard entry and usage counters. Clans the user leads are handed to
 * the longest-standing member (or deleted if the user was the only member).
 */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in first.' }, { status: 401 });

  let confirm = '';
  try {
    confirm = String((await req.json()).confirm || '').trim();
  } catch {
    // validated below
  }

  const { data: row } = await supabaseAdmin.from('users').select('username').eq('id', user.id).maybeSingle();
  const username = row?.username || user.username;
  if (confirm.toLowerCase() !== username.toLowerCase()) {
    return NextResponse.json({ success: false, error: `Type your username (${username}) exactly to confirm.` }, { status: 400 });
  }

  try {
    // Hand over clans this user leads (ignored if the clans tables don't exist)
    const { data: owned } = await supabaseAdmin.from('clans').select('id').eq('owner_id', user.id);
    for (const clan of owned || []) {
      const { data: next } = await supabaseAdmin
        .from('clan_members')
        .select('user_id')
        .eq('clan_id', clan.id)
        .neq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next) {
        await supabaseAdmin.from('clans').update({ owner_id: next.user_id }).eq('id', clan.id);
        await supabaseAdmin.from('clan_members').update({ role: 'leader' }).eq('clan_id', clan.id).eq('user_id', next.user_id);
      } else {
        await supabaseAdmin.from('clans').delete().eq('id', clan.id);
      }
    }

    const { error: dataErr } = await supabaseAdmin.from('users').delete().eq('id', user.id);
    if (dataErr) throw dataErr;

    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authErr) throw authErr;

    clearStatsCache(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Account] delete failed', error);
    return NextResponse.json({ success: false, error: 'Could not delete the account. Please try again.' }, { status: 500 });
  }
}
