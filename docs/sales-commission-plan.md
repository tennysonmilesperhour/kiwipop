# Kiwi Pop — wholesale sales commission plan

A structure to hand to a salesperson who owns wholesale door acquisition.

**Written 2026-07-26.** Priced against the tier ladder set in migration 043 and the
volume ramp in `docs/revenue-plan-2026.md`.

---

## What the job actually is

The revenue plan needs **14 new retail doors signed per month**, each placing a
**150-pop opening order ($375)** and settling into a **60-pop monthly reorder ($150)**.
By December that's 56 doors and ~$14,300/month of wholesale revenue.

Two numbers define the role, and the comp plan has to pay for both:

1. **Doors signed.** ~3.5 a week. Roughly 15–20 real conversations weekly at a 20% close.
2. **Doors that survive.** A door that opens and never reorders is worth $375 once and
   then costs us a display fixture. The plan breaks if reorders average 40/month instead
   of 60 — that's the difference between needing 56 doors and needing 78.

**A commission plan that only pays on the opening order will get you doors that don't
reorder.** Everything below is built to avoid that.

---

## What we can afford

| | Per pop |
|---|---|
| Door tier price | $2.50 |
| Landed cost, in-house at tier-3 materials + $0.45 conversion | $1.13 |
| Freight/handling allowance | ~$0.10 |
| **Contribution** | **~$1.27 (51%)** |

> Updated for the move to staffed in-house production (see
> [`docs/production-staffing-plan.md`](./production-staffing-plan.md)). The earlier
> version of this table used the co-packer's $0.75/pop, which is no longer the plan.
> Contribution is 23¢/pop thinner, so the affordability check below moved too.

Industry benchmarks for CPG sales comp: **7–15% of gross wholesale sales**, or
**20–30% of gross margin**, for a full-service independent rep carrying their own
costs. Food brokers who only open doors run 3–7% of net wholesale.

Both options below sit inside those bands.

---

## Option A — Draw against commission *(recommended)*

Best if this person is a part-time or W-2 hire who needs predictable income while the
residual base builds. Lower total cost to us, lower risk to them.

| Component | Rate | Trigger |
|---|---|---|
| **Opening order** | **12%** of the opening order value | Invoice paid in full |
| **Reorder residual** | **6%** of every reorder from their doors, for 12 months | Invoice paid in full |
| **Survival bonus** | **$50** per door | That door places its **3rd** order |
| **Distributor** | **3%** of distributor revenue | Invoice paid in full |
| **Draw** | **$1,000/month**, recoverable | Paid monthly; offset against commission earned |

**How the draw works:** they receive $1,000/month regardless. Commission earned is
credited against it. In a month where commission exceeds $1,000, they're paid the
excess and any accumulated deficit is recovered first. The deficit never goes below
zero at separation — we don't chase it.

### What they earn at plan

| | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|
| New doors | 6 | 10 | 12 | 14 | 14 |
| Opening commission | $270 | $450 | $540 | $630 | $630 |
| Reorder residual | — | $54 | $144 | $252 | $378 |
| Survival bonuses | — | — | $300 | $500 | $600 |
| Distributor | — | — | $42 | $61 | $83 |
| **Commission earned** | **$270** | **$504** | **$1,026** | **$1,443** | **$1,691** |
| Draw paid | $1,000 | $1,000 | $1,000 | $1,000 | $1,000 |
| **Cash to rep** | $1,000 | $1,000 | $1,026 | $1,443 | $1,691 |
| Running draw deficit | $730 | $1,226 | $1,200 | $757 | $66 |

**Total cash out Aug–Dec: ~$6,160.** December run rate $1,691/month — **11.8% of
wholesale revenue, 17.3% of contribution.** The residual compounds hard into Q1: at a
steady 56 doors with no new signings at all, residual alone is ~$500/month.

---

## Option B — Pure commission (1099 independent rep)

Best if you want zero fixed cost and are hiring someone who already carries a bag into
smoke shops and festival vendors. They take the risk, so the rates have to be real.

| Component | Rate |
|---|---|
| **Opening order** | **20%** of the opening order value |
| **Reorder residual** | **10%** of every reorder from their doors, for 12 months |
| **Survival bonus** | **$75** per door at its 3rd order |
| **Distributor** | **4%** of distributor revenue |
| Draw / base | None |

### What they earn at plan

| | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|
| **Commission earned** | **$450** | **$840** | **$1,710** | **$2,355** | **$2,691** |

December: **18.8% of wholesale revenue, 27.5% of contribution** — the top of the
independent-rep band, which is what no-base deserves.

**Total cash out Aug–Dec: ~$8,050**, but every dollar is paid out of revenue that
already landed. Nothing is at risk.

---

## Which to pick

| | Option A (draw) | Option B (pure) |
|---|---|---|
| Aug–Dec cost | ~$6,160 | ~$8,050 |
| December salary left over | $6,561 | $5,561 |
| Cost if they underperform | Up to $5,000 sunk | $0 |
| Attracts | Part-timer, junior, someone you're training | Experienced rep with existing accounts |
| Control | High — they're yours | Low — they set their own hours |

