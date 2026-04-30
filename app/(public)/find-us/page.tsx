import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'find us · events + retail',
  description:
    'where to find kiwi pop irl. festivals, retail, dms. ships domestic first.',
};

interface EventRow {
  date: string;
  name: string;
  city: string;
  status: 'tba' | 'negotiation' | 'confirmed';
}

const EVENTS: EventRow[] = [
  {
    date: '2026.07',
    name: 'beyond wonderland',
    city: 'san bernardino, ca',
    status: 'negotiation',
  },
  { date: '2026.04', name: 'coachella · w2', city: 'indio, ca', status: 'tba' },
  {
    date: '2026.06',
    name: 'electric daisy carnival',
    city: 'las vegas, nv',
    status: 'tba',
  },
  {
    date: '2026.08',
    name: 'lightning in a bottle',
    city: 'central coast, ca',
    status: 'tba',
  },
];

interface RetailRow {
  city: string;
  spot: string;
}

const RETAIL: RetailRow[] = [
  { city: 'los angeles, ca', spot: 'tbd · in conversation' },
  { city: 'brooklyn, ny', spot: 'tbd · in conversation' },
  { city: 'austin, tx', spot: 'tbd · in conversation' },
  { city: 'miami, fl', spot: 'tbd · in conversation' },
  { city: 'chicago, il', spot: 'tbd · in conversation' },
  { city: 'portland, or', spot: 'tbd · in conversation' },
];

const SOCIAL = [
  { handle: '@kiwipop', label: 'instagram', url: 'https://instagram.com/kiwipop' },
  { handle: '@kiwipop', label: 'tiktok', url: 'https://tiktok.com/@kiwipop' },
  { handle: '@kiwipop', label: 'discord', url: '#' },
  { handle: 'kiwipop.co', label: 'newsletter', url: '/#list' },
];

const STATUS_COLOR: Record<EventRow['status'], string> = {
  confirmed: 'var(--lime)',
  negotiation: 'var(--sodium)',
  tba: 'var(--bone)',
};

export default function FindUsPage() {
  return (
    <div className="page-container">
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

      <pre className="terminal-block">
{`kiwi pop // signal status
─────────────────────────────────
> retail:        soft launch
> festivals:     in negotiation
> dtc:           drops 001 — kiwi kitty
> intl:          waitlist only · vienna · melbourne · london
> next ship:     tbd · check the list
─────────────────────────────────
end of transmission_`}
      </pre>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // events · festival calendar
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>date</th>
              <th>event</th>
              <th>city</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e) => (
              <tr key={`${e.date}-${e.name}`}>
                <td className="font-mono">{e.date}</td>
                <td>{e.name}</td>
                <td>{e.city}</td>
                <td style={{ color: STATUS_COLOR[e.status] }}>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p
          style={{
            marginTop: '1rem',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--bone)',
            opacity: 0.7,
          }}
        >
          // following the ghost playbook · one limited-edition flavor drop
          per major festival, with collectible packaging
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1.2rem' }}>
          // retail · find a pop
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {RETAIL.map((r) => (
            <div
              key={r.city}
              style={{
                padding: '0.85rem 1rem',
                border: '1px solid rgba(244,240,232,0.1)',
                fontFamily: 'var(--mono)',
                fontSize: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                {r.city}
              </div>
              <div style={{ color: 'var(--bone)', marginTop: '0.4rem' }}>
                {r.spot}
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            marginTop: '1rem',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--bone)',
            opacity: 0.7,
          }}
        >
          // own a shop? want pops on your counter? hit{' '}
          <a
            href="mailto:wholesale@kiwipop.co"
            style={{ color: 'var(--lime)' }}
          >
            wholesale@kiwipop.co
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
