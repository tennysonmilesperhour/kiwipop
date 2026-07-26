# Kiwi Pop — road to $8,000/month salary

**Target:** by **December 2026**, the business generates enough gross profit to set aside
**$8,000/month for salary** across a team of three (~$2,670 each/mo).

**Strategy:** wholesale-led. DTC stays alive as the brand surface and margin cushion, but
the volume that funds payroll comes from retail doors and one distributor.

**Written:** 2026-07-26. All baseline figures pulled live from Supabase project
`yibliuftqrnfguctrqca` and the repo's cost model on that date.

> **Update 2026-07-26 — §3 Levers 1 and 2 are now shipped.** Migration 043 halved the
> glitter dose (0.1 g → 0.05 g/pop), repointed isomalt at a real wholesale tier, and
> repriced wholesale to the margin ladder below. Landed cost is now **$0.90/pop**
> (`diy_tier2`), not $0.95. Sales comp is designed in
> [`docs/sales-commission-plan.md`](./sales-commission-plan.md); the isomalt sourcing
> ladder is in [`docs/ingredient-sourcing.md`](./ingredient-sourcing.md).
>
> **Update 2026-07-26 (later) — the co-packer is off the table for 2026.** Production
> moves to **paid staff in a rented commissary kitchen** instead. See
> [`docs/production-staffing-plan.md`](./production-staffing-plan.md). This changes §3
> Lever 3 and the December P&L: COGS goes to **~$1.13/pop** rather than $0.75, and
> December's salary pool lands at **~$6,600 unless the sourcing and throughput levers in
> §6 of that doc are pulled.** They should be.

---

## 1. Where we actually are

### Revenue to date

| Month | Paid orders | Gross revenue | AOV |
|---|---|---|---|
| May 2026 | 49 | $1,508.76 | $30.79 |
| Jun 2026 | 9 | $344.93 | $38.33 |
| Jul 2026 (to 7/26) | 8 | $669.97 | $83.75 |
| **Lifetime** | **66** | **$2,523.66** | **$38.24** |

- **57 unique buyers, 1.16 orders per buyer.** Repeat signal exists but is not yet a channel.
- **Logged expenses: $1,859** ($940 materials, $359 overhead, $300 marketing, $260 labor).
  Cumulative net is roughly **+$665** — effectively pre-revenue at the scale we need.
- **Email list: 70.** Wholesale accounts: **1 approved** (Big Skar, distributor tier), 1 rejected.
  Wholesale revenue so far: **$0**.

### The honest read

May was a launch spike. June was the trough. July's 8 orders at an $83.75 AOV is the most
interesting number in the dataset — **order size is climbing hard** (+172% since May) while
order count is flat. Pack pricing works. What's missing is *volume*, and DTC at this list
size cannot produce it in five months.

### Gap to target

$8,000/mo of salary needs roughly **$11,500/mo of gross profit**, which needs roughly
**$22,000/mo of revenue** at our margin structure. Current run rate is ~$670/mo.

**That is a ~33x increase in five months.** It is only reachable because wholesale converts
one sales conversation into a recurring 150-pop order, and because we start from a base so
small that the absolute dollars are modest. It is not reachable on DTC order-by-order growth.

---

## 2. Unit economics as they stand

### Cost per pop

The repo already carries a four-tier cost basis on every product (`products.cost_basis_cents`).
Current active basis is `diy_tier2`:

| Basis | $/pop (orig.) | $/pop (post-042) | What it means |
|---|---|---|---|
| `diy_tier1` | $1.27 | $1.20 | Small craft/Amazon packs |
| **`diy_tier2`** | $0.95 | **$0.90** | **Current — Amazon-anchored mid packs** |
| `diy_tier3` | $0.72 | $0.68 | Large-bulk lots, real inventory commitment |
| `copacker` | $0.75 | $0.75 | External manufacturer, all-in. A quoted price, not a materials build-up — renegotiate against the new spec at contract time. |

The bill of materials in the database sums to only **$0.48–$0.55/pop** for the four flavors,
but **six ingredients carry no cost at all** — jambu, chilcuague, B12, coconut oil, monk
fruit, and the electrolyte blend. The tier figure is the realistic number; the BOM is the
incomplete one. (Fixing those six costs is a task in §7.)

