import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db';
import { ensurePublicUser } from '@/lib/users';

export interface SessionUser {
  id: string;
  email: string | null;
  username: string;
}

/** The logged-in user (from the Supabase session cookie), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;
    // The public username lives in the database (it can differ from the email prefix when that
    // name was already taken), so profile links and "you" markers must use it.
    let dbUsername: string | null = null;
    try {
      const { data: row } = await supabaseAdmin.from('users').select('username').eq('id', user.id).maybeSingle();
      dbUsername = row?.username ?? null;
    } catch {
      // fall back to the session values below
    }
    return {
      id: user.id,
      email: user.email ?? null,
      username: dbUsername || user.user_metadata?.user_name || user.email?.split('@')[0] || 'coder',
    };
  } catch {
    return null;
  }
}

/** Like getSessionUser, but also guarantees a row in public.users (needed for foreign keys). */
export async function requireSessionUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const row = await ensurePublicUser(user.id, user.username);
  return { ...user, username: row.username };
}
