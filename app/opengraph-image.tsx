import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'kiwi pop, lollipop shaped party supplements';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default Open Graph image for the site. Branded card rendered at request
 * time by next/og — Twitter / iMessage / Discord / Slack pull this when
 * /og-image.png is missing. No external assets needed.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'linear-gradient(135deg, #050510 0%, #0a0014 45%, #1a0a2a 100%)',
          color: '#f4ecff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            color: '#a8ff3c',
            fontSize: 28,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: '#a8ff3c',
              boxShadow: '0 0 24px #a8ff3c',
            }}
          />
          KIWI POP
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#f4ecff',
              textTransform: 'lowercase',
            }}
          >
            lollipop shaped
            <br />
            <span style={{ color: '#a8ff3c' }}>party supplements.</span>
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#a89dc5',
              letterSpacing: '0.06em',
            }}
          >
            jambu · theobromine · magnesium · taurine · b12 · electrolytes · adaptogen per flavor
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#7a7191',
            fontSize: 22,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span>&lt;1g sugar · ~35 cal · vegan</span>
          <span>kiwipop.fun</span>
        </div>
      </div>
    ),
    size,
  );
}
