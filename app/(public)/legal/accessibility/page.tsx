import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'accessibility',
  description: "kiwi pop's accessibility commitment + how to flag issues.",
};

export default function AccessibilityPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // accessibility
      </p>
      <h1 className="legal-title">accessibility.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <p>
          short version: we want anyone who wants a kiwi pop to be able to
          buy a kiwi pop. if something on this site gets in your way, tell us
          and we&apos;ll fix it.
        </p>

        <h2>what we&apos;re aiming for</h2>
        <p>
          our target is the web content accessibility guidelines (WCAG) 2.1
          level AA. we&apos;re a small team building this in public, and
          we&apos;re aware some pages don&apos;t fully meet that bar yet.
          we&apos;re working on it.
        </p>

        <h2>what we&apos;ve built in</h2>
        <ul>
          <li>semantic html · headings, landmarks, lists where they belong</li>
          <li>keyboard navigation · all interactive elements reachable
              without a mouse</li>
          <li>focus indicators · visible on every focusable control</li>
          <li>alt text on product imagery</li>
          <li>color contrast tested against the dark theme; the highlighter
              spec strip on the hero specifically flips to dark text on a
              near-opaque white background for legibility</li>
          <li>aria labels on icon-only buttons (cart, qty steppers, status
              pills)</li>
        </ul>

        <h2>known limitations</h2>
        <ul>
          <li>some animations don&apos;t yet honor{' '}
              <code>prefers-reduced-motion</code> · we&apos;re fixing that</li>
          <li>the hanzi watermarks and decorative kanji are{' '}
              <code>aria-hidden</code> so screen readers skip them</li>
        </ul>

        <h2>flag an issue</h2>
        <p>
          if any part of this site is unusable for you,{' '}
          <a href="mailto:hello@kiwipop.co">email hello@kiwipop.co</a>{' '}
          with the page URL and what went wrong. we read every one and
          respond within a few days. we&apos;ll also place an order for you
          over email or phone if the site itself is the blocker.
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
