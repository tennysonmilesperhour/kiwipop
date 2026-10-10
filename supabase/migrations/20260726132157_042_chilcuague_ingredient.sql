-- ============================================================================
-- Kiwi Pop — add chilcuague (Heliopsis longipes) to the shared functional base
-- ----------------------------------------------------------------------------
-- Chilcuague, the Mexican "golden root," is the second spilanthol source in the
-- base. Its active alkamide (affinin) is the same molecule as the spilanthol in
-- jambu, but the root reads slower and warmer, so it holds the mouth tingle
-- open for the length of the pop instead of fading after the first lick. It
-- sits ALONGSIDE jambu — this migration does not touch RM-JAMBU.
--
-- Dose: 0.005 g/pop, mirroring the jambu line. Like the other botanical doses
-- added in migration 036, this is an ESTIMATE pending formulation sign-off —
-- adjust quantity_per_unit in bill_of_materials once the recipe is locked.
--
-- Sourcing caveat (see docs/ingredient-sourcing.md): there is no food-grade,
-- CoA-backed chilcuague supply chain yet — current sellers are ethnobotanical
-- retailers. Stock is seeded at 0 deliberately; do not build a batch against
-- this line until a supplier with food-grade documentation is in place.
--
-- Regulatory: chilcuague is NOT an authorised novel food in the EU
-- (Regulation 2015/2283). It is US-formula-only; the European version excludes
-- it. Keep it off EU-facing spec sheets as an included ingredient.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. The raw material. Not stocked; reorder point mirrors RM-JAMBU.
INSERT INTO public.raw_materials (name, sku, unit, quantity_available, reorder_point)
VALUES
  ('Chilcuague (heliopsis longipes) root powder', 'RM-CHILCUAGUE', 'g', 0, 5)
ON CONFLICT (sku) DO NOTHING;

-- 2. Shared-base BOM line for every flavor.
WITH maps(flavor_sku, material_sku, qty) AS (
  VALUES
    ('KP-KIWI-KITTY',  'RM-CHILCUAGUE', 0.005),
    ('KP-LUCY-LEMON',  'RM-CHILCUAGUE', 0.005),
    ('KP-MANGO-MOLLY', 'RM-CHILCUAGUE', 0.005),
    ('KP-MARY-MINT',   'RM-CHILCUAGUE', 0.005)
)
INSERT INTO public.bill_of_materials (product_id, raw_material_id, quantity_per_unit, unit)
SELECT p.id, rm.id, m.qty, 'g'
FROM maps m
JOIN public.products p ON p.sku = m.flavor_sku
JOIN public.raw_materials rm ON rm.sku = m.material_sku
WHERE NOT EXISTS (
  SELECT 1 FROM public.bill_of_materials b
  WHERE b.product_id = p.id AND b.raw_material_id = rm.id
);

-- 3. Restock preset, matching the pattern from migration 037. Chilcuague has no
--    wholesale channel yet, so only the retail reference is populated.
UPDATE public.raw_materials
SET reference_url = 'https://mayaherbs.com/ethnobotanicals/chilcuague/dry-root/'
WHERE sku = 'RM-CHILCUAGUE' AND reference_url IS NULL;
