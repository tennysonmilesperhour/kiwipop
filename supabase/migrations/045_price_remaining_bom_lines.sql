-- ============================================================================
-- Kiwi Pop — price the last 13 uncosted BOM lines
-- ----------------------------------------------------------------------------
-- Until now 13 materials carried `cost_per_unit_cents IS NULL`, so the bill of
-- materials silently valued them at zero. Every one now has a number.
--
-- CONFIDENCE IS NOT UNIFORM AND THE COMMENTS SAY SO. Three tiers:
--
--   CONFIRMED  a real price for a real pack, supplied or found intact
--   FOUND      a price located in a search result but not on a loaded page
--   ESTIMATE   inferred from comparable materials already costed in this
--              table, or from the channel's typical range. A placeholder.
--
-- Supplier pages (Amazon, BulkSupplements, LorAnn, eBay) are 403-blocked from
-- the research environment, which is why so few are CONFIRMED. Each ESTIMATE
-- is a starting number to be corrected in Admin → Ingredients once a real
-- invoice exists — not a researched fact.
--
-- Comparable anchors already in this table, used to place the estimates:
--   bulk botanicals (1 kg)     $0.022–0.050/g   taurine, xylitol, citric,
--                                               theobromine, matcha, spirulina
--   standardised extracts      $0.092–0.128/g   ginseng, theanine, chamomile,
--                                               turmeric 95%
--   freeze-dried fruit         $0.057–0.221/g   lemon → kiwi
--
-- WHAT THIS DOES *NOT* DO: it does not touch `cost_basis_cents`. The complete
-- BOM now sums to ~$0.50–0.53/pop against a `diy_tier2` figure of $0.90 — a
-- ~36¢/pop gap that the uncosted lines turn out NOT to explain (they are worth
-- 2.5–9.7¢ depending on flavour). That gap is yield loss, waste, and packaging
-- not modelled here, and it needs explaining on its own terms before the tier
-- ladder can be trusted. Guessing at it here would only hide it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CONFIRMED
-- ---------------------------------------------------------------------------

-- Chilcuague — 100 g for $55.00, buyer-supplied eBay listing (2026-07-26).
-- $0.55/g makes it the most expensive material per gram in the whole formula
-- except luster dust, but at a 0.005 g dose that is 0.275¢/pop. Immaterial.
-- Ethnobotanical marketplace supply is a stopgap, not a wholesale channel —
-- see docs/ingredient-sourcing.md for why that matters before scaling.
UPDATE raw_materials SET
  cost_per_unit_cents = 55.0,
  reference_url       = 'https://www.ebay.com/itm/406463992551',
  pack_weight         = 100,
  pack_price_cents    = 5500
WHERE sku = 'RM-CHILCUAGUE';

-- ---------------------------------------------------------------------------
-- FOUND — located in search results, pack page not loaded
-- ---------------------------------------------------------------------------

-- Caramel flavour — LorAnn Super Strength, 4 oz (118.3 ml) at $17.99.
UPDATE raw_materials SET
  cost_per_unit_cents = 15.207,
  reference_url       = 'https://www.lorannoils.com/',
  pack_weight         = 118.3,
  pack_price_cents    = 1799
WHERE sku = 'RM-CARAMEL';

-- ---------------------------------------------------------------------------
-- ESTIMATE — placeholders. Correct these against a real invoice.
-- ---------------------------------------------------------------------------

-- Jambu / acmella oleracea. THE LEAST RELIABLE NUMBER IN THE TABLE. There is
-- no consumer food-grade channel at all — it is a quote-only B2B
-- spilanthol-standardised oleoresin at roughly 1 kg MOQ. Placed above
-- chilcuague ($0.55/g) because a standardised extract commands more than a
-- dried root. Could plausibly be half this or triple it.
UPDATE raw_materials SET
  cost_per_unit_cents = 80.0,
  wholesale_url       = 'https://www.ingredientsonline.com/',
  pack_weight         = 1000,
  pack_price_cents    = 80000
WHERE sku = 'RM-JAMBU';

-- B12 1% methylcobalamin blend (NOT pure — pure is micro-dose territory).
-- Placed at the standardised-extract tier alongside ginseng and theanine.
UPDATE raw_materials SET
  cost_per_unit_cents = 11.0,
  reference_url       = 'https://www.bulksupplements.com/products/vitamin-b12-1-methylcobalamin',
  pack_weight         = 500,
  pack_price_cents    = 5500
