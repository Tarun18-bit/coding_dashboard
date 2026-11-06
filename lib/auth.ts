import { createClient } from '@/lib/supabase/server';
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
    return {
      id: user.id,
      email: user.email ?? null,
      username: user.user_metadata?.user_name || user.email?.split('@')[0] || 'coder',
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
