# pitch checkpoint · 2026-05-27

**window:** last 28 days  
**data source:** supabase · project `yibliuftqrnfguctrqca`  
**outcome:** PR opened — multiple metrics ≥20% off projection

---

## actuals vs projected

| metric | $5K plan projection | 28d pro-rate target | 28d actual | divergence |
|---|---|---|---|---|
| paid orders | — | — | 37 | — |
| items/SKUs sold | 800–1,200 / 90d | 249–373 | 56 | **−78 to −85%** |
| gross revenue | $4,000–6,000 / 90d | $1,244–$1,867 | $1,084 | −13% vs low / −30% vs mid |
| avg order value | ~$5/pop implied | — | $29.29/order | **+486%** (pack pricing — positive) |
| unique buyers | — | — | 32 | — |
| repeat buyers | "measurable" | — | 4 of 32 (12.5%) | ✓ signal live |
| email list | 500–1,000 / 90d | 156–311 | 47 total | **−70 to −85%** |

---

## key findings

1. **revenue run rate is close to plan low end** — $1,084 in 28 days vs $1,244 pro-rated pace of the $5K low-end is only −13%. the AOV of $29.29 per order far exceeds the $5/pop assumption, which means pack pricing is working well.

2. **unit volume is the gap** — 56 items/SKUs vs 249–373 expected. note: "units" here are order_items rows, which likely represent multi-pop packs. even at 4 pops/pack (224 individual pops), the run rate is still ~63% below the low-end projection.

3. **email list is the most critical miss** — 47 signups vs a 500-name list target. the day 46–90 milestone ("email drop to the 500-name list") is not achievable at the current 1.7 signups/day pace (need 5.6/day). this is the highest-priority gap before the pop-up window opens.

4. **repeat buyer signal exists early** — 4 of 32 buyers have reordered (12.5%) without any retention marketing. this is the best early signal in the data.

5. **all transactions are within the 28-day window** — the store is at earliest-stage. the $1,000 of preorders mentioned in the deck appears to have converted, which accounts for most of the revenue.

---

## milestone risk

**$5K plan — day 46–90** ("paid ads + email drop to the 500-name list"):  
list is at 47/500 — this window is **at risk** if list build doesn't accelerate now.

---

## recommendation

- **focus immediately on email capture** — the pop-up / paid-ads window (day 46–90) depends on a 500-name list. at current pace that window will arrive without the list. add a signup incentive to the storefront now.
- **revenue pace is encouraging** — do not adjust the $5K revenue projection downward; the AOV signal suggests pack pricing at ~$30 is stickier than $5/pop assumed.
- **unit projection needs a revision** — 800–1,200 units/90d is unlikely unless the "unit" counts multi-pop packs and the pack sizes are verified. recommend reconciling SKU pricing vs individual pop count in the next sprint.
- **repeat buyer rate (12.5%) is above typical DTC early-stage** — lean into this; it's the $50K plan's most important foundation metric.
