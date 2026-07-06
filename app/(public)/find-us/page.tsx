import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbLd } from '@/lib/seo';
import { FindUsMap } from '@/components/map/FindUsMap';

const title = 'find us · events + retail';
const description =
  'where to find kiwi pop irl. festivals, retail, dms. ships domestic first from salt lake city, utah.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/find-us' },
  openGraph: { title: `${title} · kiwi pop`, description, url: '/find-us', type: 'website' },
  twitter: { card: 'summary_large_image', title: `${title} · kiwi pop`, description },
};

const breadcrumbLd = buildBreadcrumbLd([{ name: 'Find Us', url: '/find-us' }]);

const SOCIAL = [
  { handle: '@the.kiwi.pop', label: 'instagram', url: 'https://instagram.com/the.kiwi.pop' },
  { handle: '@thekiwipop', label: 'tiktok', url: 'https://www.tiktok.com/@thekiwipop' },
];

export default function FindUsPage() {
  return (
    <div className="page-container">
      <JsonLd data={breadcrumbLd} />
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // find us
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
        find us irl.
      </h1>

      <div className="card" style={{ padding: '1.5rem 1.5rem 2rem' }}>
        <p className="stat-label" style={{ marginBottom: '0.4rem' }}>
          // live map · find a pop near you
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
          colorful stars = where to find kiwi pop. pulsing stars are live right now, a booth or a
          roving rep broadcasting their spot. tap a star for details.
        </p>
        <FindUsMap />
      </div>

      <pre className="terminal-block">
{`kiwi pop // signal status
─────────────────────────────────
> dtc:           live · drops 001 · kiwi pop
> retail:        coming soon
> map:           live spots + roving reps
> next ship:     check the list
─────────────────────────────────
end of transmission_`}
      </pre>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '0.8rem' }}>
          // the map · where the community buys
        </p>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--bone)',
            opacity: 0.7,
            marginBottom: '1.25rem',
          }}
        >
          // a living map of every metro kiwi pop has shipped to. watch the
          stars light up as the community grows.
        </p>
        <Link href="/community" className="btn btn-primary">
          see the map →
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '0.8rem' }}>
          // retail · stock kiwi pop
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
          // own a shop? want pops on your counter? hit{' '}
          <a
            href="mailto:thekiwipop@gmail.com"
            style={{ color: 'var(--lime)' }}
          >
            thekiwipop@gmail.com
          </a>
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // social · stay close
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target={s.url.startsWith('http') ? '_blank' : undefined}
              rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                padding: '1rem',
                border: '1px solid rgba(244,240,232,0.15)',
                fontFamily: 'var(--mono)',
                display: 'block',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              className="social-card"
            >
              <div className="contact-label">{s.label}</div>
              <div
                style={{
                  fontFamily: 'var(--display)',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--lime)',
                  marginTop: '0.4rem',
                }}
              >
                {s.handle}
              </div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/#list" className="btn btn-primary">
          get on the list
        </Link>
        <Link href="/" className="btn">
          back to dawn
        </Link>
      </div>
    </div>
  );
}
