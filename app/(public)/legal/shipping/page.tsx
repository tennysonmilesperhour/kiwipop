import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'shipping',
  description: 'how and where kiwi pop ships.',
};

export default function ShippingPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // shipping
      </p>
      <h1 className="legal-title">shipping.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <h2>where we ship</h2>
        <ul>
          <li>
            <strong style={{ color: 'var(--lime)' }}>domestic us</strong> —
            yes, day one
          </li>
          <li>canada — soon, on the list</li>
          <li>
            international (vienna · melbourne · london are first in line) —
            waitlist; we open it when we have stock
          </li>
        </ul>

        <h2>how it ships</h2>
        <ul>
          <li>
            usps or ups, calculated at checkout. shop pay express checkout
            available.
          </li>
          <li>
            free shipping over <strong>$40</strong>. otherwise flat{' '}
            <strong>$5</strong> standard. order more pops.
          </li>
          <li>
            we ship within 1–3 business days. small batch · sometimes the
            wax cools at its own speed.
          </li>
        </ul>

        <h2>tracking</h2>
        <p>
          you get a tracking link by email when the label prints. it&apos;ll
          look like the rest of our emails: short, lowercase, no marketing.
        </p>

        <h2>damaged · missing · stolen</h2>
        <p>
          email <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a> with
          your order number and a photo if relevant. we&apos;ll fix it.
        </p>

        <h2>preorders</h2>
        <p>
          three of our four flavors are <em>coming soon</em>. preordering
          means we charge you now and ship when the batch is ready. an email
          goes out the day before the truck moves.
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
