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
  note?: string; // actuals annotation — does not affect DB key
}

interface ProjectionRow {
  metric: string;
  value: string;
  actual?: string;
  actualStatus?: 'ahead' | 'on-track' | 'behind';
}

interface ActualsMetric {
  metric: string;
  value: string;
  color?: 'lime' | 'cyan' | 'magenta';
}

interface PitchPlan {
  id: 'seed-5k' | 'seed-25k';
  raise: string;
  raiseCents: number;
  thesis: string;
  hypothesis: string;
  why: string;
  budget: BudgetLine[];
  milestones: MilestoneItem[];
  projections: ProjectionRow[];
  risks: string[];
}

const PLAN_5K: PitchPlan = {
  id: 'seed-5k',
  raise: '$5,000',
  raiseCents: 500_000,
  thesis:
    "the first lollipop that makes you feel good while you party. like willy wonka actually made functional candy for adults.",
  hypothesis:
    "kiwi pop is a functional, sensual lollipop for the night scene. it cleans your palate, makes you feel relaxed and present, and tastes incredible. it's not a supplement pretending to be candy — it's candy that happens to support you.",
  why: "the first $5K is already committed. it's earmarked for ingredient sourcing across all 4 flavors, custom packaging, and fulfilling the $1,000 of preorders already on the books. the $200 amazon r&d batch validated the core recipe in real party conditions — this cheque is what turns one proven flavor into a sellable line of four, ships the preorders, and generates the data we need to size the next move. the storefront, admin, and ops stack already exist (ai-coded, no engineering hire) and the LLC/EIN is filed — none of this raise pays for infrastructure.",
  budget: [
    {
      label: 'r&d · 3 new flavor recipes',
      cents: 50_000,
      detail: 'round out the line past the proven hero · sourced ingredients for repeated taste tests',
    },
    {
      label: 'production batch · 4-flavor ingredients · ~1,500 pops',
      cents: 150_000,
      detail: 'raw materials across all 4 flavors at ~$1.00/pop COGS',
    },
    {
      label: 'custom packaging · printed foil wrappers + labels + 4-flavor sampler box',
      cents: 120_000,
      detail: 'brand identity carrier · one designer round (ai-iterated, human polish)',
    },
    {
      label: 'lollipop sticks + silicone molds + small kitchen tools',
      cents: 30_000,
      detail: 'consumables and equipment for repeatable batches',
    },
    {
      label: 'commercial kitchen time · batch days',
      cents: 40_000,
      detail: 'licensed kitchen rental for the first production run',
    },
    {
      label: 'fulfillment · ship $1,000 of preorders',
      cents: 25_000,
      detail: 'mailers, padded inserts, postage for orders already on the books',
    },
    {
      label: 'legal · LLC + EIN (filed)',
      cents: 5_900,
      detail: 'self-serve filing · CPG counsel deferred until first real regulatory question',
    },
    {
      label: 'regional pop-up / event booth',
      cents: 40_000,
      detail: 'one local event · vendor fee + signage + travel · IRL traction signal',
    },
    {
      label: 'paid ads test · meta + tiktok',
      cents: 30_000,
      detail: '$10/day × 30 days · find the cheapest hook · ai-generated creative variants',
    },
    {
      label: 'buffer · restock + unforeseen',
      cents: 9_100,
      detail: 'thin buffer — relying on ai-coded ops, donated photography, and sweat equity',
    },
  ],
  milestones: [
    {
      when: 'day 0–14',
      what: 'lock the 3 new flavor recipes · order ingredients + packaging · brief the volunteer photographer on hero shots',
    },
    {
      when: 'day 15–45',
      what: 'commercial-kitchen batch · fulfill the $1,000 of preorders · free product photo shoot wrapped · all 4 flavors live on the storefront',
    },
    {
      when: 'day 46–90',
      what: 'regional pop-up booth · paid ads + email drop to the 500-name list · measure repeat across flavors',
      note: '// at risk · email list is 47 / 500 needed — list build must accelerate before this window opens',
    },
    {
      when: 'day 91+',
      what: 'yes/no answer on willingness-to-pay across all 4 flavors · a real cohort to measure repeat against · revenue from sold pops funds the next batch',
    },
  ],
  projections: [
    { metric: 'units produced', value: '~1,500 pops (4 flavors)' },
    {
      metric: 'units sold (90 days)',
      value: '800–1,200 incl. preorders',
      actual: '56 items/SKUs in 28d · run rate ~72/90d vs 800 low-end · -91% off pace',
      actualStatus: 'behind',
    },
    {
      metric: 'gross revenue (avg $5/pop)',
      value: '$4,000–6,000',
      actual: '$1,084 in 28d · AOV $29.29/order · within range of low-end pace',
      actualStatus: 'on-track',
    },
    { metric: 'COGS at $1.00/pop', value: '~$1,500' },
    {
      metric: 'gross profit',
      value: '$2,500–4,500',
      actual: 'unit volume too low to confirm range · revenue run rate near floor',
      actualStatus: 'behind',
    },
    { metric: 'net cash position', value: 'break-even to modestly positive' },
    {
      metric: 'email list built',
      value: '500–1,000',
      actual: '47 total · 1.7 signups/day vs 5.6/day needed · -91% off pace',
      actualStatus: 'behind',
    },
    {
      metric: 'repeat-purchase signal',
      value: 'measurable across 4 flavors in 90 days',
      actual: '4 of 32 buyers reordered (12.5%) · signal is live early',
      actualStatus: 'on-track',
    },
  ],
  risks: [
    "biggest risk: formulation iteration. we're tuning the functional payload (theobromine + ginseng + b12 + electrolytes) for the cleanest possible lift without losing the sensory experience that drives early product love. actively running A/B taste tests batch over batch.",
    'one regional event can flop on weather or foot traffic — no backup booth in this budget',
    'kitchen-batch labor is founder sweat equity — not priced into COGS',
    'production capacity · 1,500 pops is a single-kitchen run · scaling past that needs co-packer paperwork that costs time, not money',
  ],
};

