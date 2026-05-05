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
          you must be at least <strong>18 years old</strong> to buy from
          us. kiwi pop contains kava, which is restricted to adults; the
          site, the product, and any marketing communication is not
          intended for anyone under 18. by placing an order you affirm
          you&apos;re 18+. if you&apos;re younger, get a parent or
          guardian to handle it.
        </p>
        <p>
          you also have to be old enough to legally enter a contract where
          you live, which is typically 18 in most US states.
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
          kiwi pop contains real functional ingredients (theobromine, kava,
          ginseng, b12, magnesium, taurine, electrolytes) and sugar alcohols
          (isomalt, xylitol). it is candy with a payload, not a drug, and
          not medical advice. if you have a condition, are pregnant, are on
          medication, or have a sensitivity to sugar alcohols, ask your
          doctor before eating functional candy. we&apos;re not them.
          xylitol is toxic to dogs — keep these away from pets.
        </p>
        <p>
          full ingredient safety information, the FDA disclaimer, the kava
          advisory, and the california prop 65 reservation live on the{' '}
          <Link href="/legal/fda-disclaimer">fda + safety</Link> page.
        </p>

        <h2>intellectual property</h2>
        <p>
          &ldquo;kiwi pop&rdquo;, &ldquo;cyberpop&rdquo;, the kiwi pop
          wordmark, the lollipop hero photography, the four-flavor naming
          (kiwi pop · lemon g. luci · mollie&apos;s mango · merry mint), the
          functional payload labeling, and the visual identity (color
          system, layout, copy) are kiwi pop&apos;s intellectual property.
          you can share screenshots and tag us; you can&apos;t lift our copy
          or imagery for a competing product. trademarks are claimed in
          common-law use; registration is in progress.
        </p>

        <h2>liability</h2>
        <p>
          to the extent the law allows, our liability for anything related to
          the site or the product is capped at what you paid. we don&apos;t
          warrant the site is bug-free or always available.
        </p>

        <h2>governing law</h2>
        <p>
          these terms are governed by the law of the state of utah, USA,
          without regard to conflict-of-laws principles. disputes go through
          the state or federal courts located in salt lake county, utah,
          unless your local consumer-protection law gives you a non-waivable
          right to a different forum.
        </p>

        <h2>changes to these terms</h2>
        <p>
          we may update these terms occasionally. the &ldquo;last updated&rdquo;
          date above changes when we do. continued use of the site after that
          date counts as acceptance of the new version. material changes
          will get an email to anyone with an active order in the last 12
          months.
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
