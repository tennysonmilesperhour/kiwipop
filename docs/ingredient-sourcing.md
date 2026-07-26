# Ingredient sourcing — Kiwi Pop

**Research date: 2026‑06‑18.**

> ⚠️ **Read this first.** These prices were gathered by automated web research in an
> environment where **live product pages (Amazon, BulkSupplements, WebstaurantStore,
> etc.) are 403‑blocked**, so the dollar figures come from **search‑result snippets, not
> confirmed page loads**. Treat the **product URLs and pack sizes as reliable**, and every
> **price / $‑per‑oz as an estimate to confirm in a browser** before it drives real costs.
> The same numbers are pre‑loaded as restock presets on each material in
> **Admin → Ingredients** (migration 037) — open a material's **Edit** drawer to correct
> the weight/price once you've verified it, then the "+ Retail pack" / "+ Wholesale pack"
> buttons add stock and log cost in one click.

Amazon picks prioritize **lowest price‑per‑ounce** at a reasonable pack size. `$/oz` uses
28.35 g = 1 oz.

## Cost sheet (best estimates)

| Ingredient | Amazon est. $/oz | Amazon pack / price | Wholesale option |
|---|---|---|---|
| Isomalt | **$0.47** | WebstaurantStore LorAnn 10 lb / $74.49 | candy distributors (Bakers Authority, WebstaurantStore) |
| Xylitol | **$0.68** | BulkSupplements 1 kg / ~$23.97 | Bakers Authority 55 lb |
| Monk fruit extract | n/v | BulkSupplements 1 kg (luo han guo) | Jedwards 30% MogV 1 kg (quote) |
| Coconut oil (refined) | n/v | Nutiva 1 gal | Miracle Palm 5 gal |
| Edible luster/mica dust | n/v | (search "edible mica powder") | Bakell wholesale by-the-case |
| Electrolyte (Na+K, unflavored) | n/v | — (no clean single SKU) | blend from PureBulk KCl + sea salt |
| Citric acid | **$0.65** | BulkSupplements 1 kg / ~$22.97 | Pro's Choice 5 lb FCC/USP |
| Kiwi powder (freeze‑dried) | **$6.26** | Jungle Powders 3.5 oz / ~$21.90 | Medikonda / Nutrada bulk (quote) |
| Lemon powder (freeze‑dried) | **$1.62** | Amazon 1 lb / ~$25.99 | BulkSupplements 25 kg / ~$474 (~$0.54/oz) |
| Ground ginger (organic) | **$0.78** | Micro Ingredients 2 lb / ~$24.99 | Starwest 1–5 lb tiers |
| Turmeric extract 95% | **$3.63** | BulkSupplements 1 kg / ~$127.97 | PureBulk curcumin 95% |
| Taurine | **$0.62** | Micro Ingredients 1 kg / ~$21.99 | Nutricost 1 kg / ~$23.95 |
| B12 methylcobalamin | n/v | BulkSupplements — **use the 1% blend**, not pure | PureBulk methylcobalamin |
| Bamboo/paper sticks | **~$0.009 ea** | Wilton 100‑ct | WebstaurantStore 15,000/case / ~$132.99 |
| Round labels | **~$0.04 ea** | Amazon 1.5" round | OnlineLabels OL5375 2" / $7.87 per 200 |
| Jambu / Acmella oleracea | n/v | **not on Amazon as food‑grade powder** | Wellgreen / Ingredients Online (B2B quote) |
| Theobromine | **$1.42** | BulkSupplements 1 kg / ~$49.99 | BulkSupplements direct |
| Magnesium glycinate | **$1.30** | BulkSupplements 500 g / ~$22.97 | BulkSupplements 25 kg / ~$365.65 (~$0.41/oz) |
| Panax ginseng extract | **$3.17** | BulkSupplements 250 g / ~$27.97 | BulkSupplements direct (quote) |
| Spirulina | **$0.94** | Nutricost 2 lb / ~$29.95 | BulkSupplements 1 kg |
| Ashwagandha (KSM‑66) | n/v | Nootropics Depot 30 g (genuine KSM‑66) | Nootropics Depot bulk tiers |
| Maca (organic) | n/v | BulkSupplements 1 kg | Starwest gelatinized maca |
| Ceylon cinnamon (organic) | **$0.94** | Naturevibe 1 lb / ~$14.99 | Starwest direct |
| L‑theanine | **$2.60** | BulkSupplements 250 g / ~$22.97 | PureBulk |
| Chamomile extract | **$2.86** | BulkSupplements 500 g / ~$50.37 | BulkSupplements wholesale |
| Culinary matcha | **$1.16** | BulkSupplements 1 kg / ~$40.96 | bulk.matcha.com 1 kg / ~$45.48 |
| Lucuma | n/v | Food to Live 2 lb | Dolce Superfoods bulk |
| Peppermint essential oil | to source | — | LorAnn / Starwest / bulk EO suppliers |
| Spearmint essential oil | to source | — | LorAnn / Starwest / bulk EO suppliers |
| Apple powder (freeze-dried) | to source | — | Z Natural Foods / Nutrada (freeze-dried fruit) |

