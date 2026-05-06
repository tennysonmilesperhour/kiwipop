'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { formatCentsToUSD } from '@/lib/format';

interface BudgetLine {
  label: string;
  cents: number;
  detail?: string;
}

interface MilestoneItem {
  when: string;
  what: string;
}

interface ProjectionRow {
  metric: string;
  value: string;
}

interface PitchPlan {
  id: 'seed-5k' | 'seed-50k';
  raise: string;
  raiseCents: number;
  thesis: string;
  hypothesis: string;
  why: string;
  budget: BudgetLine[];
  milestones: MilestoneItem[];
  projections: ProjectionRow[];
  risks: string[];
  exits: string;
}

const PLAN_5K: PitchPlan = {
  id: 'seed-5k',
  raise: '$5,000',
  raiseCents: 500_000,
  thesis:
    "the first lollipop that makes you feel good while you party. like willy wonka actually made functional candy for adults.",
  hypothesis:
    "kiwi pop is a functional, sensual lollipop for the night scene. it cleans your palate, makes you feel relaxed and present, and tastes incredible. it's not a supplement pretending to be candy — it's candy that happens to support you.",
  why: "this is the smallest cheque that proves it: one hand-rolled batch, one festival, one online drop. enough to put kiwi pop in real mouths in real environments and watch what people do next. no co-packer minimums, no shopify partner fees, no commissioned art. a yes/no answer in 90 days and a real email list either way.",
  budget: [
    {
      label: 'first batch · 1,000 pops',
      cents: 100_000,
      detail: 'commercial-kitchen run · COGS ~$1.00/pop per costing.xlsx',
    },
    {
      label: 'wordmark + packaging',
      cents: 40_000,
      detail: 'fiverr top-tier or cara · one designer, one round',
    },
    {
      label: 'product photography',
      cents: 40_000,
      detail: 'natural-light DIY shoot · 8-12 frames',
    },
    {
      label: 'shopify basic + domain',
      cents: 49_300,
      detail: '$39/mo × 12 + $25 .co domain · path C from launch spec',
    },
    {
      label: 'product liability insurance',
      cents: 60_000,
      detail: '12-month policy · non-optional for consumables',
    },
    {
      label: 'legal · LLC / EIN / 1hr CPG counsel',
      cents: 45_000,
      detail: 'food/CPG lawyer for ingredient + label disclosures',
    },
    {
      label: 'klaviyo · welcome + abandoned cart flow',
      cents: 0,
      detail: 'free tier up to 250 contacts',
    },
    {
      label: 'one festival booth · regional event',
      cents: 50_000,
      detail: 'vendor fee + signage + travel',
    },
    {
      label: 'micro-influencer seeding · 10 @ $50',
      cents: 50_000,
      detail: 'send free pops, ask for one story · no obligation',
    },
    {
      label: 'paid ads test (meta + tiktok)',
      cents: 50_000,
      detail: '$15/day × 30 days · find the cheapest hook',
    },
    {
      label: 'buffer · wrappers + sticks + restock',
      cents: 15_700,
      detail: '~3% buffer · sticker labels, lollipop sticks, foil',
    },
  ],
  milestones: [
    {
      when: 'day 0–14',
      what: 'set up shopify · run first kitchen batch · photograph the pop · build klaviyo welcome flow',
    },
    {
      when: 'day 15–45',
      what: 'one regional festival booth · sell 200–300 pops in person · capture 500-name email list',
    },
    {
      when: 'day 46–90',
      what: 'online drop to email list · run paid ads test · ship 200–300 pops dtc · measure repeat',
    },
    {
      when: 'day 91+',
      what: 'have a yes/no answer on willingness-to-pay and a real cohort to measure repeat against',
    },
  ],
  projections: [
    { metric: 'units sold', value: '500 pops' },
    { metric: 'gross revenue (avg $5/pop)', value: '$2,500' },
    { metric: 'COGS at $1.00/pop', value: '$500' },
    { metric: 'gross profit', value: '$2,000 (80%)' },
    { metric: 'net cash burned', value: '~$3,000' },
    { metric: 'email list built', value: '500–1,000' },
    { metric: 'repeat-purchase signal', value: 'measurable in 90 days' },
  ],
  risks: [
    "biggest risk: formulation iteration. we're tuning the functional payload (theobromine + ginseng + b12 + electrolytes) for the cleanest possible lift without losing the sensory experience that drives early product love. actively running A/B taste tests batch over batch.",
    'one festival can flop on weather or foot traffic — no backup booth in this budget',
    "kitchen-batch COGS assumes the founder's own kitchen — labor not priced",
    "no money for second batch if the first sells out before paid ads have run",
  ],
  exits:
    'success at this check size: 500 pops sold, repeat ≥ 15%, an email list of 500+, and one short founder note ready to send to the next $50K cheque. the 18-month vision (1M pops, 200 retail doors, 6 festival activations) is a separate slide — this cheque is the receipt that says it can happen.',
};

