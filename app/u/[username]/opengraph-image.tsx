import { ImageResponse } from 'next/og';
import { supabaseAdmin, escapeLike } from '@/lib/db';
import { getDashboardStats } from '@/lib/aggregate';

// Link preview card for a shared profile: their real numbers, so the post sells itself
export const alt = 'Coding profile on DashCode';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PLATFORM_LABEL: Record<string, string> = { leetcode: 'LeetCode', codeforces: 'Codeforces', codechef: 'CodeChef' };

async function findUser(name: string): Promise<{ id: string; username: string } | null> {
  const { data: byName } = await supabaseAdmin.from('users').select('id, username').ilike('username', escapeLike(name)).maybeSingle();
  if (byName) return byName;
  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('users(id, username)')
    .ilike('handle', escapeLike(name))
    .limit(1)
    .maybeSingle();
  const u = account?.users as unknown as { id: string; username: string } | null | undefined;
  return u ? { id: u.id, username: u.username } : null;
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '26px 30px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.04)',
        border: '2px solid rgba(126,137,172,0.22)',
      }}
    >
      <div style={{ display: 'flex', fontSize: 24, color: '#94A3B8' }}>{label}</div>
      <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const name = decodeURIComponent(username).trim().slice(0, 40);
  const user = await findUser(name).catch(() => null);
  const stats = user ? await getDashboardStats(user.id).catch(() => null) : null;

  const handle = user?.username || name;
  const platforms = stats?.accounts.map((a) => PLATFORM_LABEL[a.platform] || a.platform) ?? [];
  const bestRating = stats?.accounts.reduce<number | null>((best, a) => {
    const r = a.latestSnapshot?.maxRating ?? a.latestSnapshot?.rating ?? null;
    return r && (!best || r > best) ? r : best;
  }, null);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          background: 'linear-gradient(135deg, #090D1A 0%, #0B1739 60%, #1A1240 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>@{handle}</div>
            <div style={{ display: 'flex', fontSize: 28, color: '#AEB9E1', marginTop: 6 }}>
              {platforms.length ? `Coding progress across ${platforms.join(' · ')}` : 'Coding profile on DashCode'}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: 22,
              background: '#00EA64',
              color: '#090D1A',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            {'>_'}
          </div>
        </div>

        {stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <Tile label="Problems solved" value={String(stats.totalSolved)} color="#00EA64" />
              <Tile label="Best streak" value={`${stats.streaks.longestStreak}d`} color="#FFB016" />
              <Tile label="Best rating" value={bestRating ? String(bestRating) : 'Unrated'} color="#00C2FF" />
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Tile label="Easy" value={String(stats.difficultyBreakdown.easy)} color="#14CA74" />
              <Tile label="Medium" value={String(stats.difficultyBreakdown.medium)} color="#FDB52A" />
              <Tile label="Hard" value={String(stats.difficultyBreakdown.hard)} color="#FF5A65" />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 40, color: '#AEB9E1' }}>Track LeetCode, Codeforces and CodeChef in one place.</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: '#7E89AC' }}>
          <div style={{ display: 'flex' }}>DashCode · free coding dashboard</div>
          <div style={{ display: 'flex' }}>Build yours: AI coach · mock interviews</div>
        </div>
      </div>
    ),
    size
  );
}