### Where the money actually goes (Kiwi Pop, per pop)

| Ingredient | ¢/pop | Share of BOM |
|---|---|---|
| **Isomalt** (15 g) | **24.6¢** → **16.0¢** ✅ | **45%** |
| **Edible luster dust** (0.1 g → 0.05 g) | **10.0¢** → **5.0¢** ✅ | **18%** |
| Kiwi powder | 5.5¢ | 10% |
| Xylitol | 4.8¢ | 9% |
| **Label sticker** | **3.9¢** | **7%** |
| Everything else (13 lines) | 6.7¢ | 11% |

**Two ingredients are 63% of our cost.** Every actives line combined — theobromine, ginseng,
taurine, magnesium, turmeric, spirulina — is under 5¢. The functional payload is essentially
free. **The candy base and the glitter are the whole cost problem.** This is the single most
useful thing in the cost data and it should drive every sourcing decision.

### Wholesale pricing — currently underpriced

| Tier | Price/pop | MOQ | Retailer margin at $5 MSRP |
|---|---|---|---|
| ~~standard~~ | ~~$2.00~~ | ~~50~~ | ~~**60%**~~ |
| ~~premium~~ | ~~$1.65~~ | ~~200~~ | ~~**67%**~~ |

**Repriced in migration 043** — see Lever 1 below for the ladder that replaced this.

Specialty and impulse retail needs **40–50%** margin to say yes; above that we were just
donating margin. Industry guidance puts specialty/convenience at a holdable 2.0–2.5x
keystone. The old ladder gave away roughly **25% of wholesale revenue for nothing**, and the
premium tier handed a distributor price to anyone who bought 200 pops ($330).

There was also a live pricing bug: **`KP-PACK-12` at $18.00 for 12 pops = $1.50/pop**, below
every wholesale tier, on a public SKU. It was `in_stock = 0` so nothing leaked; migration 043
repriced it to $42.00 ($3.50/pop), between the 6-pack ($4.17) and the 20-pack ($3.00).

---

## 3. The three levers, in order of value

### Lever 1 — Reprice wholesale ✅ *shipped in migration 043*

| Tier | DB key | Price/pop | MOQ | Retailer margin | Our margin |
|---|---|---|---|---|---|
| **Door** | `standard` | **$2.50** | 100 | **50%** | 64% |
| **Volume** | `premium` | **$2.25** | 500 | **55%** | 60% |
| **Distributor** | `distributor` | **$1.85** | 2,500 | **63%** (resells at $2.50, keeps 26%) | 51% |

Live and verified across all four flavors. Labels and margin helpers live in
`lib/wholesale-tiers.ts`; the vendor-facing line sheet leads with the retailer's margin
rather than our price.

Effect: **+25% revenue per pop** on the main tier, **+12%** on distributor volume, with zero
cost increase and no credible pushback — 50% is still a good margin for a shop.

**Sell in display units, not loose pops.** A 50-pop counter display at $125 is the natural
opening-order unit for an impulse product at the register. Give the display fixture free on
opening orders of 150+. This makes the ask concrete, raises door productivity, and turns
"want to try some?" into a $375 line item.

### Lever 2 — Ingredient wholesale accounts (partially shipped; moves COGS $0.95 → ~$0.72)

Attack the two lines that are 63% of cost:

| Line | Now | Target | Route | Saving/pop |
|---|---|---|---|---|
| **Isomalt** ✅ | $0.0164/g | **$0.0107/g** (Bakers Authority 45 lb, $218.10 — confirmed) | Deeper rungs (25 kg industrial, 500 kg import) laddered in `docs/ingredient-sourcing.md` | **−8.6¢** |
| **Luster dust** ✅ | 0.1 g @ $1.00/g | **0.05 g** — dose halved in migration 043 | Bulk 1 kg tier still to negotiate; would take it to ~1.9¢/pop | **−5¢** |
| Labels | $0.039 ea | ~$0.015 ea | OnlineLabels 1,000+ roll instead of 200-packs | −2.4¢ |
| Magnesium glycinate | $0.046/g | $0.015/g | BulkSupplements 25 kg tier | −0.9¢ |
| Lemon powder (lemon SKU) | $0.057/g | $0.019/g | BulkSupplements 25 kg | −3.8¢ (that SKU) |

