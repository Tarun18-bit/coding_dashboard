import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getDashboardStats } from '@/lib/aggregate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BadgeParams {
  params: Promise<{
    username: string;
  }>;
}

export async function GET(request: NextRequest, { params }: BadgeParams) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username).trim();

  let user: { id: string; username: string } | null = null;

  // 1. Resolve user ID from username
  const { data: userRecord } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .ilike('username', decodedUsername)
    .neq('username', 'default_user')
    .maybeSingle();

  if (userRecord) {
    user = userRecord;
  } else {
    // 2. Resolve user ID from linked platform handle
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('user_id')
      .ilike('handle', decodedUsername)
      .limit(1)
      .maybeSingle();

    if (account?.user_id) {
      const { data: u } = await supabaseAdmin
        .from('users')
        .select('id, username')
        .eq('id', account.user_id)
        .maybeSingle();
      if (u) {
        user = u;
      }
    }
  }

  // 3. Fallback to primary active user if not found
  if (!user) {
    const { data: firstUser } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .neq('username', 'default_user')
      .limit(1)
      .maybeSingle();
    user = firstUser || { id: '00000000-0000-0000-0000-000000000001', username: decodedUsername };
  }

  const targetUserId = user.id;
  const stats = await getDashboardStats(targetUserId);

  const displayName = user.username === 'default_user' ? decodedUsername : user.username;
  const totalSolved = stats.totalSolved || 0;
  const easy = stats.difficultyBreakdown.easy || 0;
  const medium = stats.difficultyBreakdown.medium || 0;
  const hard = stats.difficultyBreakdown.hard || 0;
  const streak = stats.streaks.currentStreak || 0;
  const maxStreak = stats.streaks.longestStreak || 0;

  // Highest rating among linked platforms
  let highestRating: number | string = 'Unrated';
  let bestPlatform = 'Multi-Platform';
  for (const acc of stats.accounts) {
    if (acc.latestSnapshot?.rating) {
      if (typeof highestRating === 'string' || acc.latestSnapshot.rating > highestRating) {
        highestRating = acc.latestSnapshot.rating;
        bestPlatform = acc.platform;
      }
    }
  }

  // Calculate percentage bar widths (out of 280px)
  const barWidth = 280;
  const safeTotal = totalSolved > 0 ? totalSolved : 1;
  const easyW = Math.round((easy / safeTotal) * barWidth);
  const medW = Math.round((medium / safeTotal) * barWidth);
  const hardW = Math.max(0, barWidth - easyW - medW);

  // DashDark SVG Template
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" width="520" height="220" fill="none">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="520" y2="220" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#081028" />
      <stop offset="50%" stop-color="#0B1739" />
      <stop offset="100%" stop-color="#0A1330" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0E43FB" />
      <stop offset="100%" stop-color="#00C2FF" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00C2FF" flood-opacity="0.35"/>
    </filter>
  </defs>

  <style>
    .title { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700; fill: #FFFFFF; font-size: 16px; }
    .subtitle { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; fill: #7E89AC; font-weight: 500; }
    .metric-label { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; fill: #AEB9E1; letter-spacing: 0.5px; }
    .metric-value { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 700; fill: #FFFFFF; }
    .metric-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: #7E89AC; }
    .tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; }
  </style>

  <!-- Outer Card with DashDark hairline border -->
  <rect x="1" y="1" width="518" height="218" rx="16" fill="url(#bgGradient)" stroke="#343B4F" stroke-width="1.2" />

  <!-- Brand / Header Section -->
  <g transform="translate(24, 20)">
    <!-- Terminal Icon Badge -->
    <rect x="0" y="0" width="32" height="32" rx="10" fill="url(#accentGradient)" filter="url(#glow)"/>
    <path d="M9 11L14 16L9 21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="16" y1="21" x2="23" y2="21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>

    <!-- User & Title -->
    <text x="44" y="16" class="title">${displayName}&apos;s Coding Stats</text>
    <text x="44" y="29" class="subtitle">Verified CP Portfolio • DashCode PRO</text>

    <!-- Verified Pill -->
    <g transform="translate(370, 4)">
      <rect x="0" y="0" width="94" height="22" rx="11" fill="rgba(20, 202, 116, 0.15)" stroke="rgba(20, 202, 116, 0.3)" stroke-width="1"/>
      <circle cx="12" cy="11" r="3.5" fill="#14CA74"/>
      <text x="22" y="14.5" class="tag" fill="#14CA74">VERIFIED</text>
    </g>
  </g>

  <!-- Divider -->
  <line x1="24" y1="68" x2="496" y2="68" stroke="rgba(126, 137, 172, 0.14)" stroke-width="1"/>

  <!-- Left Column: Total Solved & Difficulty Bar -->
  <g transform="translate(24, 82)">
    <text x="0" y="14" class="metric-label">Total Solved</text>
    <text x="0" y="44" class="metric-value">${totalSolved}</text>
    <text x="75" y="44" class="metric-sub">problems</text>

    <!-- Difficulty Segment Progress Bar -->
    <g transform="translate(0, 56)">
      <rect x="0" y="0" width="${barWidth}" height="8" rx="4" fill="#0A1330" stroke="rgba(126, 137, 172, 0.15)"/>
      <rect x="0" y="0" width="${easyW}" height="8" rx="4" fill="#14CA74"/>
      <rect x="${easyW}" y="0" width="${medW}" height="8" fill="#FDB52A"/>
      <rect x="${easyW + medW}" y="0" width="${hardW}" height="8" rx="4" fill="#FF5A65"/>
    </g>

    <!-- Difficulty Counts -->
    <g transform="translate(0, 80)">
      <circle cx="4" cy="4" r="3" fill="#14CA74"/>
      <text x="12" y="7" class="metric-sub" fill="#14CA74">Easy: ${easy}</text>

      <circle cx="95" cy="4" r="3" fill="#FDB52A"/>
      <text x="103" y="7" class="metric-sub" fill="#FDB52A">Med: ${medium}</text>

      <circle cx="190" cy="4" r="3" fill="#FF5A65"/>
      <text x="198" y="7" class="metric-sub" fill="#FF5A65">Hard: ${hard}</text>
    </g>
  </g>

  <!-- Vertical Divider -->
  <line x1="330" y1="80" x2="330" y2="195" stroke="rgba(126, 137, 172, 0.14)" stroke-width="1"/>

  <!-- Right Column: Streak & Best Rating -->
  <g transform="translate(350, 82)">
    <!-- Active Streak -->
    <text x="0" y="14" class="metric-label">Daily Streak</text>
    <text x="0" y="44" class="metric-value" fill="#FFB016">${streak}<tspan font-size="16" fill="#AEB9E1">d</tspan></text>
    <text x="55" y="44" class="metric-sub">max: ${maxStreak}d</text>

    <!-- Best Rating -->
    <text x="0" y="74" class="metric-label">Best Rating</text>
    <text x="0" y="104" class="metric-value" fill="#00C2FF">${highestRating}</text>
    <text x="80" y="104" class="metric-sub" fill="#7E89AC" text-transform="capitalize">${bestPlatform}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
    },
  });
}
