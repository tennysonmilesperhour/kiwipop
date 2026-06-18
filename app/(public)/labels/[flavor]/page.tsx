import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FlavorLabelCard } from '@/components/labels/FlavorLabelCard';
import { FLAVOR_LABELS, FDA_NOTICE, labelForSlug } from '@/lib/labels';
import { SITE_URL } from '@/lib/seo';

interface LabelFlavorPageProps {
  params: { flavor: string };
}

export function generateStaticParams() {
  return FLAVOR_LABELS.map((label) => ({ flavor: label.slug }));
}

export function generateMetadata({ params }: LabelFlavorPageProps): Metadata {
  const label = labelForSlug(params.flavor);
  if (!label) {
    return { title: 'flavor label · kiwi pop' };
  }
  const name = label.flavor.name;
  return {
    title: `${name} · ingredients, nutrition + safety`,
    description: `${name}: full ingredient statement, approximate nutrition, the functional payload with doses, and safety warnings.`,
    alternates: { canonical: `/labels/${label.slug}` },
  };
}

export default function LabelFlavorPage({ params }: LabelFlavorPageProps) {
  const label = labelForSlug(params.flavor);
  if (!label) notFound();

  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // ingredients · nutrition · safety
      </p>
      <h1 className="legal-title">{label.flavor.name}.</h1>
      <p className="legal-meta">
        <Link href="/labels">← all flavor labels</Link>
      </p>

      <div className="legal-prose">
        <FlavorLabelCard
          label={label}
          qrUrl={`${SITE_URL}/labels/${label.slug}`}
          variant="detail"
        />

        <p
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '3px solid var(--lemon, #f5ff3d)',
            background: 'rgba(245, 255, 61, 0.08)',
            fontWeight: 500,
            fontSize: 13,
            lineHeight: 1.6,
            marginTop: '2rem',
          }}
        >
          <strong>FDA notice:</strong> {FDA_NOTICE} see the{' '}
          <Link href="/legal/fda-disclaimer">fda + safety</Link> page for the
          full advisory, and{' '}
          <Link href="/research">research + references</Link> for the studies
          behind each ingredient.
        </p>
      </div>
    </div>
  );
}
