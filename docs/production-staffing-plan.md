# Kiwi Pop — in-house staffed production

**The decision:** hire 2–3 people at $20–25/hr to run production in a rented commissary
kitchen, instead of committing to a co-packer in 2026.

**Verdict: yes, do this — with one number you need to fix.** The staffing shape is right.
The cost is ~$0.38/pop higher than the co-packer figure the revenue plan assumed, which
takes December's salary pool from $8,000 to about $6,600 unless the gap is closed. It is
closeable, and not with more labour hours. Detail below.

**Written 2026-07-26.** Model lives in `lib/production-cost.ts`; the `inhouse` cost basis
was added in migration 044.

---

## 1. The correction I owe you first

The revenue plan estimated **~156 production hours/month** at December volume and used
that to argue you'd be forced into a co-packer by October. That number was too high, and
your instinct was right to push on it.

It assumed the **55-pop kitchen batch** — the batch size the monk-fruit dose is written
against — worked sequentially by one person. That's a home-kitchen shape, not a
commissary shape. Two things change at scale:

1. **Bigger batches.** Cooking 20 kg of isomalt doesn't take twenty times as long as
   cooking 1 kg. The cook is mostly unattended; pouring and demoulding are what scale
   with volume, and 50-cavity moulds move a lot faster per pop than a small tray.
2. **A parallel line.** One person cooking and blending, one pouring moulds and setting
   sticks, one demoulding, wrapping, labelling and packing. Three person-hours per
   clock-hour, and nobody waiting on the pot.

Reworked bottom-up from a ~500-pop session — 20 min setup, ~45 min cook (largely
unattended), ~60 min pouring ten 50-cavity loads, ~40 min demoulding, ~100 min wrap and
label at 12 s/pop, ~45 min pack and clean — that's about **7 person-hours per 500 pops**,
or **~75 pops per person-hour**. Roughly double the old implied rate.

> **This is the single most important number in this document and it is an estimate.**
> Measure it on your first three real sessions and correct
> `THROUGHPUT_POPS_PER_LABOUR_HOUR` in `lib/production-cost.ts`. Everything below is
> downstream of it.

---

## 2. The distinction that makes this work

**Labour cost scales with person-hours. Kitchen cost scales with clock-hours.**

Three people on a line burn three person-hours for every hour of rent. That's why the
payroll number and the kitchen number look so different, and it's why running the three
of them *at the same time* rather than on separate days matters financially.

| Month | Pops | Paid person-hours | Kitchen clock-hours | **Clock-hrs/week** |
|---|---|---|---|---|
| Aug | 1,400 | 19 | 6 | **~1.5** |
| Sep | 2,760 | 37 | 12 | **~3** |
| Oct | 4,710 | 63 | 21 | **~5** |
| Nov | 6,480 | 86 | 29 | **~7** |
| Dec | 8,120 | 108 | 36 | **~8** |

**Your "closer to five hours a week" guess was right — for clock-hours, through October.**
By December it's about 8 clock-hours a week, which is one long Saturday session or two
short evenings.

### Does 3 × 10 hrs/week cover it?

3 people × 10 hrs × 4.33 weeks = **130 person-hours/month available.**

| Month | Needed | Available | Headroom |
|---|---|---|---|
| Aug | 19 | 130 | 85% idle |
| Sep | 37 | 130 | 72% idle |
| Oct | 63 | 130 | 52% idle |
| Nov | 86 | 130 | 34% idle |
| Dec | 108 | 130 | **17%** |

**Your staffing instinct is right, and December is the month it stops being generous.**
Two things follow:

- **Don't hire three people in August.** At 19 hours you'd be paying for 111 idle hours.
  Start with **one** person alongside a founder, add the second in October, the third in
  November. Hire ahead of the ramp by one month, not five.
- **Pay for hours worked, not a 10-hour guarantee**, at least until December. Guarantee
  hours once volume actually justifies them — that's when you'll want the retention.

### What "5 hours a week total" would actually buy

5 clock-hours/week with a 3-person line = 65 person-hours/month = **~4,900 pops.** That
covers you comfortably through October and falls ~40% short in December. So the low
estimate isn't wrong, it just expires — around the same time the original plan said DIY
would break, for a completely different reason.

---

## 3. What it costs

**Wage:** $22.50/hr mid-band. **Employer burden: +13%** — FICA 7.65%, FUTA, Utah SUTA,
and workers' comp at a food-manufacturing class rate. **Loaded: $25.43/hr.**

Budget the burden. It is not optional and it is not small — at December volume it's $316
a month on its own.

