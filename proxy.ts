import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Pages Supabase email links can land on (sign-up confirmation redirects to /dashboard, and to
// the Site URL when that path isn't allow-listed)
const AUTH_LANDING_PATHS = new Set(['/', '/dashboard', '/login']);

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (AUTH_LANDING_PATHS.has(pathname)) {
    // PKCE email links arrive as ?code=…: hand them to the callback that turns them into a session
    const code = searchParams.get('code');
    if (code && /^[A-Za-z0-9-]{8,200}$/.test(code)) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/callback';
      url.search = '';
      url.searchParams.set('code', code);
      url.searchParams.set('next', '/dashboard');
      return NextResponse.redirect(url);
    }
    // Expired or already-used links arrive as ?error_description=…: explain on the sign-in page
    const linkError = searchParams.get('error_description') || searchParams.get('error');
    if (linkError && pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('error', linkError.slice(0, 200));
      return NextResponse.redirect(url);
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token if expired (safely caught in case of network/offline issues)
  try {
    await supabase.auth.getUser();
  } catch {
    // Ignore network or connection error in middleware
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|sentry-tunnel|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
