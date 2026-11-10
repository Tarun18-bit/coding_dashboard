import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from './sentry.shared';

Sentry.init({
  ...sentryOptions,
  // Noise from browser extensions and flaky networks, not bugs in DashCode
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications', 'Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource'],
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
});

// App Router navigation tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