**Kitchen:** Square Kitchen SLC is **$25/clock-hour with a $450/month minimum**. Another
local operator sells 20 hrs/week across three set days for $1,150/month. At your volumes
the hourly-with-minimum deal wins all year — you never approach 20 hrs/week.

| Month | Labour | Kitchen | **Conversion** | **Per pop** |
|---|---|---|---|---|
| Aug | $483 | $450 (min) | $933 | **$0.67** |
| Sep | $941 | $450 (min) | $1,391 | **$0.50** |
| Oct | $1,602 | $525 | $2,127 | **$0.45** |
| Nov | $2,187 | $725 | $2,912 | **$0.45** |
| Dec | $2,746 | $900 | $3,646 | **$0.45** |

**Conversion settles at $0.45/pop above ~4,000 pops/month.** Below that the $450 minimum
distorts it — you're paying rent on a kitchen you barely use. That's an argument for
batching August and September production into fewer, fuller sessions.

### Against the co-packer

| | Per pop | December total |
|---|---|---|
| **Co-packer** (all-in, as modelled) | **$0.75** | $6,090 |
| **In-house**, materials at `diy_tier2` ($0.90) + $0.45 | **$1.35** | $10,962 |
| **In-house**, materials at `diy_tier3` ($0.68) + $0.45 | **$1.13** | $9,176 |

At today's sourcing you're **$0.60/pop worse** than the modelled co-packer; at tier-3
sourcing, **$0.38/pop worse**.

---

## 4. What that does to the $8,000

December, from the revenue plan, rebuilt on in-house production at tier-3 materials:

| | Co-packer | In-house |
|---|---|---|
| Revenue | $21,985 | $21,985 |
| Gross profit | $13,738 | $10,652 |
| Less opex + marketing | −$2,400 | −$2,400 |
| Less sales commission (Option A) | −$1,691 | −$1,691 |
| **Available for salary** | **$9,647** | **$6,561** |

**In-house lands about $1,440 short of the $8,000 target in December.**

I'm not going to soften that — it's the honest consequence of the switch, and it's better
to see it now than in December. But three things about it:

---

## 5. Why I'd still do it

**1. The $0.75 co-packer figure is not a quote.** It's an estimate that has been sitting
in `cost_basis_cents` since migration 027 and nobody has tested it. What a co-packer would
actually charge for a low-volume specialty run — isomalt, supplement actives, mica, a
foil-wrapped lollipop with a stick — is plausibly **$1.00–1.40/pop**, plus a **~$2,000
setup fee** and line-cleaning charges for the actives changeover. At $1.13 in-house, that
comparison flips. **The entire $3,086 gap rests on an unverified number.**

**2. The co-packer's minimum run is a working-capital event you can't afford yet.** At
~18 g per pop, 25 pops ≈ 1 lb. A 500 lb minimum is 12,500 pops (~$9,400); 1,000 lb is
25,000 pops (~$18,750). The revenue plan's peak working-capital need of $8–12k was
*mostly that first run*. In-house production removes it entirely — you buy materials for
the pops you're about to sell, week by week.

**3. Labour is variable; a co-packer PO is fixed.** If November comes in at half plan,
your labour bill halves with it. A 25,000-pop run doesn't. Given that door productivity
is the assumption most likely to be wrong in the whole plan, having your largest
controllable cost flex with actual demand is worth real money in risk terms.

Plus the things that don't show up in a spreadsheet: no 2–3 month lead time (you can make
500 pops for a festival next week), formula stays in-house, and — importantly — **you
don't have to solve the jambu and chilcuague sourcing problem for a third party** on a
deadline. Both are still unpriced and unsourced. A co-packer will need a compliant,
documented, repeatable supply of both before they'll quote, let alone run.

---

## 6. Closing the $1,440

Not with more hours — labour is already only 25% of the gap. Four levers, roughly in
order of effort:

| Lever | Monthly saving at Dec volume | Effort |
|---|---|---|
| **Materials to tier-3** (deeper isomalt rung, bulk mica, label rolls) | **~$1,790** | Three purchase orders |
| **Throughput 75 → 110 pops/hr** (more moulds, 2nd induction burner, heat sealer) | **~$865** | ~$1,200 one-time |
| **Start wages at $20 not $22.50**, review at 90 days | **~$611** | A sentence in the offer |
| **~1,900 more pops/month** (≈13 more doors, or one better distributor month) | **~$1,600** | The hard one |

**Any two of the first three closes it.** The materials lever alone nearly does — and it
was already on the August action list for reasons that have nothing to do with staffing.

