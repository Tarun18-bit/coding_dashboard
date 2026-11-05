import { NextRequest, NextResponse } from 'next/server';
import { codeforcesFetcher } from '@/lib/platforms/codeforces';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Failed to fetch Codeforces data';
}

export async function GET(req: NextRequest) {
  // Debug-only endpoint: never expose in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle') || process.env.DEFAULT_CODEFORCES_HANDLE || 'tourist';

  try {
    const [profile, contests, submissions] = await Promise.all([
      codeforcesFetcher.fetchProfile(handle),
      codeforcesFetcher.fetchContests(handle),
      codeforcesFetcher.fetchRecentSubmissions(handle, 10),
    ]);

    return NextResponse.json({
      success: true,
      handle,
      profile,
      contestCount: contests.length,
      latestContests: contests.slice(-5).reverse(),
      recentSubmissions: submissions,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
