import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'refunds',
  description: 'kiwi pop refund + returns policy.',
};

export default function RefundPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // refunds
      </p>
      <h1 className="legal-title">refunds.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <p>
          short version: if a pop is broken, melted, or missing, we replace
          it or refund it. we don&apos;t take returns of opened candy because
          food safety, but if you hated it, tell us — we&apos;ll fix it.
        </p>

        <h2>damaged on arrival</h2>
        <p>
          email{' '}
          <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a> with your
          order number and a photo within{' '}
          <strong>7 days</strong> of delivery. we send a replacement or
          refund.
        </p>

        <h2>missing pops</h2>
        <p>
          sometimes the pack count is wrong. that&apos;s on us. tell us and
          we ship the missing pops, no charge.
        </p>

        <h2>didn&apos;t love it</h2>
        <p>
          we don&apos;t take returns of opened candy. but if the experience
          missed, email us and we&apos;ll either send something else or
          refund the order. we&apos;d rather hear about it than lose you.
        </p>

        <h2>cancelled / preorder refunds</h2>
        <p>
          preorder cancellations get a full refund as long as the batch
          hasn&apos;t shipped. once it&apos;s on the truck, treat it like a
          regular order.
        </p>

        <h2>refund processing</h2>
        <p>
          refunds go back to the original card via stripe. usually 3–5
          business days to land, depending on your bank.
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
