-- ============================================================================
-- Kiwi Pop — flavor sources for mint + caramel apple, and taurine dose fix
-- ----------------------------------------------------------------------------
--  • Molly matcha mint: add peppermint + spearmint essential oils.
--  • Mary caramel apple: add apple powder (lucuma already in the recipe carries
--    the caramel/butterscotch note).
--  • Bump taurine from 150 mg to 250 mg per pop across every flavor to match
--    the dose stated on the storefront.
--
-- New essential oils are tracked in ml; apple powder in g. Per-pop amounts are
-- estimates — adjust quantity_per_unit in bill_of_materials if the recipe
-- differs. Idempotent: safe to re-run.
-- ============================================================================

-- 1. New raw materials (not yet stocked).
INSERT INTO public.raw_materials (name, sku, unit, quantity_available, reorder_point)
VALUES
  ('Peppermint essential oil', 'RM-OIL-PEPPERMINT', 'ml', 0, 30),
  ('Spearmint essential oil',  'RM-OIL-SPEARMINT',  'ml', 0, 30),
  ('Apple powder (freeze-dried)', 'RM-APPLE-PWD',    'g',  0, 100)
ON CONFLICT (sku) DO NOTHING;

-- 2. Wire them into the right flavors. (flavor_sku, material_sku, qty, unit)
WITH maps(flavor_sku, material_sku, qty, unit) AS (
  VALUES
    ('KP-MANGO-MOLLY', 'RM-OIL-PEPPERMINT', 0.1, 'ml'),
    ('KP-MANGO-MOLLY', 'RM-OIL-SPEARMINT',  0.1, 'ml'),
    ('KP-MARY-MINT',   'RM-APPLE-PWD',      0.3, 'g')
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

-- 3. Taurine 150 mg -> 250 mg per pop (every flavor).
UPDATE public.bill_of_materials b
SET quantity_per_unit = 0.25
FROM public.raw_materials rm
WHERE b.raw_material_id = rm.id
  AND rm.sku = 'RM-TAURINE'
  AND b.quantity_per_unit <> 0.25;