const PLAN_50K: PitchPlan = {
  id: 'seed-50k',
  raise: '$50,000',
  raiseCents: 5_000_000,
  thesis:
    "the first lollipop that makes you feel good while you party. like willy wonka actually made functional candy for adults.",
  hypothesis:
    "gen z is drinking less. festivals are going wellness-curious. the night scene and the yoga scene already overlap. kiwi pop is the obvious product for where culture is already heading — where health and partying stop being opposites — and we're the magical, sensory entry point.",
  why: 'this is the gap between "founder side project" and "real CPG brand with proof of demand." it funds the move from kitchen to co-packer, the brand identity, and the festival circuit where word-of-mouth compounds in the product\'s native environment. the GHOST playbook: one limited-edition flavor drop per major festival, with collectible packaging.',
  budget: [
    {
      label: 'co-packer batch · 8,000 pops',
      cents: 700_000,
      detail: 'tier-3 ingredient pricing · $0.85/pop blended COGS',
    },
    {
      label: 'custom shopify theme · path A',
      cents: 1_000_000,
      detail: 'shopify partner build · keeps four-floor narrative + flavor orbs',
    },
    {
      label: 'wordmark by a real type designer',
      cents: 80_000,
      detail: 'working not working · 1 wordmark, 2 rounds',
    },
    {
      label: 'crew mascot illustration set',
      cents: 350_000,
      detail: 'kiwi · neko · lip · glitch · single illustrator, character-sheet',
    },
    {
      label: 'pro CPG product photography',
      cents: 400_000,
      detail: 'food/CPG specialist · hero, lifestyle, packaging, all 4 flavors',
    },
    {
      label: 'three festival activations',
      cents: 750_000,
      detail: '1 major (beyond wonderland-tier) + 2 regional · vendor + booth + travel',
    },
    {
      label: 'creator + influencer marketing',
      cents: 700_000,
      detail: '5 mid-tier @ $1k + 20 micro @ $100 · seeded packs included',
    },
    {
      label: 'shopify + apps · 12 months',
      cents: 250_000,
      detail: 'basic + klaviyo paid + recharge subs + judge.me reviews',
    },
    {
      label: 'multi-pack boxes + foil wrappers',
      cents: 300_000,
      detail: 'matte black 4-pack box · UV-spot-gloss limited drop foil',
    },
    {
      label: 'PR push · festival announce',
      cents: 250_000,
      detail: 'one boutique PR firm · 30-day push',
    },
    {
      label: 'insurance + legal',
      cents: 120_000,
      detail: 'product liability + CPG attorney for FDA labeling review',
    },
    {
      label: 'google workspace · 4 emails × 12mo',
      cents: 28_800,
      detail: 'hello / wholesale / events / press @ kiwipop.co',
    },
    {
      label: 'buffer · runway for second batch',
      cents: 71_200,
      detail: '~1.5% buffer for restock or unforeseen',
    },
  ],
  milestones: [
    {
      when: 'day 0–30',
      what: 'sign co-packer · brief illustrator + type designer · start shopify partner kickoff',
    },
    {
      when: 'day 31–60',
      what: 'theme live in staging · photography wrapped · mascots delivered · first co-packer batch in production',
    },
    {
      when: 'day 61–90',
      what: 'soft launch to founder list + early-list 500 · first festival activation · measure conversion',
    },
    {
      when: 'day 91–180',
      what: 'major festival activation · all 4 flavors live · open boutique-retail conversations (LA · NYC · austin)',
    },
    {
      when: 'day 181–365',
      what: 'subscription revenue stabilizes · second co-packer batch · case study deck for next raise',
    },
  ],
  projections: [
    { metric: 'units sold (12 mo)', value: '8,000–10,000 pops' },
    {
      metric: 'gross revenue mix',
      value: '$40K–$60K (dtc + festival + early wholesale)',
    },
    { metric: 'gross margin', value: '60–70%' },
    { metric: 'email list', value: '5,000–10,000' },
    { metric: 'subscription customers', value: '50–150 active' },
    { metric: 'wholesale partners', value: '1–3 boutique retailers' },
    {
      metric: 'next-raise readiness',
      value: 'one festival case study · revenue chart · email cohort retention',
    },
  ],
  risks: [
    "biggest risk: formulation at scale. we're refining the nootropic blend (theobromine + ginseng + magnesium + b12 + electrolytes) at copacker volumes without losing the sensory experience that drives early product love. actively iterating on every batch.",
    'co-packer minimum order quantities may push first batch above $7K',
    'festival activations are weather- and crowd-dependent · one bad weekend',
    "shopify partner build takes 4–8 weeks · slip eats into first festival window",
    "illustrator delivery on the crew mascots is the long-pole creative item",
  ],
  exits:
    'success at this check size: 10K pops shipped, 30% margin after all costs, an active subscription cohort, and a cleaner-than-pitch story for either a $250K seed or a wholesale-led growth path. the 18-month target is on the vision slide.',
};

