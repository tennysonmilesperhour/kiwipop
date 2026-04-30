'use client';

import { useState } from 'react';
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
  thesis: 'prove someone will pay $5 for a refreshing club lolli — in 90 days, in one city.',
  hypothesis:
    'with a hand-made first batch, one festival booth, and a low-budget online drop, kiwi pop can sell 500 pops and recover 40% of cash in the first quarter.',
  why: 'this is a "is anyone willing to pay?" budget. it produces a yes/no in 90 days and a real email list either way. no co-packer minimums, no shopify partner fees, no commissioned art.',
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
      detail: 'food/CPG lawyer for kava-state disclosures',
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
    'one festival can flop on weather or foot traffic — no backup booth in this budget',
    'kitchen-batch COGS assumes the founder\'s own kitchen — labor not priced',
    'no money for second batch if the first sells out before paid ads have run',
    'kava-containing products are regulated in some states · 1hr legal review may flag formula',
  ],
  exits:
    'success looks like: 500 pops sold, repeat ≥ 15%, an email list of 500+, and one short founder note ready to send to the next $50K check.',
};

const PLAN_50K: PitchPlan = {
  id: 'seed-50k',
  raise: '$50,000',
  raiseCents: 5_000_000,
  thesis:
    'launch kiwi pop as a real CPG brand · custom theme · co-packer batch · three festival activations · 8K–10K pops shipped year one.',
  hypothesis:
    "with professional theme, photography, and the festival circuit, kiwi pop hits $40K–$60K dtc revenue in 12 months and lands the first boutique-retail conversation.",
  why: 'this is the gap between "founder side project" and "real CPG brand with proof of demand." it funds the move from kitchen to co-packer, gets the brand its visual identity from a single illustrator, and buys the festival circuit that powers everything that follows (the GHOST playbook).',
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
    'co-packer minimum order quantities may push first batch above $7K',
    'festival activations are weather- and crowd-dependent · one bad weekend',
    'FDA labeling review may require formula tweaks (kava is restricted in some states)',
    'shopify partner build takes 4–8 weeks · slip eats into first festival window',
    'illustrator delivery on the crew is the long-pole creative item',
  ],
  exits:
    'success looks like: 10K pops shipped, 30% margin after all costs, an active subscription cohort, and a cleaner-than-pitch story for either a $250K seed or a wholesale-led growth path.',
};

const PLANS: PitchPlan[] = [PLAN_5K, PLAN_50K];

export default function PitchPage() {
  const [planId, setPlanId] = useState<PitchPlan['id']>('seed-5k');
  const plan = PLANS.find((p) => p.id === planId)!;

  const totalCents = plan.budget.reduce((sum, l) => sum + l.cents, 0);

  return (
    <AdminLayout>
      <div className="pitch-page">
        <div className="pitch-header">
          <p className="stat-label">// admin · pitch deck</p>
          <h1>pitch.</h1>
          <p className="pitch-subtitle">
            two budgets, two outcomes. pick the floor.
          </p>
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
          <div className="pitch-slide-tag">/03 why this size of check</div>
          <p className="pitch-prose">{plan.why}</p>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/04 use of funds</div>
          <table className="table pitch-table">
            <thead>
              <tr>
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
                return (
                  <tr key={line.label}>
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
          <div className="pitch-slide-tag">/05 milestones</div>
          <ol className="pitch-timeline">
            {plan.milestones.map((m) => (
              <li key={m.when}>
                <span className="pitch-timeline-when">{m.when}</span>
                <span className="pitch-timeline-what">{m.what}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="pitch-slide">
          <div className="pitch-slide-tag">/06 projections</div>
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
          <div className="pitch-slide-tag">/07 risks</div>
          <ul className="pitch-risks">
            {plan.risks.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="pitch-slide pitch-slide--exit">
          <div className="pitch-slide-tag">/08 success looks like</div>
          <p className="pitch-thesis pitch-thesis--exit">{plan.exits}</p>
        </section>

        <section className="pitch-foot">
          <div className="pitch-foot-meta">
            <div>kiwi pop · refreshing club lolli</div>
            <div>founder · tennyson taggart · hello@kiwipop.co</div>
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
