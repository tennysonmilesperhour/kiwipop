import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

/* =========================================================================
   KIWI POP — WHOLESALE BRAND SHEET  (/brand)
   -------------------------------------------------------------------------
   A self-contained, print-friendly one-pager for wholesale vendors and
   retail partners. Aesthetic: cyberpunk / Y2K-Harajuku — reuses the site's
   Atomic Neon tokens + classes from globals.css (no new dependencies).

   ALL editable copy lives in the SHEET config object below. Update names,
   numbers, and descriptions here without touching the layout markup.
   Anything still needing your input is tagged with a TODO comment and/or a
   `todo: true` flag so it renders in a distinct color.
   ========================================================================= */

interface PayloadItem {
  name: string;
  benefit: string;
  color: string; // any --token hex from globals.css :root
  hook?: string; // optional emphasis tag (used for the chilcuague tingle)
}

interface Claim {
  no: string; // the "no" lead claim, e.g. "no sugar"
  what: string; // restated benefit
  why: string;
}

interface Flavor {
  name: string;
  descriptor: string;
  color: string;
  status: 'live' | 'soon';
}

interface DataRow {
  label: string;
  value: string;
  todo?: boolean;
}

interface Contact {
  region: string;
  person: string;
  email: string; // TODO emails marked inline below
  todo?: boolean;
}

const SHEET = {
  hero: {
    eyebrow: 'wholesale brand sheet',
    brand: 'kiwi pop',
    tagline: 'tokyo at 3am in 2099.',
    positioning:
      'a functional lollipop engineered for energy, focus, and a tingle you can feel. sugar-free, sharp, and built for people who want their candy to do something.',
    // TODO: swap /hero-pop.png for the final vendor-facing product shot when ready.
    image: '/hero-pop.png',
  },

  whatItIs:
    'kiwi pop is a hard-candy lollipop with a functional payload. it sits in the fast-growing intersection of confectionery and functional wellness — the indulgence and impulse-buy appeal of candy, with an active formulation that delivers a real sensory and physical effect. no sugar, no crash, no compromise on flavor.',

  payload: [
    {
      name: 'theobromine',
      benefit: 'a smooth, sustained lift without the jitter of caffeine.',
      color: '#a8ff3c',
    },
    {
      name: 'b12',
      benefit: 'supports energy metabolism and mental clarity.',
      color: '#00f0ff',
    },
    {
      name: 'electrolytes',
      benefit: 'hydration support built right into the candy.',
      color: '#ffce1f',
    },
    {
      name: 'blue spirulina',
      benefit:
        "a natural blue-green pigment and nutrient source — kiwi pop's signature color, no artificial dye.",
      color: '#7b2dff',
    },
    {
      name: 'chilcuague',
      benefit:
        'a root-derived spilanthol source that creates a distinctive electric, effervescent mouthfeel.',
      color: '#ff2d8a',
      hook: 'the hook · impossible to copy',
    },
  ] as PayloadItem[],

  formulation: {
    claims: [
      {
        no: 'no sugar',
        what: 'isomalt base',
        why: 'sweetened with monk fruit and allulose. zero sugar, full flavor.',
      },
      {
        no: 'no citric acid',
        what: 'cleaner finish',
        why: 'no harsh sour bite on the back end.',
      },
      {
        no: 'no artificial dyes',
        what: 'color from spirulina',
        why: 'the signature blue-green comes from blue spirulina, not dye.',
      },
    ] as Claim[],
    note: 'clean-label positioning that holds up to scrutiny from health-conscious buyers and their customers.',
  },

  flavors: [
    {
      name: 'kiwi pop',
      descriptor: 'kiwi · sweet, tart, clean. the original.',
      color: '#a8ff3c',
      status: 'live',
    },
    {
      name: 'luci ginger lemon',
      descriptor: 'lemon + ginger · sharp, bright, awake.',
      color: '#ffce1f',
      status: 'soon',
    },
    {
      name: 'molly matcha mint',
      descriptor: 'matcha + mint · green, cool, grassy.',
      color: '#00f0ff',
      status: 'soon',
    },
    {
      name: 'mary caramel apple cinn',
      descriptor: 'caramel apple + cinnamon · warm, spiced, nostalgic.',
      color: '#ff2d8a',
      status: 'soon',
    },
  ] as Flavor[],

  story:
    "kiwi pop is built for the late-night, the neon-lit, the slightly unreal. the visual world is cyberpunk and y2k-harajuku: glossy, electric, and a little nostalgic for a future that never happened. it's candy for people who curate their aesthetic as carefully as their supplement stack. the brand doesn't whisper wellness — it glows.",

  wholesale: {
    rows: [
      { label: 'MOQ', value: 'TODO', todo: true },
      { label: 'case pack', value: 'TODO units / case', todo: true },
      { label: 'wholesale price', value: 'TODO / unit', todo: true },
      { label: 'SRP', value: 'TODO', todo: true },
      { label: 'margin', value: 'TODO', todo: true },
      { label: 'lead time', value: 'TODO', todo: true },
    ] as DataRow[],
    note: 'stripe-enabled ordering available for confirmed accounts.',
  },

  regulatory: {
    body: 'kiwi pop is being formulated and documented for EU market compliance, with a regulatory strategy in progress covering ingredient approvals and labeling requirements. full ingredient and compliance documentation is available to vendors on request.',
    // TODO: link the European regulatory strategy doc once it has a shareable home.
    docNote: '// european regulatory strategy — full doc available on request',
    // TODO: replace these placeholders with real certification badges once confirmed.
    badges: ['cert: TODO', 'cert: TODO', 'cert: TODO'],
  },

  contacts: [
    {
      region: 'north america · slc',
      person: 'skye',
      email: 'TODO@kiwipop.co', // TODO: Skye's wholesale email
      todo: true,
    },
    {
      region: 'europe · barcelona',
      person: 'kiwi',
      email: 'TODO@kiwipop.co', // TODO: Kiwi's wholesale email
      todo: true,
    },
  ] as Contact[],

  cta: {
    primaryLabel: 'request wholesale info',
    primaryHref: '/wholesale/apply',
    secondaryLabel: 'email us',
    secondaryHref: 'mailto:wholesale@kiwipop.co',
  },
} as const;

