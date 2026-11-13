import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);

  // Only our own pages may sign someone out (blocks cross-site "log out" form posts)
  const from = request.headers.get('origin');
  if (from && from !== origin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303: the browser follows a POST redirect with a GET
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
