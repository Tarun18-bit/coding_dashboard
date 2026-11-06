import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ensurePublicUser } from '@/lib/users';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  // Only allow same-site relative paths ("/x"), never "//host" or "@host" style open redirects
  const requestedNext = searchParams.get('next');
  const safeNext = requestedNext && /^\/(?!\/)[^\\@]*$/.test(requestedNext) ? requestedNext : null;
  const next = safeNext ?? (type === 'recovery' ? '/reset-password' : '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user record exists in users table safely
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const username = user.user_metadata?.user_name || user.email?.split('@')[0] || user.id;
        await ensurePublicUser(user.id, username);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If next is /reset-password, forward cleanly without error so client hash fragment can authenticate
  if (next === '/reset-password' || type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