`n/v` = no price verifiable in‑tool (page blocked / quote‑only). Exact listing URLs are
stored on each material's `reference_url` / `wholesale_url` in the database.

## Isomalt — the sourcing ladder

Isomalt is **the single largest cost line in the product** — 15 g/pop, ~45% of the
bill of materials before the glitter cut, and now well over half of it. It deserves
its own ladder. Each rung is a real step down in $/g, and each has a different
commitment attached.

| Rung | Source | Pack | Price | $/g | ¢/pop (15 g) | What it costs you |
|---|---|---|---|---|---|---|
| 0 | LorAnn 10 lb (WebstaurantStore) | 4,536 g | $74.49 | $0.0164 | **24.6¢** | *Where we were.* Bulk-retail, not wholesale. |
| 1 | LorAnn 25 lb (WebstaurantStore) | 11,340 g | ~$150 est. | ~$0.0132 | ~19.8¢ | Nothing — same cart, bigger bag. |
| 2 | **Bakers Authority 45 lb** (Isomalt ST‑M) | 20,412 g | **$218.10** | **$0.0107** | **16.0¢** | **Current wholesale preset.** ~$218 per order, no application. |
| 3 | Beneo / Cargill via a US food-ingredient distributor | 25 kg bags | quote | ~$0.004–0.006 est. | ~6–9¢ | Trade references, sometimes a resale certificate. Quote-only. |
| 4 | Direct import (Foodchem, Sinofi, Made-in-China suppliers) | 25 kg bags, 500 kg MOQ | ~$2.75–3.00/kg | ~$0.0029 | **~4.3¢** | ~$1,400 per order, FDA prior notice, importer of record, 6–10 wk sea freight. |

**Where to be, and when:**

- **Now → October: rung 2.** $218.10 for 45 lb is the cheapest source that needs no
  application, no trade references, and no import paperwork. One bag is ~1,360 pops
  of isomalt. Takes 24.6¢ → 16.0¢ per pop immediately.
- **Q4, alongside the co-packer conversation: get rung 3 quotes.** Beneo Palatinit is
  the actual manufacturer of Isomalt ST‑M; Cargill sells IsomaltiDex. Ask their US
  distributors for a 25 kg price. This is the rung a real confectionery brand sits on.
- **Rung 4 is a 2027 decision, not a 2026 one.** The per-gram price is spectacular —
  roughly 6x cheaper than where we started — but 500 kg is ~33,000 pops of isomalt,
  and importing food ingredients means FDA prior notice, an importer of record,
  customs brokerage, and a two-month lead time. Don't take this on while also
  standing up a co-packer.