WHERE sku = 'RM-B12';

-- Coconut oil — Nutiva organic virgin, 1 gal ≈ 3,600 g at ~$44.
UPDATE raw_materials SET
  cost_per_unit_cents = 1.222,
  reference_url       = 'https://www.amazon.com/Nutiva-Cold-Pressed-Unrefined-Sustainably-Coconuts/dp/B0016BO5EY',
  pack_weight         = 3600,
  pack_price_cents    = 4400
WHERE sku = 'RM-COCONUT-OIL';

-- Monk fruit extract — BulkSupplements luo han guo, 1 kg. Note this SKU uses a
-- maltodextrin carrier; a pure high-mogroside-V grade costs several times more
-- and would need a B2B quote.
UPDATE raw_materials SET
  cost_per_unit_cents = 7.5,
  reference_url       = 'https://www.amazon.com/Bulksupplements-Fruit-Extract-Powder-Kilogram/dp/B01BKXTO5C',
  pack_weight         = 1000,
  pack_price_cents    = 7500
WHERE sku = 'RM-MONKFRUIT';

-- Electrolyte blend — no clean single SKU; the plan is to blend from bulk KCl
-- plus sea salt, which lands in the bulk-botanical tier next to spirulina.
UPDATE raw_materials SET
  cost_per_unit_cents = 3.5,
  wholesale_url       = 'https://purebulk.com/',
  pack_weight         = 1000,
  pack_price_cents    = 3500
WHERE sku = 'RM-ELECTROLYTE';

-- Ashwagandha KSM-66 — a trademarked branded extract, priced well above
-- generic ashwagandha. Nootropics Depot is the credible powder source; many
-- cheaper listings are not genuine KSM-66.
UPDATE raw_materials SET
  cost_per_unit_cents = 30.0,
  reference_url       = 'https://nootropicsdepot.com/',
  pack_weight         = 250,
  pack_price_cents    = 7500
WHERE sku = 'RM-ASHWA';

-- Maca, organic — BulkSupplements 1 kg. Bulk-botanical tier.
UPDATE raw_materials SET
  cost_per_unit_cents = 3.2,
  reference_url       = 'https://www.amazon.com/BULKSUPPLEMENTS-COM-Organic-Maca-Powder-1kg/dp/B0CFBJZQSQ',
  pack_weight         = 1000,
  pack_price_cents    = 3200
WHERE sku = 'RM-MACA';

-- Lucuma — Food to Live 2 lb (907 g) at ~$36.
UPDATE raw_materials SET
  cost_per_unit_cents = 3.97,
  reference_url       = 'https://www.amazon.com/Organic-Lucuma-Powder-Pounds-Non-Irradiated/dp/B07W1GF6NR',
  pack_weight         = 907,
  pack_price_cents    = 3600
WHERE sku = 'RM-LUCUMA';

-- Apple powder, freeze-dried — placed between lemon ($0.057/g) and kiwi
-- ($0.221/g). Apple is one of the cheaper freeze-dried fruits, so nearer the
-- lemon end.
UPDATE raw_materials SET
  cost_per_unit_cents = 9.03,
  wholesale_url       = 'https://www.znaturalfoods.com/pages/bulk',
  pack_weight         = 454,
  pack_price_cents    = 4100
WHERE sku = 'RM-APPLE-PWD';

-- Peppermint essential oil — LorAnn 16 oz (473 ml) at ~$52.
UPDATE raw_materials SET
  cost_per_unit_cents = 10.999,
  reference_url       = 'https://www.lorannoils.com/products/shop/flavors/super-strength-flavors-food-grade-essential-oils/peppermint-oil-natural',
  pack_weight         = 473,
  pack_price_cents    = 5200
WHERE sku = 'RM-OIL-PEPPERMINT';

-- Spearmint essential oil — LorAnn 16 oz (473 ml) at ~$62. Spearmint typically
-- runs dearer than peppermint.
UPDATE raw_materials SET
  cost_per_unit_cents = 13.108,
  reference_url       = 'https://www.lorannoils.com/products/shop/flavors/super-strength-flavors-food-grade-essential-oils/spearmint-oil-natural',
  pack_weight         = 473,
  pack_price_cents    = 6200
WHERE sku = 'RM-OIL-SPEARMINT';
