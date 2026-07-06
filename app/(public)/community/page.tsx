import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbLd } from '@/lib/seo';
import { OrderMap } from '@/components/map/OrderMap';

const title = 'the map · where kiwi pop lands';
const description =
  'a living map of every place kiwi pop ships to. watch the dots light up as the community grows, metro by metro.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/community' },
  openGraph: { title: `${title} · kiwi pop`, description, url: '/community', type: 'website' },
  twitter: { card: 'summary_large_image', title: `${title} · kiwi pop`, description },
};

const breadcrumbLd = buildBreadcrumbLd([{ name: 'The Map', url: '/community' }]);

export default function CommunityPage() {
  return (
    <div className="page-container">
      <JsonLd data={breadcrumbLd} />
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // the map
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '2rem',
        }}
      >
        where kiwi pop lands.
      </h1>

      <div className="card" style={{ padding: '1.5rem 1.5rem 2rem' }}>
        <p className="stat-label" style={{ marginBottom: '0.4rem' }}>
          // live map · every place a pop has gone
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--bone)',
            opacity: 0.8,
            marginBottom: '1rem',
            fontFamily: 'var(--mono)',
          }}
        >
          each star is a metro where someone ordered kiwi pop. bigger + warmer
          stars = more pops shipped there. tap a star for the count. dots are
          grouped by region — no addresses, no names, just the shape of the
          community.
        </p>
        <OrderMap />
      </div>

      <pre className="terminal-block">
{`kiwi pop // demand signal
─────────────────────────────────
> map:           live · orders by metro
> granularity:   regional · privacy-safe
> heat:          lime → cyan → gold → pink → red
> refresh:       auto · every 60s
─────────────────────────────────
end of transmission_`}
      </pre>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '0.8rem' }}>
          // put your city on the map
        </p>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--bone)',
            opacity: 0.7,
          }}
        >
          // don't see your metro lit up yet? grab a drop and start a new star.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/#drop" className="btn btn-primary">
            shop the drop
          </Link>
          <Link href="/find-us" className="btn">
            find us irl
          </Link>
        </div>
      </div>
    </div>
  );
}
