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
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>. transactional
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

        <h2>third-party service providers</h2>
        <p>
          we share data only with service providers necessary to operate the
          business:
        </p>
        <ul>
          <li><strong>stripe</strong> — payment processing (PCI-DSS compliant)</li>
          <li><strong>supabase</strong> — database and authentication</li>
          <li><strong>vercel</strong> — hosting and analytics</li>
          <li><strong>resend</strong> — transactional email</li>
          <li><strong>usps / shipping carriers</strong> — order fulfillment</li>
        </ul>
        <p>
          these providers are contractually bound to use your data only for
          the services they provide to us and to maintain appropriate
          security measures.
        </p>

        <h2>data retention</h2>
        <p>
          we retain your personal information for as long as necessary to
          fulfill the purposes described in this policy:
        </p>
        <ul>
          <li>order data — 7 years (tax and legal compliance)</li>
          <li>email list data — until you unsubscribe</li>
          <li>analytics data — 26 months (aggregated)</li>
        </ul>
        <p>
          you can request deletion at any time; we&apos;ll delete what we
          legally can and tell you what we have to keep and why.
        </p>

        <h2>data security</h2>
        <p>
          we implement industry-standard security measures including HTTPS
          encryption, secure authentication, and access controls. payment
          data is handled entirely by stripe and never touches our servers.
          no system is 100% secure — if we ever experience a breach affecting
          your data, we&apos;ll notify you as required by law.
        </p>

        <h2>california residents (CCPA / CPRA)</h2>
        <p>
          we don&apos;t sell or share personal information for cross-context
          behavioral advertising. you have the right to know what we have on
          you, request deletion, and opt out of any future sale or sharing
          (we don&apos;t do either, but the right is yours). email{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> with the
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
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> to:
        </p>
        <ul>
          <li>see what we have on you</li>
          <li>delete it</li>
          <li>unsubscribe from emails</li>
          <li>opt out of analytics</li>
        </ul>

        <h2>do not track</h2>
        <p>
          our site does not respond to &ldquo;do not track&rdquo; browser
          signals because there&apos;s no industry standard for what that
          means. however, we don&apos;t track you across other sites anyway.
        </p>

        <h2>international users</h2>
        <p>
          we currently ship only within the united states. if you access the
          site from outside the US, your data will be transferred to and
          processed in the united states, which may have different data
          protection laws than your jurisdiction. by using the site, you
          consent to this transfer.
        </p>

        <h2>changes to this policy</h2>
        <p>
          we may update this privacy policy periodically. the &ldquo;last
          updated&rdquo; date at the top reflects the most recent revision.
          continued use of the site after changes constitutes acceptance.
          material changes will be communicated via email to customers with
          orders in the past 12 months.
        </p>

        <h2>contact</h2>
        <p>
          questions about this privacy policy or your data:{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>
        </p>
        <p>
          mailing address: kiwi pop, salt lake city, utah, USA
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
