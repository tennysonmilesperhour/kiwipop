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
| Chilcuague / Heliopsis longipes | n/v | ethnobotanical sellers only (Katukina, Maya Herbs, SAI Herbs on eBay) | direct from Sierra Gorda co‑ops (Guanajuato / Querétaro / San Luis Potosí) — quote |
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

## The last 13 lines — priced 2026‑07‑26 (migration 045)

Thirteen materials had `cost_per_unit_cents IS NULL`, so the BOM was silently valuing
them at zero. All are now costed. **Confidence is not uniform** — treat the tier column
as load‑bearing:

| Material | Unit | Dose/pop | Cost/unit | ¢/pop | Confidence |
|---|---|---|---|---|---|
| **Chilcuague** (heliopsis longipes) | g | 0.005 | **$0.550** | 0.28¢ | **CONFIRMED** — eBay 100 g / $55.00 |
| Caramel flavour (LorAnn SS) | ml | 0.25 | $0.152 | 3.80¢ | FOUND — 4 oz / $17.99 |
| Apple powder (freeze‑dried) | g | 0.3 | $0.090 | 2.71¢ | ESTIMATE — between lemon and kiwi |
| Ashwagandha KSM‑66 | g | 0.1 | $0.300 | 3.00¢ | ESTIMATE — branded extract premium |
| Spearmint EO | ml | 0.1 | $0.131 | 1.31¢ | ESTIMATE — LorAnn 16 oz ≈ $62 |
| Peppermint EO | ml | 0.1 | $0.110 | 1.10¢ | ESTIMATE — LorAnn 16 oz ≈ $52 |
| Electrolyte blend | g | 0.25 | $0.035 | 0.88¢ | ESTIMATE — bulk KCl + sea salt |
| Monk fruit extract | g | 0.0545 | $0.075 | 0.41¢ | ESTIMATE — BulkSupplements 1 kg |
| **Jambu** (acmella oleracea) | g | 0.005 | $0.800 | 0.40¢ | **ESTIMATE — least reliable in the table** |
| Lucuma | g | 0.1 | $0.040 | 0.40¢ | ESTIMATE — Food to Live 2 lb |
| Maca (organic) | g | 0.1 | $0.032 | 0.32¢ | ESTIMATE — BulkSupplements 1 kg |
| B12 1% methylcobalamin | g | 0.025 | $0.110 | 0.28¢ | ESTIMATE — extract tier |
| Coconut oil | g | 0.2222 | $0.012 | 0.27¢ | ESTIMATE — Nutiva 1 gal ≈ $44 |

**Anchors used to place the estimates** (all already costed in the database):

| Tier | $/g | Examples |
|---|---|---|
| Bulk botanicals, 1 kg | $0.022–0.050 | taurine, xylitol, citric acid, theobromine, matcha, spirulina |
| Standardised extracts | $0.092–0.128 | ginseng, L‑theanine, chamomile, turmeric 95% |
| Freeze‑dried fruit | $0.057–0.221 | lemon → kiwi |

### What it added, per flavour

| Flavour | Added by these 13 | Complete BOM |
|---|---|---|
| Kiwi Pop | 2.50¢ | $0.520 |
| Lemon G. Luci | 5.50¢ | $0.513 |
| Molly's Mint | 4.90¢ | $0.496 |
| Mary Caramel Apple | 9.72¢ | $0.532 |

## Jambu / spilanthes — the MOQ problem was arithmetic, not sourcing

The old note said jambu had "no consumer food-grade channel" and only a quote-only B2B
oleoresin at ~1 kg MOQ, and treated that as a blocker. **Run the numbers on that MOQ:**

> 0.005 g/pop × 8,120 pops/month = **40.6 g per month**. 1 kg is **24 years of supply.**

Nobody was ever going to buy that. The real requirement is ~40 g/month of something
spilanthol-bearing, documented, and food-grade — which several suppliers sell.

| Option | Form | Scale | $/g | ¢/pop @0.005 g | Verdict |
|---|---|---|---|---|---|
| **Barlowe's Herbal Elixirs** — Spilanthes Acmella **10:1 extract** | capsules, 60 × 500 mg = 30 g | $14.95 | **$0.498** | **0.25¢** | **Switch to this now.** USA-made, glass-bottled, stearate-free, sold direct. 30 g ≈ 6,000 pops. |
| **NaturMed Scientific** — Spilanthes acmella **CO2 extract** | powder, up to 30% spilanthol | quote | quote | — | **The upgrade.** Highest potency, US-based, CO2 extracts often sell below 1 kg. Get a quote for 50–100 g. |
| **Mountain Rose Herbs** — Spilanthes, organic | dried aerial (leaf + flower) | retail + bulk lb | ~$0.05–0.09 est. | — | **Best on documentation** — organic certified, COA available, real wholesale programme. But it is *herb*, not extract. |
| **Hawaii Pharm** — alcohol-free glycerite | liquid tincture | 2–32 fl oz | — | — | **No.** Adding a water/glycerin liquid to isomalt at ~300 °F spatters and risks recrystallisation. |
| Wellgreen / E.K. Herb — 10:1, 20:1, 5% spilanthol | powder | **1 kg MOQ** | low | — | ISO/GMP/Halal/Kosher. Correct for 2027. Absurd today. |

