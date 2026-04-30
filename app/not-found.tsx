import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="mb-6">
        That page doesn&apos;t exist (or got eaten by a particularly enthusiastic
        Kiwi Pop fan).
      </p>
      <Link href="/" className="btn btn-primary">
        Browse pops
      </Link>
    </div>
  );
}
