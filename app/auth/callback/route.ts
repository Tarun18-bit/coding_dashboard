import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user record exists in users table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const username = user.user_metadata?.user_name || user.email?.split('@')[0] || user.id;
        await supabase.from('users').upsert({ id: user.id, username }, { onConflict: 'id' });
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
