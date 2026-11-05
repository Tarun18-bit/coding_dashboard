import { NextRequest, NextResponse } from 'next/server';
import { leetcodeFetcher } from '@/lib/platforms/leetcode';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Failed to fetch LeetCode data';
}

export async function GET(req: NextRequest) {
  // Debug-only endpoint: never expose in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') || process.env.DEFAULT_LEETCODE_USERNAME || 'txrun_18';

  try {
    const [profile, contests, submissions] = await Promise.all([
      leetcodeFetcher.fetchProfile(username),
      leetcodeFetcher.fetchContests(username),
      leetcodeFetcher.fetchRecentSubmissions(username, 10),
    ]);

    return NextResponse.json({
      success: true,
      username,
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
