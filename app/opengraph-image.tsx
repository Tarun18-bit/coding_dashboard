import { ImageResponse } from 'next/og';

// Link preview card for LinkedIn, X, WhatsApp, Slack... (1200x630 is what they all expect)
export const alt = 'DashCode: one dashboard for your LeetCode, Codeforces and CodeChef progress, with an AI coach and mock interviews';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CHIPS = ['LeetCode · Codeforces · CodeChef', 'AI Coach', 'Timed mock interviews', 'AI code review'];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #090D1A 0%, #0B1739 55%, #0E2A22 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#00EA64',
              color: '#090D1A',
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            {'>_'}
          </div>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>DashCode</div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>Unify your coding stats.</div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: '#00EA64' }}>
            Find your weak spots.
          </div>
          <div style={{ display: 'flex', marginTop: 18, fontSize: 30, color: '#AEB9E1' }}>
            Free dashboard for competitive programmers and interview prep.
          </div>
        </div>

        {/* Features + URL */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  display: 'flex',
                  padding: '12px 20px',
                  borderRadius: 999,
                  border: '2px solid rgba(0,234,100,0.35)',
                  background: 'rgba(0,234,100,0.08)',
                  fontSize: 22,
                  color: '#D1DBF9',
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
