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
          food safety, but if you hated it, tell us, we&apos;ll fix it.
        </p>

        <h2>damaged on arrival</h2>
        <p>
          email{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> with your
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

        <h2>cancellations</h2>
        <p>
          cancellations get a full refund as long as the order hasn&apos;t
          shipped. once it&apos;s on the truck, treat it like a regular order.
        </p>

        <h2>refund processing</h2>
        <p>
          refunds go back to the original card via stripe. usually 3–5
          business days to land, depending on your bank.
        </p>

        <h2>return policy for consumables</h2>
        <p>
          kiwi pop is a consumable dietary supplement. for food safety
          reasons, we cannot accept returns of opened or partially consumed
          products. unopened products in original packaging may be returned
          within <strong>30 days</strong> of delivery for a full refund,
          minus original shipping costs.
        </p>
        <p>
          to initiate a return of unopened product:
        </p>
        <ul>
          <li>email <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> with your order number</li>
          <li>we&apos;ll provide a return shipping address</li>
          <li>you are responsible for return shipping costs</li>
          <li>refund is issued within 5 business days of receiving the return</li>
        </ul>

        <h2>exchanges</h2>
        <p>
          we don&apos;t do direct exchanges. if you want a different flavor
          or product, return the original for a refund and place a new order.
        </p>

        <h2>order cancellation</h2>
        <p>
          you can cancel an order for a full refund if it hasn&apos;t shipped
          yet. once an order is in transit, it cannot be cancelled. you
          would need to refuse delivery or return it upon arrival.
        </p>

        <h2>adverse reactions</h2>
        <p>
          if you experience an adverse reaction to kiwi pop, discontinue use
          immediately and consult a healthcare provider. please also report
          the reaction to us at{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> and to the
          FDA via{' '}
          <a
            href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program"
            target="_blank"
            rel="noopener noreferrer"
          >
            MedWatch
          </a>
          . we take safety seriously and will work with you on refunds or
          replacements as appropriate.
        </p>

        <h2>contact</h2>
        <p>
          all refund and return requests:{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
