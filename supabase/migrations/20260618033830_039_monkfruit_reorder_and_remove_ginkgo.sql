-- ============================================================================
-- Kiwi Pop — fix monk fruit reorder point + remove ginkgo
-- ----------------------------------------------------------------------------
--  • Monk fruit's reorder point was 454 g — an arbitrary 1-lb pack size seeded
--    in migration 016, not derived from per-pop usage. At 1.4 g/pop, 50 pops
--    only needs 70 g, so reset it to the 50-pop basis (matching the low-stock
--    alert threshold).
--  • Remove ginkgo biloba from inventory entirely (cascades its BOM lines on
--    the raw_material_id FK). It was never shown on the storefront.
--
-- Idempotent: safe to re-run.
-- ============================================================================

UPDATE public.raw_materials SET reorder_point = 70 WHERE sku = 'RM-MONKFRUIT';

DELETE FROM public.raw_materials WHERE sku = 'RM-GINKGO';
