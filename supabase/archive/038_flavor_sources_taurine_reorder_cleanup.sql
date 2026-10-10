-- ============================================================================
-- Kiwi Pop — flavor sourcing fixes, taurine bump, reorder-point correction,
--            and ginkgo removal
-- ----------------------------------------------------------------------------
-- 1. Remove ginkgo (RM-GINKGO) from inventory entirely. Deleting the
--    raw_materials row cascades its bill_of_materials lines, restock-log rows,
--    and presets (ON DELETE CASCADE). Ginkgo is no longer part of the formula.
--
-- 2. Bump taurine to 250 mg / pop (0.25 g) across every flavor's BOM. The
--    storefront already advertises 250 mg; the recipe lagged at 0.15 g.
--
-- 3. Correct reorder points that were seeded as arbitrary bag sizes rather than
--    usage-based minimums:
--      • Monk fruit 454 g (1 lb) → 70 g  (1.4 g/pop × 50-pop low-stock floor)
--      • Electrolyte 325 g       → 13 g  (0.25 g/pop × 50-pop low-stock floor)
--    50 pops is LOW_STOCK_POP_THRESHOLD (lib/inventory.ts), so "Reorder at" now
--    lines up with the producible-pops alert.
--
-- 4. Wire up the real flavoring for mint + Mary. Migration 035 deleted the old
--    mango/peppermint LorAnn oils, leaving those two flavors with no flavoring
--    material in the BOM. Add the actual sources:
--      • Molly Matcha Mint (KP-MANGO-MOLLY): peppermint + spearmint essential oils
--      • Mary Caramel Apple (KP-MARY-MINT): caramel flavor + apple powder
--        (lucuma is already on the BOM for butterscotch depth)
--    New materials seed at 0 stock — restock them in Admin → Ingredients. Per-pop
--    amounts are reasonable estimates; adjust quantity_per_unit if the recipe
--    differs.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Remove ginkgo ----------------------------------------------------------
DELETE FROM public.raw_materials WHERE sku = 'RM-GINKGO';

-- 2. Taurine → 250 mg / pop -------------------------------------------------
UPDATE public.bill_of_materials bom
SET quantity_per_unit = 0.25
FROM public.raw_materials rm
WHERE bom.raw_material_id = rm.id
  AND rm.sku = 'RM-TAURINE';

-- 3. Usage-based reorder points ---------------------------------------------
UPDATE public.raw_materials SET reorder_point = 70 WHERE sku = 'RM-MONKFRUIT';
UPDATE public.raw_materials SET reorder_point = 13 WHERE sku = 'RM-ELECTROLYTE';

-- 4a. New flavoring raw materials -------------------------------------------
INSERT INTO public.raw_materials (name, sku, unit, quantity_available, reorder_point)
VALUES
  ('Peppermint essential oil', 'RM-OIL-PEPPERMINT', 'ml', 0, 5),
  ('Spearmint essential oil',  'RM-OIL-SPEARMINT',  'ml', 0, 5),
  ('Caramel flavor',           'RM-CARAMEL',        'ml', 0, 13),
  ('Apple powder (freeze-dried)', 'RM-APPLE-PWD',   'g',  0, 15)
ON CONFLICT (sku) DO NOTHING;

-- 4b. Bill-of-materials lines for the new flavoring -------------------------
WITH maps(flavor_sku, material_sku, qty, unit) AS (
  VALUES
    -- molly matcha mint: peppermint + spearmint essential oils
    ('KP-MANGO-MOLLY', 'RM-OIL-PEPPERMINT', 0.1::numeric, 'ml'),
    ('KP-MANGO-MOLLY', 'RM-OIL-SPEARMINT',  0.1::numeric, 'ml'),
    -- mary caramel apple: caramel flavor + apple powder
    ('KP-MARY-MINT',   'RM-CARAMEL',        0.25::numeric, 'ml'),
    ('KP-MARY-MINT',   'RM-APPLE-PWD',      0.3::numeric,  'g')
)
INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, m.qty, m.unit
FROM maps m
JOIN public.products p ON p.sku = m.flavor_sku
JOIN public.raw_materials rm ON rm.sku = m.material_sku
WHERE NOT EXISTS (
  SELECT 1 FROM public.bill_of_materials b
  WHERE b.product_id = p.id AND b.raw_material_id = rm.id
);
