import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'fda disclaimer + ingredient safety',
  description:
    'fda dietary supplement disclaimer, kava advisory, sugar-alcohol notice, allergen and prop-65 disclosures.',
};

export default function FdaDisclaimerPage() {
  return (
    <div className="page-container legal-page">
      <p className="hero-tagline" style={{ color: 'var(--bone)' }}>
        // fda disclaimer + ingredient safety
      </p>
      <h1 className="legal-title">fda + safety.</h1>
      <p className="legal-meta">last updated · {new Date().getFullYear()}</p>

      <div className="legal-prose">
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
          intended to diagnose, treat, cure, or prevent any disease. kiwi pop
          is a confection with functional ingredients — it is candy, not a
          drug, and not medical advice.
        </p>

        <h2>who shouldn&apos;t eat this</h2>
        <ul>
          <li>anyone under 18</li>
          <li>anyone pregnant or nursing</li>
          <li>anyone with liver disease, liver dysfunction, or a history of
              liver problems (kava advisory — see below)</li>
          <li>anyone on prescription medication, especially benzodiazepines,
              alcohol, sedatives, or anything metabolized by the liver</li>
          <li>anyone with a sensitivity to sugar alcohols (isomalt, xylitol)
              that causes GI distress</li>
        </ul>

        <h2>kava advisory</h2>
        <p>
          kiwi pop contains <strong>kava</strong> (piper methysticum,
          0.75 g per pop). the FDA has issued a consumer advisory about
          kava-containing products and a rare association with severe
          liver injury. do not consume kava if you have liver disease,
          liver dysfunction, or a history of liver problems. do not combine
          with alcohol, benzodiazepines, sedatives, or hepatotoxic
          medications. discontinue use and consult a doctor if you experience
          jaundice, dark urine, fatigue, or right-upper-quadrant abdominal
          pain.
        </p>
        <p>
          kava sales and possession are restricted, regulated, or prohibited
          in some jurisdictions. you are responsible for knowing your local
          law. we ship domestic US only — we may decline orders to states
          that restrict kava.
        </p>

        <h2>sugar alcohols</h2>
        <p>
          kiwi pop is sweetened with <strong>isomalt</strong> (~15g per pop)
          and <strong>xylitol</strong> (~1.2g per pop). sugar alcohols are
          poorly absorbed and may cause gas, bloating, or laxative effects in
          some people, especially in larger quantities. start with one pop.
        </p>
        <p>
          <strong style={{ color: 'var(--magenta)' }}>
            xylitol is highly toxic to dogs.
          </strong>{' '}
          even small amounts can cause hypoglycemia, liver failure, or death.
          keep these pops away from pets. if a dog ingests one, contact your
          veterinarian or the pet poison helpline immediately.
        </p>

        <h2>functional ingredients · per pop</h2>
        <ul>
          <li>theobromine — 175 mg</li>
          <li>kava (instant) — 0.75 g</li>
          <li>ginseng — 150 mg</li>
          <li>magnesium glycinate — 300 mg</li>
          <li>taurine — 250 mg</li>
          <li>b12 (methylcobalamin) — 1 mg</li>
          <li>blue spirulina — 125 mg</li>
          <li>electrolyte blend — 250 mg</li>
        </ul>
        <p>
          functional ingredients are dietary supplements, not drugs.
          individual responses vary. if you&apos;re uncertain whether any of
          these are appropriate for you, ask your doctor.
        </p>

        <h2>allergens</h2>
        <p>
          made in a facility that handles small-batch food products. the
          recipe does not intentionally use peanuts, tree nuts, dairy, soy,
          wheat, eggs, fish, or shellfish, but cross-contact is possible. if
          you have a serious allergy, email{' '}
          <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a> for the
          current batch&apos;s facility statement before ordering.
        </p>

        <h2>california prop 65</h2>
        <p>
          consuming food and beverage products may expose you to chemicals
          known to the state of california to cause cancer or reproductive
          harm. for more information go to{' '}
          <a
            href="https://www.p65warnings.ca.gov/products/food"
            target="_blank"
            rel="noopener noreferrer"
          >
            p65warnings.ca.gov/products/food
          </a>
          .
        </p>

        <h2>questions</h2>
        <p>
          email <a href="mailto:thekiwipop@gmail.com">thekiwipop@gmail.com</a>. if
          you experience an adverse reaction, also contact your healthcare
          provider and (in the US) the FDA at{' '}
          <a
            href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program"
            target="_blank"
            rel="noopener noreferrer"
          >
            fda.gov/safety/medwatch
          </a>
          .
        </p>
      </div>

      <Link href="/" className="btn">
        back to dawn
      </Link>
    </div>
  );
}