const PLAN_25K: PitchPlan = {
  id: 'seed-25k',
  raise: '$25,000',
  raiseCents: 2_500_000,
  thesis:
    "the first lollipop that makes you feel good while you party. like willy wonka actually made functional candy for adults.",
  hypothesis:
    "gen z is drinking less. festivals are going wellness-curious. the night scene and the yoga scene already overlap. kiwi pop is the obvious product for where culture is already heading — where health and partying stop being opposites — and we're the magical, sensory entry point.",
  why: "this is the cheque that turns proof into a real brand presence. we don't need it for a shopify theme, a custom illustrator, or a pro photographer — we already have those (ai-coded storefront, ai-iterated brand, a volunteer photographer). this cheque funds the move from kitchen to co-packer, three festival activations, and the creator + paid-ads loop that converts attention into a list and a list into repeat orders. the GHOST playbook: one limited-edition flavor drop per major festival, with collectible packaging.",
  budget: [
    {
      label: 'co-packer batch · 8,000 pops',
      cents: 700_000,
      detail: 'tier-3 ingredient pricing · $0.85/pop blended COGS',
    },
    {
      label: 'custom packaging · 4 flavors + sampler box + festival drop foil',
      cents: 300_000,
      detail: 'matte black 4-pack box · UV-spot-gloss limited drop foil',
    },
    {
      label: 'brand identity polish · ai-iterated + 1 designer round',
      cents: 80_000,
      detail: 'wordmark + character set refined with ai, finished by a human designer',
    },
    {
      label: 'product photography · founder content + 1 small lead shoot',
      cents: 50_000,
      detail: 'volunteer photographer covers most · paid mini-shoot for hero frames',
    },
    {
      label: 'three festival activations',
      cents: 600_000,
      detail: '1 major + 2 regional · vendor + booth + travel',
    },
    {
      label: 'creator + influencer seeding',
      cents: 300_000,
      detail: '3 mid-tier @ $750 + 15 micro @ $50 · seeded packs included',
    },
    {
      label: 'paid ads · meta + tiktok structured tests',
      cents: 150_000,
      detail: '$50/day × 30 days · ai-generated creative variants · find the cheapest hook',
    },
    {
      label: 'PR push · 30-day festival announce window',
      cents: 100_000,
      detail: 'one boutique PR firm · short, scene-targeted push',
    },
    {
      label: 'product liability insurance · 12 months',
      cents: 60_000,
      detail: 'once volume warrants — required for festival vendor permits',
    },
    {
      label: 'legal · CPG attorney for FDA labeling review',
      cents: 30_000,
      detail: 'one-time review of ingredient + label disclosures at scale',
    },
    {
      label: 'fulfillment + ops · mailers, restock consumables, sticks, foil',
      cents: 70_000,
      detail: 'shipping materials + replenishment for the production run',
    },
    {
      label: 'buffer · restock + unforeseen',
      cents: 60_000,
      detail: '~2.4% buffer · ai-coded ops and a thin team keep overhead low',
    },
  ],
  milestones: [
    {
      when: 'day 0–30',
      what: 'sign co-packer · finalize brand polish round · packaging to print · storefront already live · brief creators',
    },
    {
      when: 'day 31–60',
      what: 'first co-packer batch in production · all 4 flavors packaged · creator content rolling · ads in test',
    },
    {
      when: 'day 61–90',
      what: 'soft launch to early list · first festival activation · paid ads optimizing on real conversion data',
    },
    {
      when: 'day 91–180',
      what: 'major festival activation · open boutique-retail conversations (LA · NYC · austin) · subscription cohort forming',
    },
    {
      when: 'day 181–365',
      what: 'stable repeat cohort · second co-packer batch funded by revenue · case study deck for next raise',
    },
  ],
  projections: [
    {
      metric: 'units sold (12 mo)',
      value: '6,000–8,000 pops',
      actual: '56 items/SKUs in 28d · annualized ~730 · -88% vs low end',
      actualStatus: 'behind',
    },
    {
      metric: 'gross revenue mix',
      value: '$30K–$45K (dtc + festival + early wholesale)',
      actual: '$1,084 in 28d · annualized ~$14K · AOV $29.29 is a healthy signal',
      actualStatus: 'behind',
    },
    { metric: 'gross margin', value: '60–70%' },
    {
      metric: 'email list',
      value: '3,000–7,000',
      actual: '47 total · pre-festival · active list build not yet started',
      actualStatus: 'behind',
    },
    {
      metric: 'subscription customers',
      value: '50–120 active',
      actual: 'not launched · 4 repeat buyers as leading indicator',
      actualStatus: 'behind',
    },
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
    'paid ad efficiency · meta/tiktok creative typically needs 3–5 rounds before a hook lands · budget assumes that iteration',
    'founder bandwidth · two operators across product, ops, content, and ai engineering · time is the real constraint, not capital',
  ],
};

