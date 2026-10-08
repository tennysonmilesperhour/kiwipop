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
            <strong style={{ color: 'var(--lime)' }}>domestic us</strong>:
            yes, day one
          </li>
          <li>canada: soon, on the list</li>
          <li>
            international (vienna · melbourne · london are first in line):
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
            <strong>$4.99</strong> standard. order more pops.
          </li>
          <li>
            in-stock items ship within 1–3 business days. preorders are
            charged today and ship when that batch is ready — we email you
            when it goes out. small batch · sometimes the wax cools at its
            own speed.
          </li>
        </ul>

        <h2>tracking</h2>
        <p>
          you get a tracking link by email when the label prints. it&apos;ll
          look like the rest of our emails: short, lowercase, no marketing.
        </p>

        <h2>damaged · missing · stolen</h2>
        <p>
          email <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> with
          your order number and a photo if relevant. we&apos;ll fix it.
        </p>

        <h2>availability</h2>
        <p>
          in-stock items go out from salt lake within 1–3 business days.
          preorders ship when the batch is ready, and we email you when that
          happens. orders are charged at checkout either way.
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
