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
            yes
          </li>
          <li>canada: yes, tracked shipping</li>
          <li>selected international destinations: yes, tracked shipping</li>
        </ul>

        <h2>how it ships</h2>
        <ul>
          <li>
            us orders ship via usps. canada and international orders use an
            available tracked international carrier.
          </li>
          <li>
            us orders get free shipping over <strong>$40</strong>; otherwise
            shipping is <strong>$4.99</strong>. canada is <strong>$14.99</strong>
            and other supported international destinations are{' '}
            <strong>$24.99</strong>.
          </li>
          <li>
            we ship within 1–3 business days. international transit and customs
            clearance usually take longer, and import duties may be collected
            by the destination country.
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
          all four flavors are <em>in stock and shipping now</em>. orders are
          charged at checkout and go out from salt lake on the schedule above.
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