// ---------------------------------------------------------------------------
// Live actuals — 28-day read as of 2026-05-27
// All paid orders in the DB fall within this window (store is at earliest-stage).
// ---------------------------------------------------------------------------
const LIVE_ACTUALS: {
  asOf: string;
  windowDays: number;
  metrics: ActualsMetric[];
  note: string;
} = {
  asOf: '2026-05-27',
  windowDays: 28,
  metrics: [
    { metric: 'paid orders (28d)', value: '37', color: 'cyan' },
    { metric: 'gross revenue (28d)', value: '$1,084', color: 'lime' },
    { metric: 'avg order value', value: '$29.29 / order', color: 'lime' },
    { metric: 'items/SKUs sold (28d)', value: '56 across 10 SKUs', color: 'cyan' },
    { metric: 'unique buyers (28d)', value: '32', color: 'cyan' },
    { metric: 'repeat buyers (all time)', value: '4 of 32 · 12.5%', color: 'lime' },
    { metric: 'email list (total)', value: '47', color: 'magenta' },
  ],
  note: "all paid orders fall within the last 28 days — the store is at earliest-stage. revenue run rate (~$1.1K/28d) is within striking distance of the $5K plan low-end pace, and AOV of $29.29 beats the $5/pop assumption (pack pricing is working). unit volume and email list are both well behind pace and need active attention before the day 46–90 pop-up window.",
};