> Rungs 1, 3, and 4 are **estimates from search snippets** — the supplier pages are
> 403-blocked from this environment. Rung 2 ($218.10) is the one confirmed figure and
> is what's loaded into `raw_materials.wholesale_pack_price_cents`.

**Note on dose:** at 15 g of isomalt per pop, a pop is ~18 g finished and 1 lb ≈ 25
pops. Dropping to 12 g would cut ~3¢/pop at rung 2 and ~17% of shipping weight. That's
a product decision, not a sourcing one — but it's the cheapest cost reduction available
if the smaller pop still lands.

## Edible luster dust — halved at the recipe, not just the invoice

Migration 042 cut the dose from **0.1 g → 0.05 g per pop**. At the $1.00/g placeholder
that's 10¢ → 5¢, taking it from the second-largest BOM line to a mid-pack one. The swirl
runs through the middle of the pop rather than coating it, so half the dose still reads.

The $1.00/g figure is itself the least reliable number in this document — it's a round
placeholder, not a quote. Bakell sells luster dust in 25 g / 50 g / 1 lb / **1 kg**
tiers and advertises up to 63% off small-jar pricing at volume, wholesale by the case.
A 1 kg container should land near **$0.37/g**, which at the new 0.05 g dose would be
**~1.9¢/pop** — down from 10¢ where we started. **Confirm the 1 kg case price before
assuming this.**

## One‑stop wholesale partners

1. **WebstaurantStore** — candy base + packaging (isomalt, sugars, sticks). Bulk‑retail, no application. <https://www.webstaurantstore.com/>
2. **BulkSupplements.com (Wholesale)** — cheapest single source for the actives: taurine, theanine, theobromine, magnesium glycinate, B12, ginseng, turmeric 95%, monk fruit, spirulina, maca, chamomile, matcha. Formal wholesale tier. <https://wholesale.bulksupplements.com/>
3. **Starwest Botanicals** — USDA‑organic botanicals/spices: ginger, Ceylon cinnamon, spirulina, maca, chamomile. Wholesale program, Net‑30. <https://www.starwest-botanicals.com/wholesale-homepage/>
4. **Z Natural Foods** — freeze‑dried fruit powders, matcha, spirulina, superfood powders; custom blending. <https://www.znaturalfoods.com/pages/bulk>
5. **PureBulk** — sweeteners/sugar alcohols, vitamins, minerals, extracts; wholesale + private‑label tier. <https://purebulk.com/>
6. **Jedwards / Bulk Natural Oils** — coconut oil + other oils, sweeteners (xylitol, monk fruit, isomalt), botanical extracts. <https://bulknaturaloils.com/>
7. **Ingredients Online** — B2B marketplace; the route for hard‑to‑source actives like **Jambu/Acmella oleracea oleoresin** at MOQ. <https://www.ingredientsonline.com/>

## Caveats & follow‑ups

- **Prices are snippet estimates, not confirmed live prices** (403 egress block). Re‑check each URL in a browser, or pull via a price API, before committing the cost sheet.
- **Jambu / Acmella oleracea** has no consumer food‑grade powder channel — it's a B2B oleoresin (spilanthol‑standardized), quote‑based, ~1 kg MOQ. Treat as a special‑order line.
- **Monk fruit:** the cheap BulkSupplements SKU uses a maltodextrin carrier; for a pure high‑mogroside‑V extract, source a 50%+ grade from a B2B supplier.
- **B12:** pure methylcobalamin is ~1,000,000 IU/g — micro‑dose territory. Buy the **1% methylcobalamin blend** (on a carrier) for practical blending.
- **KSM‑66 ashwagandha:** many Amazon hits are capsules or non‑genuine; verify the KSM‑66 trademark on the live listing (Nootropics Depot is the credible powder source).
- **Bigger packs = lower $/oz.** Where the table lists a small size (turmeric/B12/ginseng), the same product line offers 250 g / 500 g / 1 kg / 25 kg tiers that beat the listed $/oz once batch volume justifies it.