const PLANS: PitchPlan[] = [PLAN_5K, PLAN_50K];

// ---------------------------------------------------------------------------
// Brand-positioning content (shared between both check sizes — the soul of
// the company doesn't change with the cheque). Sourced from the founder
// strategy README. All financial slides (budget, projections, raise) are
// kept per-plan above.
// ---------------------------------------------------------------------------

const MACRO_THESIS = {
  headline: 'health is inevitable.',
  framing: "it's more fun to be healthy.",
  bullets: [
    'gen z alcohol consumption is in measurable decline.',
    'sober-curious and wellness-curious movements are mainstream and growing.',
    'the night scene (clubs, festivals, afterparties) and the holistic-health scene (yoga, wellness, biohacking-adjacent) share more demographic overlap than people assume.',
    'people want to feel vividly alive. the same impulse drives both communities.',
    'current functional/wellness products are either sterile-clinical (biohacker aesthetic) or smug-ironic (cool-kid aesthetic). no one is doing enchantment, wonder, or sensuality.',
    'kiwi pop is the obvious next product for a generation already in motion away from alcohol and toward feel-good alternatives.',
  ],
};

const BRAND_POSITIONING = {
  promise:
    'we want to support you the way you already are, so you can have fun and feel good doing it sustainably.',
  promiseFraming:
    'intentionally subversive of the optimization industry, which sells inadequacy. kiwi pop sells permission and pleasure.',
  genre: 'cyberpop',
  genreFraming:
    "we're not just launching a product — we're naming a subculture genre. cyberpop: the magical, sensory, post-cynical scene where health and partying stop being opposites. kiwi pop is the first artifact of the genre.",
  weAre: [
    'sensual, magical, enchanted',
    'pre-cynical wonder · willy wonka, but real, not gimmicky',
    'genuinely supportive of who you already are',
    'built for the night scene · expandable to wellness-adjacent communities',
    'a category of one: the magical functional candy',
    'the founding artifact of a new subculture genre · cyberpop',
  ],
  weAreNot: [
    'not a biohacker optimization product',
    'not an "ultimate human" or "peak performance" play',
    'not ironic, detached, or edgelord-coded',
    'not a sterile wellness brand',
    'not a gimmick chocolate bar with a fantasy wrapper',
  ],
};