const PLANS: PitchPlan[] = [PLAN_5K, PLAN_25K];

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
    'wellness-curious adults (yoga, holistic health) who already overlap with the night scene demographically. the festival → wellness-retail distribution arc.',
  insight:
    'the venn diagram: night scene and wellness scene share more overlap than most brands recognize, because both communities are driven by the same impulse — the desire to feel vividly alive.',
};

const GO_TO_MARKET = {
  intro:
    'three-channel adaptive strategy. festivals + clubs are the highest-conviction wedge for brand-building (native demonstration, word-of-mouth compounds). retail is the scaling channel after that.',
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
      label: 'dtc + early wholesale',
      detail: 'storefront live · preorders open · boutique conversations forming',
    },
  ],
};

interface TractionItem {
  headline: string;
  detail: string;
  color?: 'lime' | 'cyan' | 'magenta';
}

const TRACTION: { intro: string; items: TractionItem[]; punchline: string } = {
  intro:
    "the deck doesn't lead with projections — it leads with what's already true. every line below is a receipt, not a forecast.",
  items: [
    {
      headline: '$1,000 in preorders',
      detail: 'real cash captured before any paid marketing · friend network + early storefront only',
      color: 'lime',
    },
    {
      headline: '$200 r&d batch — validated',
      detail: 'amazon-sourced ingredients · the recipe was tested in real party conditions and the response was unambiguously positive',
      color: 'lime',
    },
    {
      headline: '$5,000 first cheque · committed',
      detail: 'outside backer · fully allocated to ingredients, packaging, and shipping the preorders',
      color: 'lime',
    },
    {
      headline: 'storefront + admin + ops stack · live',
      detail: 'custom-coded with ai · stripe, supabase, shipstation, klaviyo all wired up · zero engineering hire',
      color: 'cyan',
    },
    {
      headline: 'LLC + EIN · filed',
      detail: 'self-serve · $59 total · CPG counsel deferred until first real regulatory question',
      color: 'cyan',
    },
    {
      headline: 'capital efficiency is the moat',
      detail: 'what would cost a typical CPG founder $30K–$50K in agencies, designers, photographers, and dev shops, we ship for under $2K — and that delta compounds at every raise',
      color: 'magenta',
    },
  ],
  punchline:
    "we're not asking investors to fund a hypothesis. we're showing them what's already built, and asking them to fund the next 10x.",
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
      'deep, authentic embedding in every level of the party scene',
      'long history of helping people return to baseline and beyond using food, functional nutrition, and case-by-case nootropic blends',
      'ai-native operator · shipped the entire storefront, admin, and ops stack without an engineering hire',
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
                {p.id === 'seed-5k' ? 'prove it · 90 days' : 'scale · 12 months'}
              </span>
            </button>
          ))}
        </div>

        <section
          className="pitch-slide"
          style={{ borderLeft: '2px solid var(--cyan, #00f0ff)' }}
        >
          <div className="pitch-slide-tag">
            /00 live actuals · as of {LIVE_ACTUALS.asOf}
          </div>
          <p
            className="stat-label"
            style={{
              marginBottom: '1.2rem',
              color: 'var(--bone)',
              opacity: 0.7,
              letterSpacing: '0.18em',
            }}
          >
            // {LIVE_ACTUALS.windowDays}-day window · all transactions to date
          </p>
          <div
            className="pitch-projection-grid"
            style={{ marginBottom: '1.4rem' }}
          >
            {LIVE_ACTUALS.metrics.map((m) => {
              const accent =
                m.color === 'cyan'
                  ? 'var(--cyan, #00f0ff)'
                  : m.color === 'magenta'
                    ? 'var(--magenta, #ff2d8a)'
                    : 'var(--lime, #a8ff3c)';
              return (
                <div
                  key={m.metric}
                  className="pitch-projection-card"
                  style={{ borderLeft: `2px solid ${accent}` }}
                >
                  <div
                    className="pitch-projection-metric"
                    style={{ color: accent }}
                  >
                    {m.metric}
                  </div>
                  <div className="pitch-projection-value">{m.value}</div>
                </div>
              );
            })}
          </div>
          <p
            className="pitch-prose"
            style={{ fontStyle: 'italic', opacity: 0.8 }}
          >
            {LIVE_ACTUALS.note}
          </p>
        </section>

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
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/08 traction · what&apos;s already real</div>
          <p className="pitch-prose" style={{ marginBottom: '1.4rem' }}>
            {TRACTION.intro}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1.6rem',
            }}
          >
            {TRACTION.items.map((item) => {
              const accent =
                item.color === 'cyan'
                  ? 'var(--cyan, #00f0ff)'
                  : item.color === 'magenta'
                    ? 'var(--magenta, #ff2d8a)'
                    : 'var(--lime, #a8ff3c)';
              return (
                <div
                  key={item.headline}
                  className="pitch-projection-card"
                  style={{
                    padding: '1rem 1.2rem',
                    borderLeft: `2px solid ${accent}`,
                  }}
                >
                  <div
                    className="pitch-projection-metric"
                    style={{ color: accent, marginBottom: '0.4rem' }}
                  >
                    {item.headline}
                  </div>
                  <div
                    className="pitch-projection-value"
                    style={{ fontSize: '0.95rem', lineHeight: 1.5 }}
                  >
                    {item.detail}
                  </div>
                </div>
              );
            })}
          </div>
          <p
            className="pitch-thesis"
            style={{
              fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)',
              color: 'var(--lime, #a8ff3c)',
            }}
          >
            {TRACTION.punchline}
          </p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/09 founders</div>
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
          <div className="pitch-slide-tag">/10 use of funds</div>
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
          <div className="pitch-slide-tag">/11 milestones</div>
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
                    {m.note ? (
                      <span
                        style={{
                          display: 'block',
                          marginTop: '0.3rem',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--mono)',
                          color: 'var(--magenta, #ff2d8a)',
                          letterSpacing: '0.12em',
                          opacity: 0.9,
                        }}
                      >
                        {m.note}
                      </span>
                    ) : null}
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
          <div className="pitch-slide-tag">/12 projections</div>
          <div className="pitch-projection-grid">
            {plan.projections.map((p) => {
              const statusColor =
                p.actualStatus === 'ahead'
                  ? 'var(--lime, #a8ff3c)'
                  : p.actualStatus === 'on-track'
                    ? 'var(--cyan, #00f0ff)'
                    : p.actualStatus === 'behind'
                      ? 'var(--magenta, #ff2d8a)'
                      : undefined;
              return (
                <div
                  className="pitch-projection-card"
                  key={p.metric}
                  style={statusColor ? { borderLeft: `2px solid ${statusColor}` } : {}}
                >
                  <div className="pitch-projection-metric">{p.metric}</div>
                  <div className="pitch-projection-value">{p.value}</div>
                  {p.actual ? (
                    <div
                      style={{
                        marginTop: '0.6rem',
                        paddingTop: '0.6rem',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.82rem',
                        fontFamily: 'var(--mono)',
                        color: statusColor ?? 'var(--bone)',
                        lineHeight: 1.55,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          opacity: 0.5,
                          fontSize: '0.7rem',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          marginBottom: '0.2rem',
                        }}
                      >
                        // actual · 28d
                      </span>
                      {p.actual}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/13 risks</div>
          <ul className="pitch-risks">
            {plan.risks.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/14 18-month vision</div>
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

        <section className="pitch-foot">
          <div className="pitch-foot-meta">
            <div>kiwi pop · lollipop-shaped party supplements</div>
            <div>founder · tennyson taggart · thekiwipop@gmail.com</div>
          </div>
          <div className="pitch-foot-stamp">
            // {plan.id === 'seed-5k' ? 'prove it' : 'scale it'}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
