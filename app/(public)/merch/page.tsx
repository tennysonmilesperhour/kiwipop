import type { Metadata } from 'next';
import Link from 'next/link';
import { MerchSection } from '@/components/home/MerchSection';

export const metadata: Metadata = {
  title: 'merch · launch fundraiser',
  description:
    'placeholder merch tees to fund the kiwi pop launch drop. five shirts, every dollar funds production.',
};

export default function MerchPage() {
  return (
    <div className="page-container">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // launch fundraiser
      </p>
      <h1
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 7vw, 4.5rem)',
          letterSpacing: '-0.03em',
          textTransform: 'lowercase',
          color: 'var(--paper)',
          marginBottom: '1rem',
        }}
      >
        merch · order now.
      </h1>
      <p
        style={{
          color: 'var(--bone)',
          maxWidth: '38rem',
          marginBottom: '2.5rem',
          lineHeight: 1.5,
        }}
      >
        five tees, fundraiser pricing, ships when the print run lands. these
        are placeholder products — checkout works today, art locks next week.
        every order goes straight into the launch.
      </p>

      <MerchSection />

      <div
        style={{
          marginTop: '3rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/#list" className="btn btn-primary">
          get on the list
        </Link>
        <Link href="/" className="btn btn-secondary">
          back to the drop
        </Link>
      </div>
    </div>
  );
}