**Recommendation: Barlowe's now, NaturMed quote in parallel.** The cost is a rounding
error either way (0.25¢/pop vs the 0.40¢ placeholder it replaces) — what you are buying
is a real supplier with a real label, which is what a wholesale buyer or a commissary
will ask for.

Two cautions:

- **It is a capsule product.** 60 capsules to empty per bottle, ~1.4 bottles a month by
  December. Ask Barlowe's for bulk powder direct before accepting that as the workflow.
- **Do not change grade without re-testing the dose.** 0.005 g is right for a 10:1
  extract. Dried aerial herb is far less concentrated — plausibly 10–50× more by weight
  for the same tingle, which means noticeably more plant colour, bitterness, and
  particulate in a clear isomalt candy. That is a bench test, not a spreadsheet edit.

## Foil wrapper — a third of every pack is thrown away

The line sheet tells wholesale buyers the pops are **"individually foiled."** Until
migration 046 there was **no wrapper line in the bill of materials at all** — only a
sticker. We were making a public product claim we weren't costing.

Current pack ([Amazon B094J7NFWZ](https://www.amazon.com/dp/B094J7NFWZ)): 600 pcs,
4×4 in food-grade aluminium, six colours at 100 each. **Four colours are used, two are
waste** — so a 600-piece pack yields **400 usable wrappers.**

| | Cost |
|---|---|
| Pack (est. $15.99 — confirm from the order) | $15.99 / 600 = $0.0267 nominal |
| **True cost per usable wrapper** | **$15.99 / 400 = $0.040** |
| **Per pop** | **4.0¢** — as big as the label sticker |

The two dead colours add **50% to the effective cost of every wrapper.** Three ways out,
best last:

1. **Buy four single-colour packs** instead of one six-colour pack. Waste → zero.
   4.0¢ → ~2.7¢/pop, **~$105/month** at December volume.
2. **Buy a bulk single-colour count** (1,000-sheet packs exist at ~$0.015–0.020/sheet).
   → ~1.5–2.0¢/pop.
3. **Use one foil colour for all four flavours** and let the label carry flavour
   identity — it already does. That unlocks option 2 at full scale: **4.0¢ → ~1.5¢,
   about $200/month.** The trade is losing a colour cue on the shelf, which matters less
   than it sounds in a counter display where the label is what gets read.

Meanwhile: **don't bin the two unused colours.** Use them for event samples, seasonal
runs, and the wholesale display units.

> **Jambu superseded.** The $0.80/g placeholder above was replaced in migration 046 with
> a real supplier at $0.498/g — see the section immediately above. **Chilcuague is now the
> only remaining sourcing risk**: $0.55/g is a real price, but an eBay ethnobotanical
> listing is not a wholesale channel with a COA, a food-grade attestation, or lot
> traceability. Ask the seller for a COA; if none exists, the Sierra Gorda co-ops or a US
> botanical importer are the route. It will not move the cost model either way.

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

Migration 043 cut the dose from **0.1 g → 0.05 g per pop**. At the $1.00/g placeholder
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
- **Chilcuague / Heliopsis longipes** is the second spilanthol source in the base (its alkamide, affinin, is the same molecule). Today it is only available through ethnobotanical/shamanic retailers selling whole or powdered root for non‑food framing — **there is no food‑grade, food‑safety‑documented supply chain yet.** Before this goes into a production batch we need a supplier who will provide a CoA, heavy‑metal and micro testing, and a food‑grade attestation; the Sierra Gorda growing co‑ops are the route worth pursuing. Also note the plant is wild‑harvested and subject to over‑collection pressure in its native range — sustainability of supply is a real risk, not a formality.
- **Chilcuague is US‑only.** It is **not** an authorised novel food in the EU (Regulation 2015/2283), so the European formula excludes it. Do not put it on any EU‑facing spec sheet as an included ingredient.
- **Monk fruit:** the cheap BulkSupplements SKU uses a maltodextrin carrier; for a pure high‑mogroside‑V extract, source a 50%+ grade from a B2B supplier.
- **B12:** pure methylcobalamin is ~1,000,000 IU/g — micro‑dose territory. Buy the **1% methylcobalamin blend** (on a carrier) for practical blending.
- **KSM‑66 ashwagandha:** many Amazon hits are capsules or non‑genuine; verify the KSM‑66 trademark on the live listing (Nootropics Depot is the credible powder source).
- **Bigger packs = lower $/oz.** Where the table lists a small size (turmeric/B12/ginseng), the same product line offers 250 g / 500 g / 1 kg / 25 kg tiers that beat the listed $/oz once batch volume justifies it.
