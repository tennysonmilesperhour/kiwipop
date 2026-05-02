import type { Metadata } from 'next';
import Link from 'next/link';
import { InquiryForm } from '@/components/wholesale/InquiryForm';

export const metadata: Metadata = {
  title: 'wholesale · contact us',
  description:
    "kiwi pop is building out the b2b side. tell us what you're looking to order, where you are, and a bit about your business. we'll email back with the catalogue.",
};

export const dynamic = 'force-dynamic';

export default function WholesaleContactPage() {
  return (
    <div className="kp-page" style={{ minHeight: '100vh' }}>
      <section className="z2" style={{ display: 'block', padding: '80px 40px 120px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <span className="lab">wholesale · b2b</span>
          <h2>
            STOCK
            <br />
            <span className="pk">KIWI POP.</span>
          </h2>

          <p className="lede" style={{ marginTop: 28, marginBottom: 16 }}>
            <span className="em">we&apos;re building out the b2b side right now.</span>{' '}
            tell us what you&apos;re looking to order, where you are, and a bit about
            your business — we&apos;ll get back to you with the wholesale product catalogue
            and tier pricing, and figure out the right fit together.
          </p>

          <p className="lede" style={{ marginBottom: 32 }}>
            inquiries land in tennyson&apos;s inbox directly{' '}
            (<a href="mailto:tennysontaggart@gmail.com" style={{ color: 'var(--lemon)' }}>
              tennysontaggart@gmail.com
            </a>) — no bots, no autoresponders, no &ldquo;our wholesale team&rdquo;.
            you&apos;re talking to the founder.
          </p>

          <div
            style={{
              padding: 28,
              border: '1.5px solid rgba(245, 255, 61, 0.4)',
              borderRadius: 8,
              background: 'rgba(10, 0, 24, 0.55)',
              backdropFilter: 'blur(20px) saturate(180%)',
              boxShadow:
                '0 0 24px rgba(245, 255, 61, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            }}
          >
            <InquiryForm />
          </div>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Link className="kp-fr-cta" href="/">
              ← BACK TO LANDING
            </Link>
            <Link className="kp-fr-cta primary" href="/donate">
              CONTRIBUTE TO THE FUNDRAISER →
            </Link>
            <a className="kp-fr-cta pink" href="mailto:tennysontaggart@gmail.com">
              EMAIL DIRECTLY →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