The throughput lever is the one I'd push hardest, because it compounds: at 110 pops/hour
December needs 74 person-hours instead of 108, which also means **3 × 10 hrs/week stops
being tight and starts being comfortable.** ~$1,200 of moulds and a heat sealer is the
best-returning capital you can spend right now.

---

## 7. Get the quote anyway

Even having decided against it for 2026, **ask three co-packers for a real number in
August.** It costs an email and it's the only way to know whether $0.75, $1.13, or $1.40
is the truth. That number decides your 2027 shape, and you want it long before you need it.

Ask specifically for: per-pop price at 12,500 and 25,000 units, minimum run in lbs, setup
fee, whether they'll run a supplement-actives blend and edible mica, and whether they'll
source the actives or need them supplied. Start with the small-startup-friendly houses —
Specialty Food Copackers (WA) explicitly serves brands whose volume is too small
elsewhere — and isomalt-native confectionery shops rather than generic food co-packers.

---

## 8. Before anyone clocks in

**Classify them as W-2 employees, not 1099 contractors.** People working your schedule,
in space you rent, with your equipment, following your process, on your recipe, are
employees under any test that matters. Misclassification exposes you to back taxes,
penalties, and — because this is food production — a workers' comp claim with no policy
behind it. This is the one item on the list that can actually hurt you.

Checklist:

- [ ] **EIN** and Utah state withholding + unemployment registration
- [ ] **Workers' compensation policy** — required in Utah for any employee. Get the
      food-manufacturing class rate quoted; it's the one burden component that varies a
      lot, and the 13% assumption above depends on it
- [ ] **Payroll service** — Gusto/Patriot, ~$40–50/mo + ~$6/employee. Budgeted in the
      $1,520/mo overhead set in migration 044
- [ ] **Food handler permits** for everyone touching unpackaged product — Utah requires
      them, ~$30 each online, valid 3 years
- [ ] **Commissary onboarding** — they'll want a business license, a certificate of
      insurance, and possibly their own health-department registration
- [ ] **Written SOP for the line** — batch card, cook temp, dose checks, allergen and
      changeover procedure, lot coding. You need this for traceability regardless, and
      it's most of what a co-packer would ask for later anyway
- [ ] **Lot coding from day one.** If you ever have to recall, "which batch" is the only
      question that matters and it cannot be reconstructed after the fact

---

## 9. What to do

**August** — hire one person, not three. Book the commissary on the hourly plan with the
$450 minimum. Get workers' comp quoted and payroll set up before the first shift.
**Measure actual pops-per-person-hour on the first three sessions and correct the model.**
Order the extra moulds and the heat sealer. Place the tier-3 material orders.

**September** — one person still. Batch into fewer, fuller sessions so the kitchen minimum
isn't dead weight. Re-run the numbers against measured throughput.

**October** — second hire. Volume crosses 4,000 pops and conversion cost per pop settles.
Flip `active_cost_basis` to `inhouse` in Admin → Wholesale once staff are actually on
the clock.

**November** — third hire. This is when 3 × 10 hrs/week starts being the real schedule.

**December** — hold. Reassess the co-packer in January with a real quote and six months
of measured throughput in hand.

---

## Sources

- [Square Kitchen, Salt Lake City — $25/hr, $450/mo minimum](https://www.foodtruckprofit.com/commissary-kitchens/square-kitchen)
- [Commissary Kitchen SLC](https://www.slccommissary.com/) · [Utah Commissary Club](https://utahcommissaryclub.com/shared-kitchen/) · [Kitchens in Salt Lake City — The Kitchen Door](https://www.thekitchendoor.com/kitchen-rental/utah/salt-lake-city)
- [2026 Payroll Tax Guide: Social Security Wage Bases & FICA Rates — BSI](https://bsi.com/2026-payroll-tax-rates-updated-social-security-wage-bases-and-fica-rates/)
- [Employer Payroll Calculator and 2026 Tax Rates — OnPay](https://onpay.com/payroll/calculator-tax-rates/)
- [What is Payroll Burden? How to Calculate It — Remote People](https://remotepeople.com/glossary/payroll-burden/)
- [Employer Costs for Employee Compensation, March 2026 — BLS](https://www.bls.gov/news.release/pdf/ecec.pdf)
- [Co-Manufacturing Cost and MOQs for CPG — Eightx](https://eightx.co/blog/cpg-comanufacturing-cost-moq)
- [Specialty Food Copackers — small-startup hard candy](https://www.specialtyfoodcopackers.com/Hard-Candy.html)