export const metadata: Metadata = {
  title: 'brand sheet · for wholesale partners',
  description:
    'kiwi pop wholesale brand sheet — a sugar-free functional lollipop with theobromine, b12, electrolytes, blue spirulina, and the chilcuague tingle. everything a buyer needs to evaluate stocking kiwi pop.',
  openGraph: {
    title: 'kiwi pop · wholesale brand sheet',
    description:
      'a sugar-free functional lollipop engineered for energy, focus, and a tingle you can feel. tokyo at 3am in 2099.',
    images: ['/og-image.png'],
  },
};

export default function BrandSheetPage() {
  return (
    <div className="brand-sheet">
      {/* ============================= HERO ============================= */}
      <section className="brand-hero scanlines">
        <div className="brand-hero-copy fade-up fade-up-1">
          <p className="brand-hero-eyebrow">
            <span className="dot" aria-hidden="true" />
            {SHEET.hero.eyebrow}
          </p>
          <h1>
            <span className="glitch" data-text={SHEET.hero.brand}>
              {SHEET.hero.brand}
            </span>
          </h1>
          <p className="brand-hero-tagline">{SHEET.hero.tagline}</p>
          <p className="brand-hero-positioning">{SHEET.hero.positioning}</p>
        </div>
        <div className="brand-hero-shot fade-up fade-up-2" aria-hidden="true">
          {/* TODO: replace with final vendor product shot (see SHEET.hero.image) */}
          <Image
            src={SHEET.hero.image}
            alt=""
            width={560}
            height={620}
            priority
            sizes="(max-width: 768px) 70vw, 440px"
          />
        </div>
      </section>

      {/* ========================= 01 · WHAT IT IS ===================== */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">01</span>what it is
            </h2>
            <span className="section-meta">functional lollipop</span>
          </div>
          <p className="brand-lead">{SHEET.whatItIs}</p>
        </div>
      </section>

      {/* ===================== 02 · FUNCTIONAL PAYLOAD ================= */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">02</span>the functional payload
            </h2>
            <span className="section-meta">dosed, not decorative</span>
          </div>
          <p className="brand-lead">
            every pop is dosed with a deliberate stack — real actives, framed
            for the effect a buyer&apos;s customer actually feels.
          </p>
          <div className="brand-grid">
            {SHEET.payload.map((item) => (
              <div
                key={item.name}
                className="brand-card"
                style={{ ['--c' as string]: item.color } as CSSProperties}
              >
                <div className="brand-card-name">{item.name}</div>
                <p className="brand-card-body">{item.benefit}</p>
                {item.hook ? (
                  <span className="brand-card-tag">{item.hook}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 03 · FORMULATION ========================= */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">03</span>formulation
            </h2>
            <span className="section-meta">lead with the no&apos;s</span>
          </div>
          <div className="brand-claims">
            {SHEET.formulation.claims.map((claim) => (
              <div key={claim.no} className="brand-claim">
                <div className="brand-claim-no">{claim.no}</div>
                <div className="brand-claim-what">{claim.what}</div>
                <p className="brand-claim-why">{claim.why}</p>
              </div>
            ))}
          </div>
          <p className="brand-lead" style={{ marginTop: '1.5rem' }}>
            {SHEET.formulation.note}
          </p>
        </div>
      </section>

      {/* ===================== 04 · FLAVOR LINEUP ===================== */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">04</span>flavor lineup
            </h2>
            <span className="section-meta">
              {SHEET.flavors.length} skus · images to come
            </span>
          </div>
          <div className="flavor-grid">
            {SHEET.flavors.map((flavor, idx) => (
              <article
                key={flavor.name}
                className="flavor-card"
                data-status={flavor.status}
                style={{ ['--c' as string]: flavor.color } as CSSProperties}
              >
                <div
                  className="flavor-top"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <span className="flavor-num">
                    {String(idx + 1).padStart(2, '0')} /{' '}
                    {String(SHEET.flavors.length).padStart(2, '0')}
                  </span>
                  {/* TODO: drop the real product photo in here per SKU */}
                  <span className="brand-img-todo">img: todo</span>
                </div>
                <div className="flavor-bottom">
                  <div className="flavor-name">{flavor.name}</div>
                  <div className="flavor-feeling">{flavor.descriptor}</div>
                </div>
                {flavor.status === 'soon' ? (
                  <span className="flavor-soon-overlay">soon</span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== 05 · BRAND WORLD ====================== */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">05</span>brand world
            </h2>
            <span className="section-meta">who it&apos;s for</span>
          </div>
          <p
            className="manifesto-text"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)', margin: 0 }}
          >
            {SHEET.story}
          </p>
        </div>
      </section>

      {/* ======================= 06 · WHOLESALE ======================= */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">06</span>wholesale
            </h2>
            <span className="section-meta">fill in the numbers</span>
          </div>
          {/* TODO: replace every value below with confirmed wholesale terms */}
          <div className="brand-data">
            {SHEET.wholesale.rows.map((row) => (
              <div key={row.label} className="brand-data-cell">
                <div className="brand-data-label">{row.label}</div>
                <div
                  className={`brand-data-value${
                    row.todo ? ' brand-data-value--todo' : ''
                  }`}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
          <p className="brand-lead" style={{ marginTop: '1.5rem' }}>
            {SHEET.wholesale.note}
          </p>
        </div>
      </section>

      {/* ======================= 07 · REGULATORY ====================== */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">07</span>regulatory
            </h2>
            <span className="section-meta">eu compliance · in progress</span>
          </div>
          <div className="terminal-block">
            {SHEET.regulatory.body}
            {'\n\n'}
            {SHEET.regulatory.docNote}
          </div>
          {/* TODO: swap dashed placeholders for real certification badges */}
          <div className="brand-badges">
            {SHEET.regulatory.badges.map((badge, idx) => (
              <span key={idx} className="brand-badge">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 08 · CONTACT / NEXT ===================== */}
      <section className="brand-section" style={{ borderBottom: 'none' }}>
        <div className="brand-section-inner">
          <div className="section-header">
            <h2 className="section-title">
              <span className="num">08</span>contact / next steps
            </h2>
            <span className="section-meta">let&apos;s talk</span>
          </div>
          <p className="brand-lead">
            interested in carrying kiwi pop? reach the right person for your
            region, or send a wholesale inquiry and we&apos;ll get back fast.
          </p>
          <div className="contact-grid" style={{ marginTop: '2rem' }}>
            {SHEET.contacts.map((contact) => (
              <div key={contact.region}>
                <div className="contact-label">{contact.region}</div>
                {/* TODO: drop in the real email for {contact.person} */}
                <a
                  className="contact-link"
                  href={`mailto:${contact.email}`}
                  style={
                    contact.todo
                      ? { color: 'var(--sodium)' }
                      : undefined
                  }
                >
                  {contact.person} — {contact.email}
                </a>
              </div>
            ))}
          </div>
          <div className="brand-cta-row">
            <Link href={SHEET.cta.primaryHref} className="btn btn-primary">
              {SHEET.cta.primaryLabel} →
            </Link>
            <a href={SHEET.cta.secondaryHref} className="btn btn-secondary">
              {SHEET.cta.secondaryLabel}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