interface CompetitorRow {
  category: string;
  example: string;
  why_not: string;
}

const COMPETITIVE_LANDSCAPE: { intro: string; rows: CompetitorRow[]; punchline: string } = {
  intro:
    'no one is doing a functional party lollipop. our adjacent competitors fall into three categories — none of them serve the night scene as a sensory and social product.',
  rows: [
    {
      category: 'functional candy',
      example: 'sourse',
      why_not: 'clinical · daytime · supplement-coded',
    },
    {
      category: 'party recovery',
      example: 'liquid IV · liquid death',
      why_not: 'hydration and edge · not sensory or social',
    },
    {
      category: 'mints / gum',
      example: 'altoids · listerine · etc.',
      why_not: 'sugar-based · feeds oral bacteria · gross aftertaste · not sexy or social',
    },
  ],
  punchline: "that's the gap kiwi pop owns.",
};

const TARGET_CUSTOMER = {
  primary:
    'adults in the night scene — clubs, festivals, afterparties — who want a clean palate, a functional lift, and a sensual experience while partying.',
  expansion:
    'wellness-curious adults (yoga, holistic health) who already overlap with the night scene demographically. the coachella → erewhon distribution arc.',
  insight:
    'the venn diagram: night scene and wellness scene share more overlap than most brands recognize, because both communities are driven by the same impulse — the desire to feel vividly alive.',
};

const GO_TO_MARKET = {
  intro:
    'three-channel adaptive strategy with early traction in all three. festivals + clubs are the highest-conviction wedge for brand-building (native demonstration, word-of-mouth compounds). retail is the scaling channel after that.',
  channels: [
    {
      label: 'festivals',
      detail: 'primary brand-building wedge · native demonstration environment',
    },
    {
      label: 'clubs',
      detail: 'sensory and social product fit',
    },
    {
      label: 'retail / wholesale pre-orders',
      detail: 'already happening · scaling channel',
    },
  ],
  traction: 'approached by erewhon for product placement.',
};

interface FounderProfile {
  name: string;
  blurb: string;
  bullets: string[];
}

const FOUNDERS: FounderProfile[] = [
  {
    name: 'tennyson',
    blurb: 'operator · approachable, transparent, values-aligned',
    bullets: [
      'track record building first-of-their-kind functional products with non-sterile, non-biohacker branding',
      'approached by erewhon to carry products',
      'deep, authentic embedding in every level of the party scene',
      'long history of helping people return to baseline and beyond using food, functional nutrition, and case-by-case nootropic blends — near-perfect track record',
    ],
  },
  {
    name: 'kiwi',
    blurb: "creator · cutesy queer party baddie with native scene credibility",
    bullets: [
      'creator of the original product · built from a "i wish i had this" moment',
      'exceptional on-camera energy and genuine, continuous excitement that translates to content',
      'connected to models, photographers, and curators in event spaces',
      'lives the customer; the marketing will never feel like marketing',
    ],
  },
];

const FOUNDER_DUO_NOTE =
  'the two founders together are uniquely positioned. anyone else attempting a sensual, magical functional party lollipop would feel like they were cosplaying it. tennyson and kiwi are documenting their actual lives — the product is downstream of who they already are. the brand voice will never feel forced. the marketing will never feel like marketing. the community will form around them because it already has.';

const VISION_18_MONTHS = {
  framing:
    "the 18-month target — credible numbers we'll be measured against. global distribution is a year-3 vision, not on this slide.",
  bullets: [
    '1,000,000 lollipops sold',
    '200 retail locations',
    '6 festival activations',
    'continued product line expansion · functional cotton candy and other formats that extend the "functional partying + palate cleansing" thesis',
  ],
};

