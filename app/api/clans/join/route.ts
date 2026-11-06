import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { requireSessionUser } from '@/lib/auth';
import { MAX_CLANS_PER_USER, MAX_MEMBERS_PER_CLAN, isMissingTableError } from '@/lib/clans';

export async function POST(req: NextRequest) {
  const user = await requireSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'Log in to join a clan.' }, { status: 401 });

  let code = '';
  try {
    code = String((await req.json()).code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  } catch {
    // fallthrough to validation
  }
  if (code.length < 6) return NextResponse.json({ success: false, error: 'Enter a valid invite code.' }, { status: 400 });

  try {
    const { data: clan, error } = await supabaseAdmin.from('clans').select('id, name').eq('invite_code', code).maybeSingle();
    if (error) throw error;
    if (!clan) return NextResponse.json({ success: false, error: 'No clan found for that invite code.' }, { status: 404 });

    const [{ count: memberCount }, { count: myCount }, { data: existing }] = await Promise.all([
      supabaseAdmin.from('clan_members').select('user_id', { count: 'exact', head: true }).eq('clan_id', clan.id),
      supabaseAdmin.from('clan_members').select('clan_id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseAdmin.from('clan_members').select('user_id').eq('clan_id', clan.id).eq('user_id', user.id).maybeSingle(),
    ]);
    if (existing) return NextResponse.json({ success: true, clanId: clan.id, alreadyMember: true });
    if ((memberCount || 0) >= MAX_MEMBERS_PER_CLAN) {
      return NextResponse.json({ success: false, error: `${clan.name} is full (${MAX_MEMBERS_PER_CLAN} members).` }, { status: 400 });
    }
    if ((myCount || 0) >= MAX_CLANS_PER_USER) {
      return NextResponse.json({ success: false, error: `You can be in up to ${MAX_CLANS_PER_USER} clans.` }, { status: 400 });
    }

    const { error: joinErr } = await supabaseAdmin.from('clan_members').insert({ clan_id: clan.id, user_id: user.id, role: 'member' });
    if (joinErr && joinErr.code !== '23505') throw joinErr;
    return NextResponse.json({ success: true, clanId: clan.id });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ success: false, error: 'Clans are not set up yet.' }, { status: 503 });
    }
    console.error('[Clans] join failed', error);
    return NextResponse.json({ success: false, error: 'Could not join the clan' }, { status: 500 });
  }
}
