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
          us. the site, the product, and any marketing communication is not
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
        <p
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '3px solid var(--lemon, #f5ff3d)',
            background: 'rgba(245, 255, 61, 0.08)',
            fontWeight: 500,
          }}
        >
          <strong>FDA notice:</strong> these statements have not been
          evaluated by the food and drug administration. this product is not
          intended to diagnose, treat, cure, or prevent any disease.
        </p>
        <p>
          kiwi pop is a dietary supplement in confection form. it contains
          functional ingredients (theobromine, ginseng, b12, magnesium,
          taurine, electrolytes) and sugar alcohols (isomalt, xylitol). any
          claims we make about our ingredients are structure/function claims
          — they describe how nutrients may support normal body functions,
          not treat or cure medical conditions.
        </p>
        <p>
          kiwi pop is not a drug, not a substitute for medical treatment, and
          not medical advice. if you have a medical condition, are pregnant
          or nursing, are taking prescription medication (especially
          sedatives, benzodiazepines, or hepatotoxic drugs), or have a
          sensitivity to sugar alcohols, consult a licensed healthcare
          provider before use.
        </p>
        <p>
          <strong>xylitol warning:</strong> xylitol is highly toxic to dogs
          and other pets. keep kiwi pop away from animals.
        </p>
        <p>
          full ingredient safety information, the FDA disclaimer, and
          the california prop 65 reservation live on the{' '}
          <Link href="/legal/fda-disclaimer">fda + safety</Link> page.
        </p>

        <h2>disclaimer of warranties</h2>
        <p>
          kiwi pop is provided &ldquo;as is&rdquo; without warranties of any
          kind, express or implied, including but not limited to implied
          warranties of merchantability, fitness for a particular purpose,
          or non-infringement. we do not warrant that the product will meet
          your specific health needs or produce any particular result.
          individual responses to dietary supplements vary.
        </p>

        <h2>assumption of risk</h2>
        <p>
          by purchasing and consuming kiwi pop, you acknowledge that dietary
          supplements carry inherent risks, that you have read the ingredient
          list and safety warnings, and that you assume full responsibility
          for your decision to consume this product.
        </p>

        <h2>intellectual property</h2>
        <p>
          &ldquo;kiwi pop&rdquo;, &ldquo;cyberpop&rdquo;, the kiwi pop
          wordmark, the lollipop hero photography, the four-flavor naming
          (kiwi pop · lemon g. luci · molly&apos;s mint · mary caramel apple), the
          functional payload labeling, and the visual identity (color
          system, layout, copy) are kiwi pop&apos;s intellectual property.
          you can share screenshots and tag us; you can&apos;t lift our copy
          or imagery for a competing product. trademarks are claimed in
          common-law use; registration is in progress.
        </p>

        <h2>limitation of liability</h2>
        <p>
          to the maximum extent permitted by applicable law, kiwi pop and its
          officers, directors, employees, and agents shall not be liable for
          any indirect, incidental, special, consequential, or punitive
          damages, including but not limited to loss of profits, data, use,
          or goodwill, arising out of or related to your use of the site or
          product.
        </p>
        <p>
          our total liability for any claim arising from or related to the
          site or product is limited to the amount you paid for the specific
          product giving rise to the claim. this limitation applies regardless
          of the form of action, whether in contract, tort, strict liability,
          or otherwise.
        </p>
        <p>
          some jurisdictions do not allow limitations on implied warranties or
          exclusion of certain damages. if these laws apply to you, some or
          all of the above limitations may not apply, and you may have
          additional rights.
        </p>

        <h2>indemnification</h2>
        <p>
          you agree to indemnify, defend, and hold harmless kiwi pop and its
          affiliates from any claims, damages, losses, or expenses (including
          reasonable attorneys&apos; fees) arising from your use of the site
          or product, your violation of these terms, or your violation of any
          rights of a third party.
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
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
