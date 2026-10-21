import { NextResponse } from 'next/server';
import { fetchUpcomingContests } from '@/lib/contests-calendar';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes cache

export async function GET() {
  try {
    const contests = await fetchUpcomingContests();
    return NextResponse.json({
      success: true,
      count: contests.length,
      contests,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch upcoming contests' },
      { status: 500 }
    );
  }
}
