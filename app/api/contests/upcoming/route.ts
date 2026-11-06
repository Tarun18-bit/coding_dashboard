import { NextResponse } from 'next/server';
import { fetchUpcomingContests } from '@/lib/contests-calendar';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contests = await fetchUpcomingContests();
    return NextResponse.json(
      { success: true, count: contests.length, contests },
      {
        // Public, slow-changing data: let Vercel's CDN serve it for 10 minutes (and stale for an hour
        // while refreshing) instead of hitting three external APIs per visitor. Empty results aren't cached.
        headers:
          contests.length > 0
            ? { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
            : { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch upcoming contests' },
      { status: 500 }
    );
  }
}
