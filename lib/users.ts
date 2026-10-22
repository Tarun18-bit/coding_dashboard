import { supabaseAdmin } from './db';

/**
 * Ensures a user exists in the public `users` table without failing on duplicate username constraints.
 */
export async function ensurePublicUser(
  userId: string,
  preferredUsername?: string | null
): Promise<{ id: string; username: string }> {
  try {
    // 1. Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // 2. Clean candidate username
    const base = (preferredUsername || 'coder')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '') || 'coder';

    // 3. Check if base username is already taken by a different user
    const { data: taken } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', base)
      .maybeSingle();

    let finalUsername = base;
    if (taken && taken.id !== userId) {
      const shortId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'user';
      finalUsername = `${base}_${shortId}`;
    }

    // 4. Upsert user
    const { data: inserted, error } = await supabaseAdmin
      .from('users')
      .upsert({ id: userId, username: finalUsername }, { onConflict: 'id' })
      .select('id, username')
      .maybeSingle();

    if (error) {
      // Fallback with unique timestamp if still in conflict
      const fallback = `coder_${Date.now().toString(36)}`;
      const { data: fallbackUser } = await supabaseAdmin
        .from('users')
        .upsert({ id: userId, username: fallback }, { onConflict: 'id' })
        .select('id, username')
        .maybeSingle();

      return fallbackUser || { id: userId, username: fallback };
    }

    return inserted || { id: userId, username: finalUsername };
  } catch (error) {
    console.error('[ensurePublicUser] Failed to ensure user in public.users:', error);
    return { id: userId, username: preferredUsername || 'user' };
  }
}