type ItemKind = 'budget' | 'milestone';
type Status = 'todo' | 'in_progress' | 'done' | 'blocked';

interface ProgressRow {
  plan_id: string;
  item_kind: ItemKind;
  item_key: string;
  status: Status;
  checked: boolean;
}

function progressKey(plan: string, kind: ItemKind, key: string): string {
  return `${plan}::${kind}::${key}`;
}

const STATUS_LABEL: Record<Status, string> = {
  todo: 'todo',
  in_progress: 'in progress',
  done: 'done',
  blocked: 'blocked',
};

const STATUS_COLOR: Record<Status, string> = {
  todo: 'var(--bone)',
  in_progress: 'var(--sodium, #f5ff3d)',
  done: 'var(--lime, #a8ff3c)',
  blocked: 'var(--magenta, #ff2d8a)',
};

export default function PitchPage() {
  const [planId, setPlanId] = useState<PitchPlan['id']>('seed-5k');
  const plan = PLANS.find((p) => p.id === planId)!;

  const totalCents = plan.budget.reduce((sum, l) => sum + l.cents, 0);

  const [progress, setProgress] = useState<Map<string, ProgressRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pitch-progress');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'failed to load progress');
      const rows = (json.rows ?? []) as ProgressRow[];
      const map = new Map<string, ProgressRow>();
      for (const r of rows) {
        map.set(progressKey(r.plan_id, r.item_kind, r.item_key), r);
      }
      setProgress(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateRow = async (
    kind: ItemKind,
    itemKey: string,
    patch: { checked?: boolean; status?: Status },
  ) => {
    const compositeKey = progressKey(planId, kind, itemKey);
    setPendingKey(compositeKey);

    // Optimistic update
    const previous = progress.get(compositeKey);
    const next: ProgressRow = {
      plan_id: planId,
      item_kind: kind,
      item_key: itemKey,
      status: patch.status ?? previous?.status ?? 'todo',
      checked: patch.checked ?? previous?.checked ?? false,
    };
    const optimistic = new Map(progress);
    optimistic.set(compositeKey, next);
    setProgress(optimistic);

    try {
      const res = await fetch('/api/admin/pitch-progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          item_kind: kind,
          item_key: itemKey,
          ...patch,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'save failed');
      }
    } catch (err) {
      // Rollback
      const rolled = new Map(progress);
      if (previous) rolled.set(compositeKey, previous);
      else rolled.delete(compositeKey);
      setProgress(rolled);
      setError(err instanceof Error ? err.message : 'save failed');
    } finally {
      setPendingKey(null);
    }
  };

  const budgetProgress = useMemo(() => {
    const checked = plan.budget.filter((b) => {
      const row = progress.get(progressKey(plan.id, 'budget', b.label));
      return row?.checked === true;
    });
    return { checked: checked.length, total: plan.budget.length };
  }, [plan, progress]);

  const milestoneProgress = useMemo(() => {
    const done = plan.milestones.filter((m) => {
      const row = progress.get(progressKey(plan.id, 'milestone', m.when));
      return row?.status === 'done';
    });
    return { done: done.length, total: plan.milestones.length };
  }, [plan, progress]);

  return (
    <AdminLayout>
      <div className="pitch-page">
        <div className="pitch-header">
          <p className="stat-label">// admin · pitch deck</p>
          <h1>pitch.</h1>
          <p className="pitch-subtitle">
            two budgets, two outcomes. pick the floor.
          </p>
          {!loading && !error ? (
            <p
              className="stat-label"
              style={{
                marginTop: '0.5rem',
                fontSize: 11,
                color: 'var(--bone)',
              }}
            >
              progress · budget {budgetProgress.checked}/{budgetProgress.total}{' '}
              · milestones {milestoneProgress.done}/{milestoneProgress.total}{' '}
              done
            </p>
          ) : null}
          {loading ? (
            <p className="stat-label" style={{ marginTop: '0.5rem', fontSize: 11 }}>
              loading progress…
            </p>
          ) : null}
          {error ? (
            <div
              className="alert alert-error"
              style={{ marginTop: '0.5rem', fontSize: 12 }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="pitch-tabs" role="tablist">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={planId === p.id}
              onClick={() => setPlanId(p.id)}
              className={`pitch-tab${planId === p.id ? ' pitch-tab--active' : ''}`}
            >
              <span className="pitch-tab-amount">{p.raise}</span>
              <span className="pitch-tab-label">
                {p.id === 'seed-5k' ? 'prove it · 90 days' : 'launch · 12 months'}
              </span>
            </button>
          ))}
        </div>

        <section className="pitch-slide pitch-slide--thesis">
          <div className="pitch-slide-tag">/01 thesis</div>
          <p className="pitch-thesis">{plan.thesis}</p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/02 hypothesis</div>
          <p className="pitch-prose">{plan.hypothesis}</p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/03 macro thesis · health is inevitable</div>
          <p className="pitch-thesis" style={{ marginBottom: '0.6rem' }}>
            {MACRO_THESIS.headline}
          </p>
          <p
            className="pitch-prose"
            style={{
              fontStyle: 'italic',
              color: 'var(--lime, #a8ff3c)',
              marginBottom: '1.4rem',
            }}
          >
            {MACRO_THESIS.framing}
          </p>
          <ul className="pitch-risks">
            {MACRO_THESIS.bullets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/04 brand positioning</div>
          <p
            className="pitch-thesis"
            style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: '0.4rem' }}
          >
            {BRAND_POSITIONING.promise}
          </p>
          <p
            className="pitch-prose"
            style={{
              opacity: 0.8,
              marginBottom: '1.6rem',
              fontStyle: 'italic',
            }}
          >
            {BRAND_POSITIONING.promiseFraming}
          </p>

          <div
            style={{
              padding: '1rem 1.2rem',
              marginBottom: '1.6rem',
              border: '1.5px solid var(--lime, #a8ff3c)',
              background:
                'linear-gradient(135deg, rgba(168, 255, 60, 0.08) 0%, rgba(255, 26, 140, 0.08) 100%)',
              borderRadius: 4,
            }}
          >
            <p
              className="stat-label"
              style={{
                marginBottom: '0.4rem',
                color: 'var(--lime, #a8ff3c)',
                letterSpacing: '0.22em',
              }}
            >
              // the genre we&apos;re making
            </p>
            <p
              className="pitch-thesis"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
                marginBottom: '0.6rem',
                background:
                  'linear-gradient(95deg, #a8ff3c 0%, #f5ff3d 50%, #ff1a8c 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {BRAND_POSITIONING.genre}.
            </p>
            <p className="pitch-prose" style={{ margin: 0 }}>
              {BRAND_POSITIONING.genreFraming}
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.2rem',
            }}
          >
            <div>
              <p
                className="stat-label"
                style={{ marginBottom: '0.6rem', color: 'var(--lime, #a8ff3c)' }}
              >
                // what we are
              </p>
              <ul className="pitch-risks">
                {BRAND_POSITIONING.weAre.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="stat-label"
                style={{ marginBottom: '0.6rem', color: 'var(--magenta, #ff2d8a)' }}
              >
                // what we are NOT
              </p>
              <ul className="pitch-risks">
                {BRAND_POSITIONING.weAreNot.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/05 competitive landscape</div>
          <p className="pitch-prose" style={{ marginBottom: '1.4rem' }}>
            {COMPETITIVE_LANDSCAPE.intro}
          </p>
          <table className="table pitch-table">
            <thead>
              <tr>
                <th>category</th>
                <th>example</th>
                <th>why it doesn&apos;t serve the night scene</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITIVE_LANDSCAPE.rows.map((row) => (
                <tr key={row.category}>
                  <td className="pitch-budget-label">{row.category}</td>
                  <td className="pitch-budget-detail">{row.example}</td>
                  <td className="pitch-budget-detail">{row.why_not}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            className="pitch-thesis"
            style={{
              fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)',
              marginTop: '1.4rem',
              color: 'var(--lime, #a8ff3c)',
            }}
          >
            {COMPETITIVE_LANDSCAPE.punchline}
          </p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/06 target customer</div>
          <p
            className="stat-label"
            style={{ marginBottom: '0.4rem', color: 'var(--lime, #a8ff3c)' }}
          >
            // primary
          </p>
          <p className="pitch-prose" style={{ marginBottom: '1.4rem' }}>
            {TARGET_CUSTOMER.primary}
          </p>
          <p
            className="stat-label"
            style={{ marginBottom: '0.4rem', color: 'var(--cyan, #00f0ff)' }}
          >
            // expansion
          </p>
          <p className="pitch-prose" style={{ marginBottom: '1.4rem' }}>
            {TARGET_CUSTOMER.expansion}
          </p>
          <p
            className="pitch-prose"
            style={{
              fontStyle: 'italic',
              opacity: 0.85,
              borderLeft: '2px solid var(--lime, #a8ff3c)',
              paddingLeft: '1rem',
            }}
          >
            {TARGET_CUSTOMER.insight}
          </p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/07 go-to-market</div>
          <p className="pitch-prose" style={{ marginBottom: '1.4rem' }}>
            {GO_TO_MARKET.intro}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.4rem',
            }}
          >
            {GO_TO_MARKET.channels.map((ch) => (
              <div
                key={ch.label}
                className="pitch-projection-card"
                style={{ padding: '1rem 1.2rem' }}
              >
                <div className="pitch-projection-metric">{ch.label}</div>
                <div
                  className="pitch-projection-value"
                  style={{ fontSize: '0.95rem' }}
                >
                  {ch.detail}
                </div>
              </div>
            ))}
          </div>
          <p
            className="pitch-prose"
            style={{
              color: 'var(--lime, #a8ff3c)',
              fontWeight: 500,
            }}
          >
            // traction · {GO_TO_MARKET.traction}
          </p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/08 founders</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.6rem',
              marginBottom: '1.4rem',
            }}
          >
            {FOUNDERS.map((f) => (
              <div key={f.name}>
                <p
                  className="pitch-thesis"
                  style={{
                    fontSize: 'clamp(1.4rem, 2.4vw, 1.8rem)',
                    marginBottom: '0.2rem',
                  }}
                >
                  {f.name}
                </p>
                <p
                  className="stat-label"
                  style={{ marginBottom: '0.8rem', color: 'var(--bone)' }}
                >
                  // {f.blurb}
                </p>
                <ul className="pitch-risks">
                  {f.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p
            className="pitch-prose"
            style={{
              fontStyle: 'italic',
              opacity: 0.9,
              borderLeft: '2px solid var(--lime, #a8ff3c)',
              paddingLeft: '1rem',
            }}
          >
            {FOUNDER_DUO_NOTE}
          </p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/09 use of funds</div>
          <table className="table pitch-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>✓</th>
                <th>line</th>
                <th>amount</th>
                <th>%</th>
                <th>detail</th>
              </tr>
            </thead>
            <tbody>
              {plan.budget.map((line) => {
                const pct =
                  totalCents > 0 ? (line.cents / totalCents) * 100 : 0;
                const compositeKey = progressKey(plan.id, 'budget', line.label);
                const row = progress.get(compositeKey);
                const checked = row?.checked ?? false;
                const busy = pendingKey === compositeKey;
                return (
                  <tr
                    key={line.label}
                    style={{
                      opacity: checked ? 0.55 : 1,
                      textDecoration: checked ? 'line-through' : 'none',
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          updateRow('budget', line.label, {
                            checked: e.target.checked,
                          })
                        }
                        disabled={busy}
                        aria-label={`mark ${line.label} done`}
                        style={{
                          accentColor: 'var(--lime, #a8ff3c)',
                          cursor: busy ? 'wait' : 'pointer',
                          width: 18,
                          height: 18,
                        }}
                      />
                    </td>
                    <td className="pitch-budget-label">{line.label}</td>
                    <td className="pitch-budget-amount">
                      {formatCentsToUSD(line.cents)}
                    </td>
                    <td className="pitch-budget-pct">
                      <span
                        className="pitch-bar"
                        style={{ width: `${pct.toFixed(1)}%` }}
                        aria-hidden="true"
                      />
                      <span className="pitch-bar-pct">{pct.toFixed(0)}%</span>
                    </td>
                    <td className="pitch-budget-detail">
                      {line.detail ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td>
                  <strong>total</strong>
                </td>
                <td>
                  <strong>{formatCentsToUSD(totalCents)}</strong>
                </td>
                <td>
                  <strong>
                    {totalCents === plan.raiseCents
                      ? 'fully allocated'
                      : `Δ ${formatCentsToUSD(plan.raiseCents - totalCents)}`}
                  </strong>
                </td>
                <td>vs raise of {plan.raise}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/10 milestones</div>
          <ol className="pitch-timeline">
            {plan.milestones.map((m) => {
              const compositeKey = progressKey(plan.id, 'milestone', m.when);
              const row = progress.get(compositeKey);
              const status: Status = row?.status ?? 'todo';
              const busy = pendingKey === compositeKey;
              return (
                <li
                  key={m.when}
                  style={{
                    opacity: status === 'done' ? 0.7 : 1,
                  }}
                >
                  <span className="pitch-timeline-when">{m.when}</span>
                  <span
                    className="pitch-timeline-what"
                    style={{
                      textDecoration: status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {m.what}
                  </span>
                  <select
                    value={status}
                    disabled={busy}
                    onChange={(e) =>
                      updateRow('milestone', m.when, {
                        status: e.target.value as Status,
                      })
                    }
                    aria-label={`status for ${m.when}`}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      background: 'rgba(0,0,0,0.45)',
                      color: STATUS_COLOR[status],
                      border: `1px solid ${STATUS_COLOR[status]}`,
                      cursor: busy ? 'wait' : 'pointer',
                    }}
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/11 projections</div>
          <div className="pitch-projection-grid">
            {plan.projections.map((p) => (
              <div className="pitch-projection-card" key={p.metric}>
                <div className="pitch-projection-metric">{p.metric}</div>
                <div className="pitch-projection-value">{p.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/12 risks</div>
          <ul className="pitch-risks">
            {plan.risks.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/13 18-month vision</div>
          <p className="pitch-prose" style={{ marginBottom: '1.4rem' }}>
            {VISION_18_MONTHS.framing}
          </p>
          <div
            className="pitch-projection-grid"
            style={{ gap: '1rem' }}
          >
            {VISION_18_MONTHS.bullets.map((b, idx) => (
              <div key={idx} className="pitch-projection-card">
                <div
                  className="pitch-projection-value"
                  style={{ fontSize: 'clamp(1rem, 1.8vw, 1.3rem)' }}
                >
                  {b}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pitch-slide pitch-slide--exit">
          <div className="pitch-slide-tag">/14 success at this check size</div>
          <p className="pitch-thesis pitch-thesis--exit">{plan.exits}</p>
        </section>

        <section className="pitch-foot">
          <div className="pitch-foot-meta">
            <div>kiwi pop · refreshing club lolli</div>
            <div>founder · tennyson taggart · thekiwipop@gmail.com</div>
            <div>doc · pitch deck v1 · {new Date().toISOString().slice(0, 10)}</div>
          </div>
          <div className="pitch-foot-stamp">
            // {plan.id === 'seed-5k' ? 'prove it' : 'launch it'}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
