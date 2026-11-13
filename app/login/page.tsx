import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AuthForm, type AuthMode } from '@/components/AuthForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in or create your free DashCode account.',
};

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ mode?: string; next?: string; error?: string; type?: string }>;
}

/** Only same-site paths ("/x"), never "//host" or "@host" style open redirects. */
function safeNext(value?: string): string {
  return value && /^\/(?!\/)[^\\@]*$/.test(value) ? value : '/dashboard';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const isRecovery = params.mode === 'reset' || params.type === 'recovery';

  // Already signed in: go straight to where they were heading
  if (!isRecovery) {
    const user = await getSessionUser();
    if (user) redirect(next);
  }

  const initialMode: AuthMode =
    params.mode === 'signup' || params.mode === 'register' ? 'signup' : params.mode === 'forgot' ? 'forgot' : 'signin';

  // Errors handed over by the auth callback or an expired email link
  const initialError = params.error
    ? /expired|invalid|could not authenticate|access_denied|otp/i.test(params.error)
      ? 'That link is invalid or has expired. If you just confirmed your email, sign in below.'
      : params.error.slice(0, 200)
    : '';

  return <AuthForm initialMode={initialMode} next={next} initialError={initialError} />;
}
