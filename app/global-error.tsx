'use client';

// Last-resort boundary for errors in the root layout itself (normal page errors use app/error.tsx)
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090D1A', color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>DashCode hit an unexpected error. Please reload the page.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 20, background: '#00EA64', color: '#090D1A', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 12, textDecoration: 'none' }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
