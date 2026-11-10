/** Shared Sentry settings for the browser, server and edge runtimes. */
// The DSN is not a secret (it ships in the browser bundle). NEXT_PUBLIC_SENTRY_DSN can override it.
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://da569564d32a692ef00de21081b2aaeb@o4512407670423552.ingest.us.sentry.io/4512407766958080';

export const sentryOptions = {
  dsn: SENTRY_DSN,
  // Only report from real deployments, not from `npm run dev` on your machine
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  // 10% of requests get performance traces: plenty of signal, well inside the free quota
  tracesSampleRate: 0.1,
  // Don't attach IP addresses, cookies or headers to events (matches the privacy policy)
  sendDefaultPii: false,
};
