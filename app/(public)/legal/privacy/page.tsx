import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'privacy',
  description: 'how kiwi pop handles your data.',
};

export default function PrivacyPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // privacy
      </p>
      <h1 className="legal-title">privacy.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
        <p>
          short version: we collect what you give us so we can ship you pops,
          email you when there&apos;s a drop, and run the business. we
          don&apos;t sell your data. we don&apos;t share it with people who
          shouldn&apos;t have it. if you want it deleted, email us.
        </p>

        <h2>what we collect</h2>
        <ul>
          <li>
            email address · for receipts and the list
          </li>
          <li>
            shipping address · so the pops get to you
          </li>
          <li>
            payment info · processed by stripe; we never see your card
            number
          </li>
          <li>
            basic analytics · vercel analytics + speed insights · aggregated,
            no personal identifiers
          </li>
        </ul>

        <h2>what we don&apos;t do</h2>
        <ul>
          <li>sell your data to third parties</li>
          <li>track you across other sites</li>
          <li>send you spam (one drop email per drop, max)</li>
          <li>store your card number anywhere</li>
        </ul>

        <h2>marketing emails · consent + unsubscribe</h2>
        <p>
          when you sign up to &ldquo;the list&rdquo; or check out, you&apos;re
          opting in to occasional marketing emails (drop announcements,
          festival activations, restocks). you can unsubscribe at the bottom
          of any email or by emailing{' '}
          <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a>. transactional
          emails (order confirmations, shipping notifications) keep coming
          regardless — we have to send those.
        </p>

        <h2>cookies + tracking</h2>
        <p>
          we use vercel analytics and speed insights to understand which
          pages people visit and how fast they load. those tools sample IPs
          and basic device info but don&apos;t set marketing cookies and
          don&apos;t link to identifiable individuals. we don&apos;t run
          retargeting pixels or advertising trackers.
        </p>

        <h2>california residents (CCPA / CPRA)</h2>
        <p>
          we don&apos;t sell or share personal information for cross-context
          behavioral advertising. you have the right to know what we have on
          you, request deletion, and opt out of any future sale or sharing
          (we don&apos;t do either, but the right is yours). email{' '}
          <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a> with the
          subject &ldquo;CCPA request&rdquo; and we&apos;ll handle it within
          45 days.
        </p>

        <h2>kids · COPPA</h2>
        <p>
          this site and product are not directed at children under 13. we do
          not knowingly collect personal information from anyone under 13.
          if you believe a child has signed up, email us and we&apos;ll
          delete the record. kiwi pop contains kava and is intended for
          adults 18+ only — see the{' '}
          <Link href="/legal/fda-disclaimer">fda + safety</Link> page.
        </p>

        <h2>your rights</h2>
        <p>
          email{' '}
          <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a> to:
        </p>
        <ul>
          <li>see what we have on you</li>
          <li>delete it</li>
          <li>unsubscribe from emails</li>
          <li>opt out of analytics</li>
        </ul>

        <h2>contact</h2>
        <p>
          questions: <a href="mailto:hello@kiwipop.co">hello@kiwipop.co</a>
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