**Recommendation: Option A**, now more strongly than before — the switch to staffed
in-house production took 23¢/pop out of contribution, and Option B's extra $1,000/month
is money December doesn't have. Review the draw at 90 days. At this stage the
doors need to be signed a specific way (display placement at the register, the
buzz-button demo, the margin conversation) and that's easier to enforce when you're paying a base.
Move to Option B only if you find someone who already sells into this exact channel.

---

## Does it fit the $8,000 salary target?

Not on its own — and that's a production-cost issue, not a commission one. December,
rebuilt on in-house production:

| | Option A | Option B |
|---|---|---|
| Gross profit (in-house, tier-3 materials) | $10,652 | $10,652 |
| Less opex + marketing | −$2,400 | −$2,400 |
| Less sales commission | −$1,691 | −$2,691 |
| **Available for salary** | **$6,561** | **$5,561** |
| Salary target | $8,000 | $8,000 |
| **Gap** | **−$1,439** | **−$2,439** |

The commission is not what breaks it — even at zero commission December lands at $8,252,
barely clearing. **The gap closes on materials sourcing and line throughput**, both
covered in §6 of the staffing plan; pulling the tier-3 materials lever alone (~$1,790/mo)
puts Option A back above target.

What this *does* settle is the choice between the two options. **Option B's extra $1,000/mo
is a real problem now** — it's most of a second gap on top of the first. Take Option A.

**Note:** this treats the salesperson as a *fourth* person whose cost sits outside the
$8,000 pool. If they're one of the existing three, the commission is part of their
share of the $8,000, not on top of it — decide which before you write the offer.

---

## Rules that make it work

**Paid on collected cash, never on invoiced.** Commission is earned when the money
clears, not when the PO arrives. This is the single most important line in the plan.

**Clawback.** Refunds, chargebacks, returns, and invoices unpaid at 60 days reverse the
commission against the next payout. Survival bonuses on a door that then goes dormant
are not clawed back — that one's ours.

**Account ownership.** A door belongs to the rep who opened it for **12 months** from
the opening order. Residual follows the door, not the territory. After 12 months the
account becomes a house account and residual stops — renew it deliberately if they're
still actively servicing it.

**Not commissionable:** DTC/web orders, festival and event direct sales, merch,
donations, and inbound accounts that arrive through Faire or the website with no rep
involvement. If they materially work an inbound lead, it counts — decide case by case
and write it down.

**House accounts.** Big Skar (the existing distributor) is a house account. Any
distributor the founders source is a house account. A distributor the *rep* sources
pays the distributor rate.

**Minimum order integrity.** No commission on an order below the Door minimum (100
pops). Splitting a 100-pop order into two 50s to hit a bounty doesn't work and shouldn't
be possible — the tier minimums in `wholesale_pricing` enforce it.

**Discount authority.** The rep may not go below tier pricing. The four 25%-off
wholesale referral codes per approved account are the only discount lever, and they
come out of the account's own allotment. Anything deeper needs a founder's sign-off, and
commission is calculated on the discounted price.

**Quota, stated plainly.** 14 doors/month from October, ramping 6 → 10 → 12 in
Aug/Sep. Two consecutive months below 60% of quota is a conversation, not an automatic
anything.

---

## What to hand them on day one

- The line sheet at `kiwipop.fun/wholesale/line-sheet` — print to PDF, it's built for it.
  The margin block up top is the whole pitch: **50% at the Door tier.**
- A counter display and 20 loose pops for sampling. The buzz-button tingle (jambu +
  chilcuague) closes doors; a description of it does not.
- Their own set of wholesale referral codes to hand out.
- The target list: smoke shops, head shops, vape, dispensary-adjacent retail, festival
  and event vendors, record shops, streetwear, club merch counters.
- One number to remember: **a shop selling 2 pops a day makes $300/month at a 50%
  margin off a fixture that costs them nothing.**

---

## Tracking

Everything needed is already in the schema — no new tables required:

- **Doors signed** → `wholesale_accounts` where `approval_status = 'approved'`, by month
- **Opening vs reorder** → order sequence per `wholesale_account_id`
- **Survival** → accounts with ≥3 paid orders
- **Commission base** → paid orders only, which the Stripe reconciler already enforces

What's missing is a `rep_id` on `wholesale_accounts` to attribute a door to a person.
Add it before the first rep starts, not after — retroactive attribution is a fight
nobody wins.

---

## Sources

- [A Breakdown of Average Sales Rep Commission Rates by Industry — Map My Customers](https://mapmycustomers.com/blog/average-sales-rep-compensation-by-industry)
- [Determining Commissions for Independent Sales Reps — RepHunter](https://www.rephunter.net/blog/determining-commissions-for-independent-sales-reps/)
- [Food Brokerage Services Explained for CPG Brands — SJ Food Brokers](https://sjfoodbrokers.com/blog/food-brokerage-services-explained-what-cpg-brands-should-expect)
- [Sales Commission: Formulas, Rates, and Structure — Manufacturers' Representatives](https://www.manufacturers-representatives.com/article.cfm?ArticleNumber=7)
- [Food Brand Pricing Strategy: A CFO's Guide — Eightx](https://eightx.co/blog/food-brand-pricing-strategy)
