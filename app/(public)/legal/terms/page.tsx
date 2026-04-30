import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'terms',
  description: 'kiwi pop terms of service.',
};

export default function TermsPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // terms
      </p>
      <h1 className="legal-title">terms.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <p>
          short version: buy our pops, eat our pops, enjoy our pops. don&apos;t
          do anything weird. if something goes wrong, email us before you sue
          us — we&apos;ll fix it.
        </p>

        <h2>using the site</h2>
        <p>
          you have to be old enough to legally enter a contract where you
          live (typically 18). if you&apos;re younger, get a parent.
        </p>

        <h2>orders + payment</h2>
        <ul>
          <li>
            prices and stock can change. we honor the price you saw at
            checkout.
          </li>
          <li>
            we may refuse or cancel any order. the most likely reason is
            we&apos;re out of stock and the inventory hasn&apos;t caught up
            yet — we&apos;ll refund and tell you.
          </li>
          <li>
            payment is processed by stripe under their terms.
          </li>
        </ul>

        <h2>shipping + returns</h2>
        <p>
          see the <Link href="/legal/shipping">shipping policy</Link> and{' '}
          <Link href="/legal/refund">refund policy</Link>.
        </p>

        <h2>health + medical</h2>
        <p>
          kiwi pop contains real functional ingredients (b12, l-tyrosine,
          ginkgo, turmeric, electrolytes). it is candy with a payload, not a
          drug, and not medical advice. if you have a condition, are
          pregnant, or are on medication, ask your doctor before eating
          functional candy. we&apos;re not them.
        </p>

        <h2>liability</h2>
        <p>
          to the extent the law allows, our liability for anything related to
          the site or the product is capped at what you paid. we don&apos;t
          warrant the site is bug-free or always available.
        </p>

        <h2>contact</h2>
        <p>
          <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a>
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
