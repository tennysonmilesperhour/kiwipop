import Link from 'next/link';
import type { Metadata } from 'next';
import { FlavorLabelCard } from '@/components/labels/FlavorLabelCard';
import { FLAVOR_LABELS, FDA_NOTICE } from '@/lib/labels';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'ingredients, nutrition + safety labels',
  description:
    'every kiwi pop flavor: full ingredient statement, approximate nutrition, the functional (nutraceutical) payload with doses, and safety warnings — plus a scannable QR for each flavor.',
  alternates: { canonical: '/labels' },
};

export default function LabelsPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // ingredients · nutrition · safety
      </p>
      <h1 className="legal-title">what&apos;s in each pop.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <p>
          the lollipops don&apos;t carry their ingredients, nutrition, or
          warnings on the wrapper yet — so this page does. each flavor below has
          its full ingredient statement, approximate nutrition, the functional
          (nutraceutical) payload with doses, and safety warnings. the{' '}
          <strong>QR next to each flavor links straight to that flavor&apos;s
          label page</strong>, so you can print it and stick it on the pop (use
          the <em>print qr</em> button). it&apos;s here on this page too so
          it&apos;s easy to find for now.
        </p>

        <p
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '3px solid var(--lemon, #f5ff3d)',
            background: 'rgba(245, 255, 61, 0.08)',
            fontWeight: 500,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <strong>FDA notice:</strong> {FDA_NOTICE} see the{' '}
          <Link href="/legal/fda-disclaimer">fda + safety</Link> page for the
          full advisory, and{' '}
          <Link href="/research">research + references</Link> for the studies
          behind each ingredient.
        </p>

        {/* quick jump */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            margin: '1.5rem 0 0',
          }}
        >
          {FLAVOR_LABELS.map((label) => (
            <a
              key={label.slug}
              href={`#${label.slug}`}
              className="btn"
              style={{ fontSize: 11, borderColor: `${label.flavor.color}66` }}
            >
              {label.flavor.name}
            </a>
          ))}
        </div>

        {FLAVOR_LABELS.map((label) => (
          <FlavorLabelCard
            key={label.slug}
            label={label}
            qrUrl={`${SITE_URL}/labels/${label.slug}`}
            variant="index"
          />
        ))}
      </div>
    </div>
  );
}
