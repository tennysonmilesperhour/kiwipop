-- ============================================================================
-- Kiwi Pop — correct monk fruit per-pop dose
-- ----------------------------------------------------------------------------
-- Monk fruit was carried at 1.4 g/pop, which is far too high. The real recipe
-- is 3 g per 55-pop batch = 0.0545 g/pop. Fix the dose on every flavor's BOM
-- and re-align the reorder point to the 50-pop basis (0.0545 * 50 ≈ 3 g).
--
-- Idempotent: safe to re-run.
-- ============================================================================

UPDATE public.bill_of_materials b
SET quantity_per_unit = 0.0545
FROM public.raw_materials rm
WHERE b.raw_material_id = rm.id
  AND rm.sku = 'RM-MONKFRUIT';

UPDATE public.raw_materials
SET reorder_point = 3
WHERE sku = 'RM-MONKFRUIT';