**≈21¢/pop, about 22% of the original COGS.** At December volume that is ~$1,700/month.
The isomalt and glitter lines above are done — landed cost is **$0.90/pop** today, and
the remaining rows (labels, magnesium, lemon powder) plus the deeper isomalt rungs are
what carry it to $0.72.

Open formal accounts with the three that matter: **WebstaurantStore** (base + packaging),
**BulkSupplements Wholesale** (all actives in one place), **Starwest Botanicals** (organic
botanicals, Net-30). Net-30 terms are as valuable as the discount — they finance the
inventory build in §6.

> **Caveat:** the sourcing sheet in `docs/ingredient-sourcing.md` is explicit that its prices
> came from search snippets, not confirmed page loads. Every number above needs one browser
> check before it drives a purchase order. The luster dust figure in particular is a
> placeholder ($1.00/g exactly) and is probably the least reliable input in the whole model.

### Lever 3 — ~~Co-packer~~ → **staffed in-house production** *(revised)*

**Superseded.** The original argument was that ~156 production hours/month at December
volume would force a co-packer by October. **That estimate was too high** — it assumed
the 55-pop kitchen batch worked sequentially by one person. At commissary scale, with
bigger batches and a 3-person parallel line, throughput is closer to **75 pops per
person-hour**, which puts December at **~108 person-hours — about 8 clock-hours a week.**

So the capacity argument for a co-packer largely evaporates. What replaces it:

| | Per pop | Dec total |
|---|---|---|
| Co-packer (all-in, **unquoted estimate**) | $0.75 | $6,090 |
| In-house, tier-2 materials + $0.45 conversion | $1.35 | $10,962 |
| **In-house, tier-3 materials + $0.45 conversion** | **$1.13** | **$9,176** |

In-house is ~$0.38/pop worse than the modelled co-packer — but that $0.75 has never been
quoted, a real specialty run would plausibly come back at $1.00–1.40/pop, and the
co-packer's **500–1,000 lb minimum run ($9,400–18,750)** is most of the working-capital
problem in §6. Labour flexes with demand; a 25,000-pop PO does not.

**Decision: in-house for 2026.** Hire one person in August, a second in October, a third
in November — not three in August, when there are only 19 hours of work. Get three
co-packer quotes in August anyway, as the benchmark that decides 2027.

Full model, cost tables, gap-closing levers, and the W-2 / workers' comp / food-handler
checklist: [`docs/production-staffing-plan.md`](./production-staffing-plan.md).

Two constraints to solve before committing:

1. **Minimum run size.** At ~18 g per pop, 25 pops ≈ 1 lb. A 500 lb minimum run = 12,500 pops
   (~$9,400); a 1,000 lb run = 25,000 pops (~$18,750). Many co-packers won't quote below
   1,000 lb. That is 3 months of December-rate inventory bought in one cheque.
2. **They must be willing to run isomalt with a supplement-style actives blend and mica.**
   That is a specialty ask. Start with small-startup-friendly houses (Specialty Food Copackers
   in WA explicitly serves brands whose volume is too small elsewhere) and isomalt-native
   confectionery shops (Sugar Art Supply, Quality Candy, Econo-Pak) rather than generic
   food co-packers.

Expect a **~$2,000 setup/first-run fee** on a simple shelf-stable line, plus line-cleaning
charges for the allergen/actives changeover.

---

## 4. The ramp — month by month

Assumptions, stated so they can be argued with:

- **New door opening order: 150 pops** ($375 at $2.50) — one display plus backstock.
- **Steady-state door reorder: 60 pops/month** ($150) — i.e. the shop sells ~2/day at $5.
- **Distributor** signs in October, ramping 750 → 1,100 → 1,500 pops/mo at $1.85.
- **DTC realized price: $3.20/pop** blended across the 6/8/20/40-packs.
- **Events:** 1–2 festival/market weekends per month from August, ~$5/pop direct.
- **COGS $0.75/pop** from October (tier-3 sourcing, then co-packer); $0.95 before that.

| | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|
| New doors signed | 6 | 10 | 12 | 14 | 14 |
| **Cumulative doors** | **6** | **16** | **28** | **42** | **56** |
| Wholesale pops | 900 | 1,860 | 3,510 | 4,880 | 6,120 |
| DTC pops | 250 | 400 | 600 | 900 | 1,300 |
| Event pops | 250 | 500 | 600 | 700 | 700 |
| **Total pops** | **1,400** | **2,760** | **4,710** | **6,480** | **8,120** |
| Wholesale revenue | $2,250 | $4,650 | $8,288 | $11,485 | $14,325 |
| DTC revenue | $800 | $1,280 | $1,920 | $2,880 | $4,160 |
| Event revenue | $1,250 | $2,500 | $3,000 | $3,500 | $3,500 |
| **Revenue** | **$4,300** | **$8,430** | **$13,208** | **$17,865** | **$21,985** |
| **Gross profit** *(co-packer basis)* | ~$2,400 | ~$4,900 | ~$8,230 | ~$11,150 | ~$13,740 |
| **Gross profit** *(in-house, tier-3)* | ~$1,870 | ~$3,850 | ~$6,440 | ~$8,690 | ~$10,650 |
| Opex + marketing | $2,000 | $2,200 | $2,400 | $2,400 | $2,400 |
| Sales commission (Option A) | $270 | $504 | $1,026 | $1,443 | $1,691 |
| **Available for salary** *(in-house)* | −$400 | $1,150 | $3,010 | $4,850 | **$6,560** |
| **Salary drawn** | $0 | $0 | **$3,000** | **$4,800** | **$6,500** |

**Read that last row honestly.** On in-house production at *today's* sourcing trajectory,
December lands around **$6,500/month of salary, not $8,000.** The gap is ~$1,440 and it
closes on **sourcing and throughput, not on selling more** — see §6 of the staffing plan.
Pull the tier-3 materials lever (~$1,790/mo) and the $8,000 is back on the table.

**Aug–Dec totals: ~$65,800 revenue, ~23,500 pops.** December exits at a **~$264k
annualized run rate.**

Without the co-packer's first run to fund, the retained cash goes to equipment
(~$1,200 of moulds and a heat sealer, which pays for itself in ~6 weeks of labour) and a
Q1 buffer instead.

### Fixed opex assumed (~$1,520/mo at scale)

Hosting/software $150 · product liability insurance $175 · bookkeeping $200 · packing
supplies $150 · Faire and marketplace fees + trade-show amortization $400 · **payroll
service $120** · misc/travel $325. Marketing and sampling runs $600–$1,000/mo on top.

Kitchen rent and wages are **not** here — they're COGS, and they scale with volume.

`app_settings.monthly_overhead_cents` was updated to $1,520 in migration 044 (it had been
sitting at $150, which made every break-even read in the admin optimistic).

---

## 5. What each of the three people owns

The plan lives or dies on one thing: **someone owns wholesale full-time and is not also the
person cooking candy.** That is the whole reason the co-packer trigger exists.

| Role | Owns | The number they're judged on |
|---|---|---|
| **Wholesale / sales** | Outbound to doors, Faire, distributor relationship, trade shows, reorder follow-up | **Doors signed (14/mo) and reorder rate** |
| *(if hired out)* | See [`docs/sales-commission-plan.md`](./sales-commission-plan.md) — draw + commission, ~$1,700/mo at December volume | Same |
| **Production / ops** | Runs the commissary line and the paid crew, inventory, fulfillment, ShipStation | **Cost per pop, measured throughput, zero stockouts** |
| **Brand / DTC / events** | Storefront, email, social, festival booths, content, customer support | **Event revenue and list growth** |

**14 doors/month is ~3.5 per week.** For a $375 opening order on an impulse product with a
50% margin and a free display, that is a demanding but normal outbound cadence for one
dedicated person — roughly 15–20 conversations a week at a 20% close rate. It is the single
hardest commitment in this document and everything else is downstream of it.

