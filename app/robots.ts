import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://coding-dashboard-two.vercel.app').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/reset-password', '/auth/', '/sentry-test'] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
