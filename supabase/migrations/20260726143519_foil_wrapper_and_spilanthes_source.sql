-- ============================================================================
-- Kiwi Pop — add the missing foil wrapper, repoint jambu at a real supplier
-- ----------------------------------------------------------------------------
-- Two fixes surfaced by costing the BOM in migration 045.
--
-- 1. THE FOIL WAS NEVER IN THE BOM. The wholesale line sheet tells buyers the
--    pops are "individually foiled" — a claim we have been making publicly
--    while carrying no wrapper line at all, only a sticker. Adding it.
--
-- 2. JAMBU'S MOQ PROBLEM WAS AN ARITHMETIC ILLUSION. The sourcing note said
--    the only channel was a quote-only B2B oleoresin at ~1 kg MOQ, and treated
--    that as a blocker. At 0.005 g/pop and 8,120 pops/month we use 40.6 g a
--    month — 1 kg is TWENTY-FOUR YEARS of supply. The problem was never cost
--    or minimum order; it was that nobody had looked for a retail-scale
--    supplier. There are several.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Foil wrapper
-- ---------------------------------------------------------------------------
-- Buyer's current pack: 600 pcs, 4x4 in food-grade aluminium, six colours at
-- 100 each. Four colours are used; two are waste. So a 600-piece pack yields
-- 400 usable wrappers, and the true cost per pop is pack price / 400, not
-- / 600 — a 50% premium created entirely by the two dead colours.
--
-- pack_weight is deliberately set to 400, not 600, so that "+ Retail pack" in
-- Admin → Ingredients increments USABLE stock and logs the real per-unit cost.
-- Counting the dead colours as inventory would flatter both numbers.
--
-- Pack price is an ESTIMATE (~$15.99) — the Amazon listing is 403-blocked from
-- the research environment. Correct it from the order confirmation; it moves
-- the whole line proportionally.
INSERT INTO raw_materials
  (name, sku, unit, quantity_available, quantity_reserved, reorder_point,
   cost_per_unit_cents, reference_url, pack_weight, pack_price_cents)
VALUES
  ('Foil wrapper per pop', 'RM-FOIL', 'ea', 400, 0, 200,
   4.0,
   'https://www.amazon.com/dp/B094J7NFWZ',
   400, 1599)
ON CONFLICT (sku) DO UPDATE SET
  cost_per_unit_cents = EXCLUDED.cost_per_unit_cents,
  reference_url       = EXCLUDED.reference_url,
  pack_weight         = EXCLUDED.pack_weight,
  pack_price_cents    = EXCLUDED.pack_price_cents;

-- One wrapper per pop, every flavour.
INSERT INTO bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, 1, 'ea'
FROM products p
CROSS JOIN raw_materials rm
WHERE rm.sku = 'RM-FOIL'
  AND p.sku IN ('KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT')
  AND NOT EXISTS (
    SELECT 1 FROM bill_of_materials b
    WHERE b.product_id = p.id AND b.raw_material_id = rm.id
  );

COMMENT ON TABLE bill_of_materials IS
  'Per-pop material consumption. Note RM-FOIL is costed against USABLE wrappers (400 of each 600-piece pack) because two of the six colours in the current pack are unused. Switching to single-colour packs removes that premium — see docs/ingredient-sourcing.md.';

-- ---------------------------------------------------------------------------
-- 2. Jambu / spilanthes — a supplier that actually sells at our scale
-- ---------------------------------------------------------------------------
-- Repointed at Barlowe's Herbal Elixirs Spilanthes Acmella 10:1 extract:
-- USA-made, glass-bottled, stearate-free, $14.95 for 60 x 500 mg = 30 g of
-- 10:1 extract → $0.498/g. At 0.005 g/pop that is 0.25¢/pop, essentially
-- identical to the $0.80/g placeholder it replaces (0.40¢). The cost never
-- mattered; having a real, documented, buyable source does.
--
-- 30 g is ~6,000 pops, so December volume is about 1.4 bottles a month. It is
-- a capsule product, so someone has to empty 60 capsules per bottle — ask
-- Barlowe's for bulk powder direct before assuming that is the workflow.
--
-- Upgrade path and alternatives are laid out in docs/ingredient-sourcing.md.
-- The dose is left at 0.005 g: it is right for a 10:1 extract but WILL need a
-- bench test, and would be badly wrong for dried aerial herb, which is far
-- less concentrated. Do not swap supplier grade without re-testing the tingle.
UPDATE raw_materials SET
  name                = 'Jambu / spilanthes (acmella oleracea) 10:1 extract',
  cost_per_unit_cents = 49.8,
  reference_url       = 'https://barlowesherbalelixirs.com/spilanthes-acmella-extract',
  pack_weight         = 30,
  pack_price_cents    = 1495,
  wholesale_url       = 'https://naturmedscientific.com/product/spilanthes-acmella-co2-extract/'
WHERE sku = 'RM-JAMBU';
