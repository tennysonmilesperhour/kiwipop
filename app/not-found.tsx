import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 · ghosted',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="page-container not-found-page">
      <p
        className="hero-tagline"
        style={{ color: 'var(--bone)', marginBottom: '0.5rem' }}
      >
        // 404
      </p>
      <h1>nothing here.</h1>
      <p
        style={{
          marginTop: '1rem',
          color: 'var(--bone)',
          fontFamily: 'var(--mono)',
        }}
      >
        the page got eaten by a particularly enthusiastic kiwi pop fan.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/" className="btn btn-primary">
          back to the drop
        </Link>
      </div>
    </div>
  );
}
