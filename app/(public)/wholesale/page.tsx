import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbLd } from '@/lib/seo';

const title = 'wholesale · lollipop-shaped party supplements';
const description =
  'kiwi pop on your shelf. tiered pricing, low MOQ, festival-ready. apply and we email you back.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/wholesale' },
  openGraph: { title: `${title} · kiwi pop`, description, url: '/wholesale', type: 'website' },
  twitter: { card: 'summary_large_image', title: `${title} · kiwi pop`, description },
};

const breadcrumbLd = buildBreadcrumbLd([{ name: 'Wholesale', url: '/wholesale' }]);

export default function WholesaleLandingPage(): JSX.Element {
  return (
    <div className="page-container">
      <JsonLd data={breadcrumbLd} />
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // wholesale
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.04em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '1rem',
        }}
      >
        kiwi pop on your shelf.
      </h1>
      <p
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--bone)',
          maxWidth: 760,
          marginBottom: '2.5rem',
        }}
      >
        boutiques, late-night bars, festival vendors, gift shops. apply with
        your business details and we get back fast. tiered pricing scales
        with your order size. no minimums for the first conversation.
      </p>

      <div
        className="card"
        style={{
          padding: '2rem',
          background: 'var(--midnight)',
          borderColor: 'var(--lime)',
        }}
      >
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // tiered wholesale pricing
        </p>
        <p
          style={{
            color: 'var(--bone)',
            fontFamily: 'var(--mono)',
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: 640,
          }}
        >
          per-pop pricing scales with order size. we send the full line sheet —
          flavors, MSRP, and your tier rates — once you apply, so we can match
          it to your channel.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginTop: '1.25rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--lime)',
              border: '1px solid var(--lime)',
              borderRadius: 999,
              padding: '0.5rem 1rem',
            }}
          >
            standard · 50+ units
          </span>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--cyan)',
              border: '1px solid var(--cyan)',
              borderRadius: 999,
              padding: '0.5rem 1rem',
            }}
          >
            premium · 200+ units
          </span>
        </div>
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.05em',
            color: 'var(--bone)',
            opacity: 0.85,
          }}
        >
          // mix and match flavors against the same tier.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <p className="stat-label" style={{ marginBottom: '1rem' }}>
          // how it works
        </p>
        <ol className="wholesale-steps">
          <li>
            <span className="wholesale-step-num">01</span>
            <div>
              <strong>apply</strong>: business name, contact, channel, expected
              volume. takes 90 seconds.
            </div>
          </li>
          <li>
            <span className="wholesale-step-num">02</span>
            <div>
              <strong>review</strong>: we batch-review applications. typical
              turnaround is 2 business days. expect an email either way.
            </div>
          </li>
          <li>
            <span className="wholesale-step-num">03</span>
            <div>
              <strong>place an order</strong>: once approved you can order
              full cases at tier pricing. we confirm stock and ship from salt
              lake.
            </div>
          </li>
          <li>
            <span className="wholesale-step-num">04</span>
            <div>
              <strong>ongoing</strong>: reorder via{' '}
              <code>thekiwipop@gmail.com</code>. festival drops get a heads-up
              before public.
            </div>
          </li>
        </ol>
      </div>

      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/wholesale/apply" className="btn btn-primary">
          apply now →
        </Link>
        <Link href="/wholesale/account" className="btn">
          check application status
        </Link>
        <a className="btn btn-secondary" href="mailto:thekiwipop@gmail.com">
          questions · email us
        </a>
      </div>

      <Link
        href="/wholesale/barcelona"
        style={{
          marginTop: '2rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.4rem',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          color: 'var(--paper)',
          background: 'transparent',
          border: '1px solid var(--magenta)',
          borderRadius: 999,
          width: 'fit-content',
        }}
      >
        <span aria-hidden="true" style={{ color: 'var(--magenta)' }}>
          ◆
        </span>
        EU / Spain · UE / España →
      </Link>
      <p
        style={{
          marginTop: '0.5rem',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.05em',
          color: 'var(--bone)',
          opacity: 0.7,
        }}
      >
        // dedicated mayorista program for Barcelona &amp; EU venues
      </p>
    </div>
  );
}