### Where the doors come from

- **Smoke shops / head shops / vape** — closest cultural fit, impulse counter placement, low
  friction, cash on delivery. Highest-density target.
- **Dispensary-adjacent retail** (non-infused sections) — same customer, wants functional SKUs.
- **Festival and event vendors** — buy in bulk for a weekend, reorder seasonally, biggest
  single orders.
- **Record shops, streetwear, club merch counters** — brand-fit, low volume, high credibility.
- **Faire** — inbound discovery, worth listing for reach even at their take rate; treat it as
  lead-gen, not the main channel, and steer reorders direct.

---

## 6. Cash and working capital — the part that bites

Revenue growth of this shape consumes cash before it produces it. Ingredients get bought
30–60 days before the money comes back.

| | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|
| COGS spent (prior month's build) | ~$1,300 | ~$2,600 | ~$3,500 | ~$4,900 | ~$6,100 |

**Revised down to roughly $4,000–$6,000** now that there's no co-packer first run to
pre-fund. In-house production buys materials for the pops about to be sold, week by week,
so working capital tracks a few weeks of COGS rather than a 25,000-pop commitment. The
new cash timing risk is smaller but sharper: **payroll runs every two weeks whether or not
a wholesale invoice has cleared.** Keep one month of payroll (~$3,000 by December) as an
untouched float.

Three ways to cover it, in preference order:

1. **Net-30 terms from the ingredient wholesalers** (Starwest offers it, most others will
   after a few paid orders). Cheapest financing there is.
2. **Distributor prepayment or a deposit** on the first large PO — a distributor buying 2,500
   pops can reasonably pay 50% up front, which directly funds the co-packer run.
3. **The campaign / cash donations** already wired into the admin (`cash_donations`).
   Use it for the equipment spend and the payroll float, not for operating expenses.

**Do not hire the second or third person before the volume that justifies them is
actually booked.**

---

## 7. Free levers — things that cost nothing and are being left on the table

1. **Checkout abandonment is 55%.** There are **79 cancelled orders with no Stripe payment
   intent** versus 66 paid — every one of those is a cart that never reached payment. Fixing
   even a third of that is ~$1,200 of recovered lifetime revenue at current AOV and scales
   with everything else. Highest-ROI engineering task in the repo.
2. ~~**Retire or reprice `KP-PACK-12`**~~ ✅ repriced to $42.00 in migration 043.
3. **Price the six uncosted ingredients** (jambu, chilcuague, B12, coconut oil, monk fruit,
   electrolyte) so the BOM stops understating true cost by ~40%. Chilcuague was added to the
   shared base in migration 042 and is unpriced — it lands in the same bucket as jambu below.
4. **Update `app_settings.monthly_overhead_cents`** from $150 to a real number (~$1,400) and
   `target_monthly_volume` to the current month's plan figure, so admin break-even is honest.
5. **The wholesale referral codes are built and unused** — `wholesale_discount_codes` has 0
   rows. Every approved account gets 3 referral codes on approval. That is a door-acquisition
   channel already coded and sitting idle. Turn it on with the first six accounts.
6. **Email list is 70 people.** Every event, every wholesale door, every order should feed it.
   A list of 1,000 by December is worth roughly one extra DTC month in Q4.
7. **Reduce isomalt from 15 g to 12 g per pop.** Saves ~3¢/pop at the new wholesale rate and
   cuts shipping weight ~17%. This changes the product, so it is a taste decision, not a
   finance one — but it is worth testing. (The glitter equivalent of this is already done.)
8. **Negotiate the Bakell 1 kg luster-dust case price.** The halved dose plus a bulk tier
   would take glitter from 10¢/pop to ~1.9¢ — the last big win left in the BOM.

---

## 8. Risks, ranked

1. **Regulatory / labeling is a gate, not a footnote.** A nootropic-positioned confection sold
   wholesale across state lines is not covered by cottage-food rules. Before scaling doors we
   need: FDA food facility registration, a decision on Nutrition Facts vs Supplement Facts
   panel, allergen statement, and the **xylitol-toxic-to-dogs warning** on retail packaging
   (already noted in the ingredient panel — it must make it onto the physical label). Retail
   doors will also ask for a **certificate of insurance**; product liability runs ~$1,500–2,400/yr
   and is budgeted above. **Sort this in August or it blocks October.**
2. **The two alkamide actives — jambu and chilcuague — have no confirmed food-grade supply
   chain and no cost in the model.** Both are in every SKU's BOM and priced at zero. Jambu is
   a quote-only B2B oleoresin with ~1 kg MOQ; chilcuague (*heliopsis longipes*) currently has
   no channel beyond ethnobotanical sellers and Sierra Gorda co-ops. They are the product's
   signature hook, so this is not a line to substitute quietly — but if neither can be sourced
   compliantly at volume, the formula needs a decision **before** the co-packer run, not after.
3. **Door productivity is the assumption most likely to be wrong.** The plan needs 60
   pops/month of reorder per door. Sensitivity:

   | Avg reorder/door/mo | Doors needed for the Dec number |
   |---|---|
   | 80 | 44 |
   | **60** | **56** |
   | 40 | 78 |
   | 25 | 112 |

   At 25/mo the plan does not work on doors alone and must lean harder on distributors and
   events. **Measure this from the first six accounts in September** — it is the earliest
   reliable signal we will get, and it should reset the whole forecast.
4. **Throughput is an estimate, not a measurement.** The whole staffing plan rests on
   75 pops per person-hour. If it's really 50, December needs 162 person-hours and
   3 × 10 hrs/week doesn't cover it. **Measure it on the first three sessions in August**
   and correct `lib/production-cost.ts` — it's a cheap measurement and everything is
   downstream of it.
5. **Distributor concentration.** By December the distributor is ~13% of revenue, which is
   fine. If they grow past ~25%, they own our pricing. Keep direct doors the majority.
6. **Seasonality.** Festival revenue is warm-weather and holiday-market weighted. January and
   February will be materially softer than December — the $8,000 needs to survive Q1, so the
   December retained cash matters more than it looks.

---

## 9. The 90-day action list

### August — pricing, sourcing, first doors
- [x] ~~Reprice wholesale to $2.50 / $2.25 / $1.85 tiers~~ ✅ migration 043
- [x] ~~Halve the glitter dose; repoint isomalt at a wholesale tier; fix `KP-PACK-12`~~ ✅ migration 043
- [ ] Price the six uncosted BOM lines (incl. chilcuague); update `app_settings.monthly_overhead_cents`
- [ ] Open wholesale accounts: WebstaurantStore, BulkSupplements, Starwest (ask for Net-30)
- [ ] **Confirm the $218.10 Bakers Authority isomalt price in a browser and place the first
      45 lb order** — it's the one figure the new cost basis rests on
- [ ] Get a Bakell 1 kg luster-dust case quote
- [ ] Hire or assign the wholesale seller; add `rep_id` to `wholesale_accounts` first
- [ ] **Start the regulatory work**: facility registration, label panel decision, insurance quote
- [ ] Build the 50-pop counter display and the one-page line sheet
- [ ] **Sign 6 doors.** Issue their referral codes.
- [ ] Fix checkout abandonment
- [ ] Request 3 co-packer quotes with our actual spec (isomalt, actives, mica, ~18 g/pop)
      — as the 2027 benchmark, not to commit
- [ ] **First production hire** + workers' comp, payroll service, food handler permits
- [ ] Book the commissary (hourly + $450/mo minimum beats the 20 hrs/week block)
- [ ] **Measure actual pops-per-person-hour on the first three sessions**
- [ ] Order extra moulds, a second induction burner, and a heat sealer (~$1,200)

### September — prove the reorder rate
- [ ] **Sign 10 more doors** (16 total)
- [ ] **Measure first reorders from the August six** — this number resets the forecast
- [ ] List on Faire
- [ ] 2 event weekends; every attendee onto the email list
- [ ] Shortlist the co-packer; negotiate first-run size and deposit

### October — the pivot month
- [ ] **Sign 12 more doors** (28 total)
- [ ] **Sign the distributor**; take a deposit on the first PO
- [ ] **Second production hire** (volume crosses 4,000 pops)
- [ ] Switch `active_cost_basis` to `inhouse`
- [ ] **First salary draw: $3,000**

### November–December — hold the line
- [ ] 14 doors/month; hold reorder rate ≥60 pops
- [ ] **Third production hire** (November)
- [ ] Holiday DTC push to the (by now much larger) email list
- [ ] **$4,800 → $6,500/month salary** — or $8,000 if the tier-3 materials lever landed
- [ ] Bank December's retained cash + one month of payroll float against Q1 seasonality
- [ ] January: reassess the co-packer with a real quote and six months of measured
      throughput in hand

---

## 10. The one-paragraph version

Wholesale is currently priced 25% too cheap and the two ingredients that make up 63% of our
cost are being bought at small-pack prices. Fixing both — a week of work and three supplier
accounts — takes gross margin per wholesale pop from about $1.05 to about $1.75 before a
single new customer. From there the plan is arithmetic: **56 retail doors and one distributor,
signed at roughly 14 doors a month, each reordering 60 pops a month**, plus a holiday DTC
push and one or two festival weekends a month, produces about **$22,000 of December revenue
and $13,700 of gross profit** — enough for $8,000 of salary with $3,300 left over. The
binding constraint is not demand and it is not cost; it is that one person has to own door
acquisition full-time. Production is now solved differently than first planned — **paid
staff on a commissary line rather than a co-packer**, which costs ~$0.38/pop more than the
(never actually quoted) co-packer price but removes a $9–19k minimum-run commitment, keeps
the formula in-house, and lets the largest controllable cost flex with real demand. That
trade lands December's salary at ~$6,500 rather than $8,000 — a gap that closes on
**sourcing and throughput, not on selling harder.**

---

## Sources for external estimates

- [Co-Manufacturing Cost and MOQs for CPG — Eightx](https://eightx.co/blog/cpg-comanufacturing-cost-moq)
- [How much does contract packaging cost? 2026 pricing guide — Pro-Motion](https://www.pro-motion.ws/blog/how-much-does-contract-packaging-cost-a-complete-pricing-guide-for-2026/)
- [What is keystone markup? — Eightx](https://eightx.co/blog/what-is-keystone-markup)
- [Retail Distribution Economics: Margin After the Middlemen — Eightx](https://eightx.co/blog/cpg-retail-distribution-margins)
- [Navigating Distribution and Retail Margins for CPG Brands — Settle](https://www.settle.com/blog/navigating-distribution-and-retail-margins-for-cpg-brands)
- [Wholesale vs. Retail Margin for DTC Brands — Eightx](https://eightx.co/blog/wholesale-retail-margin-dtc)
- [Faire's take rate: what wholesale does to your margin — Eightx](https://eightx.co/blog/faire-wholesale-take-rate-margin-impact)
- [Specialty Food Copackers — small-startup hard candy](https://www.specialtyfoodcopackers.com/Hard-Candy.html)
- [Econo-Pak — hard candy co-packer](https://www.econo-pak.com/co-packer/food-categories/hard-candy-co-packer/)
- [Quality Candy Company — hard candy contract manufacturing](https://qcandy.com/hard-candy/)
- [Sugar Art Supply — co-packers / private label (isomalt-native)](https://www.sugarartsupply.com/pages/co-packers-contract-manufacturing-private-label)
- [Bakell — luster dust wholesale, 1 kg tier](https://bakell.com/collections/buy-luster-dust-wholesale)
- [Bakers Authority — bulk isomalt 45 lb](https://www.bakersauthority.com/products/isomalt-45-lb-bag)
- [WebstaurantStore — LorAnn isomalt 25 lb](https://www.webstaurantstore.com/lorann-oils-25-lb-isomalt-crystals/725ISOMALT25.html)

Internal baseline: Supabase `yibliuftqrnfguctrqca` (`orders`, `order_items`, `products`,
`bill_of_materials`, `raw_materials`, `wholesale_pricing`, `expenses`, `app_settings`) as of
2026-07-26, plus `docs/ingredient-sourcing.md` and `docs/pitch-checkpoint-2026-05-27.md`.
