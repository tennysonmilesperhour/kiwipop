'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[GlobalError]', error);
    }
  }, [error]);

  return (
    <div className="page-container error-page">
      <p
        className="hero-tagline"
        style={{ color: 'var(--magenta)', marginBottom: '0.5rem' }}
      >
        // glitch
      </p>
      <h1>that broke.</h1>
      <p
        style={{
          marginTop: '1rem',
          color: 'var(--bone)',
          fontFamily: 'var(--mono)',
        }}
      >
        something hit the floor. try again, or go back to the drop.
      </p>
      {error.digest ? (
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--bone)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          ref · <code>{error.digest}</code>
        </p>
      ) : null}
      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={reset} className="btn btn-primary">
          try again
        </button>
        <Link href="/" className="btn">
          back home
        </Link>
      </div>
    </div>
  );
}
