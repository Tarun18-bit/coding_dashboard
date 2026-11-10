import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://coding-dashboard-two.vercel.app').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/leaderboard', '/sheets', '/mock-interview', '/reviewer', '/compare', '/clans', '/login', '/privacy', '/terms'];
  return pages.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: path === '/leaderboard' ? 'hourly' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));
}
