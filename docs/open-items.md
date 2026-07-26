# Kiwi Pop — open items

Everything still unresolved across the revenue, sourcing, production, and commission
plans, with a recommendation on each. Ordered by what it's worth against what it costs
to do.

**Last updated 2026-07-26.** Companion to `revenue-plan-2026.md`,
`ingredient-sourcing.md`, `production-staffing-plan.md`, `sales-commission-plan.md`.

---

## The scoreboard

December's salary pool sits at **~$6,560 against an $8,000 target — a $1,440 gap.**
Everything in §1 below adds up to **~$3,200/month.** You do not need all of it. You need
about half of it, and none of it requires selling a single extra pop.

---

## 1. Money on the table — do these first

| # | Item | Worth/month | Effort | Recommendation |
|---|---|---|---|---|
| 1 | **Tier-3 materials**: isomalt rung 3, magnesium 25 kg, lemon powder 25 kg | **~$1,790** | 3 purchase orders | **Do it in August.** Single biggest lever in the whole plan and it closes the December gap on its own. |
| 2 | **Throughput equipment**: more 50-cavity moulds, 2nd induction burner, heat sealer | **~$865** | ~$1,200 once | **Do it before the first hire.** Pays back in ~6 weeks, and takes 3 × 10 hrs/week from *tight* to *comfortable* in December. |
| 3 | **Luster dust 1 kg case** | **~$250** | One email to Bakell | Currently 5¢/pop against a $1.00/g placeholder. A 1 kg tier should land near $0.37/g → **~1.9¢/pop.** |
| 4 | **Labels on a 1,000+ roll** | **~$195** | One order | 3.9¢ → ~1.5¢. You're buying 200-packs. |
| 5 | **Foil: stop buying the 6-colour pack** | **~$105–200** | Change what you order | See §2. |

**If you pull items 1 and 2 only, December clears $8,000.**

---

## 2. Foil — you are throwing away a third of every pack

The 600-piece pack is six colours at 100 each; you use four. **400 usable wrappers per
pack**, so the real cost is pack ÷ 400, not ÷ 600 — the two dead colours add **50% to
every wrapper you actually use.** At ~$15.99/pack that's **4.0¢/pop**, as big as the
label sticker, and it was missing from the BOM entirely until migration 046 while the
line sheet was already telling buyers the pops are "individually foiled."

Three fixes, best last:

1. **Four single-colour packs** instead of one six-colour → waste to zero, ~2.7¢/pop.
2. **A bulk single-colour count** (1,000-sheet packs run ~$0.015–0.020/sheet) → ~1.5–2.0¢.
3. **One foil colour for all four flavours**, with the label carrying flavour identity —
   it already does. Unlocks #2 at full scale: **4.0¢ → ~1.5¢, ~$200/month.**

**Recommendation: #3.** The colour cue matters less than it sounds in a counter display
where the label is what gets read. If you want to keep colour-coding, take #1 — it's free
and immediate.

**Either way, don't bin the two unused colours.** Event samples, seasonal runs, display
units.

---

## 3. Numbers the plan rests on that nobody has verified

These aren't optional. Each one is load-bearing and currently an estimate.

| # | Number | Why it matters | How to close it |
|---|---|---|---|
| 6 | **Isomalt at $218.10 / 45 lb** | The entire `diy_tier2` → tier-3 path is built on it. Isomalt is 45% of the BOM. | Open the Bakers Authority page in a browser. Five minutes. |
| 7 | **Throughput at 75 pops/person-hour** | Sets the whole staffing plan. At 50, December needs 162 person-hours and 3 × 10 hrs/week doesn't cover it. | **Measure it on the first three real sessions.** Correct `THROUGHPUT_POPS_PER_LABOUR_HOUR` in `lib/production-cost.ts`. |
| 8 | **Foil pack at ~$15.99** | 4¢/pop rides on it. | Read your order confirmation. |
| 9 | **Ashwagandha 3.0¢, caramel 3.8¢, apple powder 2.7¢** | The only three ingredient estimates big enough to matter. Everything else is under 1.5¢. | Check when you next reorder. Don't make special trips. |
| 10 | **Workers' comp class rate** | The 13% payroll burden assumption depends on it; it's the component that varies most. | One insurance quote, needed before the first hire anyway. |

---

## 4. The ~35¢/pop gap

The complete BOM is now **$0.53–0.57/pop**. `diy_tier2` says **$0.90**. Adding the foil
closed 4¢; **~33–42¢ is still unexplained**, and every margin in the admin inherits it.

Three candidates:

- **Yield loss.** Hand-poured isomalt breaks, under-fills, sets badly. 15–25% scrap is
  normal and would be ~$0.10 of it.
- **Unallocated buffer** baked in when the tier was seeded.
- **Something else still missing from the BOM** — the foil was, so a second omission is
  not unthinkable.

**Recommendation: measure scrap on the first three sessions** — weigh isomalt in, count
sellable pops out. You're already measuring throughput in those same sessions, so it's
free. Then either correct `diy_tier2` down (which *improves* the December number and may
close the gap by itself) or find what's missing.

**Do this before the tier-3 purchase orders**, because that's when the model starts
directing real money.

---

## 5. Compliance — this gates October, not December

Nothing here makes money. All of it can stop you selling.

| # | Item | Recommendation |
|---|---|---|
| 11 | **FDA food facility registration** | August. A nootropic-positioned confection sold wholesale across state lines is not cottage-food territory. |
| 12 | **Supplement Facts vs Nutrition Facts panel** | Decide in August — it changes label artwork, and artwork has lead time. |
| 13 | **Xylitol-toxic-to-dogs warning on the physical label** | Already in the ingredient panel on the site. It must make it onto the printed label. |
| 14 | **Product liability COI** | Doors will ask; the commissary will ask. ~$1,500–2,400/yr, already budgeted. |
| 15 | **Chilcuague COA** | You're buying from an eBay ethnobotanical listing — no COA, no food-grade attestation, no lot traceability. Ask the seller first; if nothing, Sierra Gorda co-ops or a US botanical importer. **This is the last unresolved sourcing risk** now that jambu has a real supplier. |
| 16 | **W-2 setup**: EIN, Utah withholding + SUTA, workers' comp, payroll service, food handler permits | All before the first shift. Misclassifying production staff as 1099 is the one item on this whole list that can genuinely hurt you. |
| 17 | **Lot coding from day one** | If you ever have to recall, "which batch" is the only question that matters and it can't be reconstructed afterwards. |

---

## 6. Revenue plumbing — built and idle

| # | Item | Recommendation |
|---|---|---|
| 18 | **Checkout abandonment at 55%** — 79 cancelled orders with no Stripe payment intent vs 66 paid | Still the highest-ROI engineering task in the repo, and still untouched. Recovering a third is ~$1,200 of lifetime revenue and it scales with everything else. |
| 19 | **Wholesale referral codes: 0 rows** | Every approved account gets 3 referral codes on approval. The feature is built. Turn it on with the first six doors — it's a door-acquisition channel sitting idle. |
| 20 | **`rep_id` on `wholesale_accounts`** | Add it **before** the first salesperson starts. Retroactive attribution is a fight nobody wins. |
| 21 | **`app_settings.target_monthly_volume` still 1,000** | Should track the current month's plan figure (1,400 Aug → 8,120 Dec) or every break-even read in the admin is wrong. |
| 22 | **Email list at 70** | Needs to be ~1,000 by December for the Q4 DTC push to be worth anything. Every event, every door, every order should feed it. |

---

## 7. Decisions still open

| # | Question | Recommendation |
|---|---|---|
| 23 | **Spilanthes grade** — Barlowe's 10:1 (switched to), NaturMed CO2, or Mountain Rose dried herb? | Start with Barlowe's; get a NaturMed CO2 quote in parallel. **Bench-test before changing grade** — 0.005 g is right for a 10:1 extract and would be badly wrong for dried aerial herb. Ask Barlowe's for bulk powder so you're not emptying 60 capsules a bottle. |
| 24 | **Isomalt 15 g → 12 g per pop** | Worth testing. ~3¢/pop and 17% less shipping weight. A taste decision, not a finance one. |
| 25 | **Salesperson: fourth person, or one of the three?** | Decide before writing the offer. If they're a fourth, commission sits outside the $8,000 pool; if they're one of the three, it comes out of their share. |
| 26 | **Co-packer for 2027** | Get three real quotes in August anyway. The $0.75/pop figure has never been tested, and that number decides your 2027 shape. |

---

## If you only do five things in August

1. **Place the tier-3 material orders** (§1.1) — closes the December gap by itself
2. **Buy the throughput equipment** (§1.2) — ~$1,200, pays back in six weeks
3. **Measure yield and throughput on the first three sessions** (§3.7, §4) — free, and it
   corrects two of the three biggest assumptions in the plan
4. **Start the regulatory work** (§5.11–14) — it gates October and has lead time
5. **Fix checkout abandonment** (§6.18) — it's been the top engineering item since day one
