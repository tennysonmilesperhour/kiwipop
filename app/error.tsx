'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Production error tracking would go here (e.g., Sentry).
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[GlobalError]', error);
    }
  }, [error]);

  return (
    <div className="error-page">
      <h1 className="text-3xl font-bold mb-3">Something went wrong</h1>
      <p className="mb-6">
        We hit an unexpected error. The team has been notified — try again, or
        head back to the storefront.
      </p>
      {error.digest ? (
        <p className="text-xs text-zinc-500 mb-6">
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
      <div className="flex gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn">
          Back home
        </Link>
      </div>
    </div>
  );
}
