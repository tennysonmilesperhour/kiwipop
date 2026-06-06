import Link from 'next/link';
import type { Metadata } from 'next';
import { FAQ_ITEMS, FAQ_LD } from '@/lib/faq';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'faq',
  description:
    'kiwi pop frequently asked questions: what it feels like, what is in it, who should not eat it, shipping, returns, and storage.',
};

export default function FaqPage() {
  return (
    <div className="page-container legal-page">
      <JsonLd data={FAQ_LD} />
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // frequently asked
      </p>
      <h1 className="legal-title">asked &amp; answered.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <p>
          everything people ask before their first pop. if your question is not
          here, email{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> and
          we&apos;ll add it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: '1.5rem' }}>
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              style={{
                border: '1px solid rgba(244, 236, 255, 0.16)',
                borderRadius: 'var(--radius-card, 12px)',
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: '0.02em',
                  listStyle: 'none',
                  color: 'var(--paper, #f4ecff)',
                }}
              >
                {item.q}
              </summary>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'var(--bone, #c8c0db)',
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
