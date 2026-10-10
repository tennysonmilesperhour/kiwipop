-- ============================================================================
-- Kiwi Pop — retire discontinued ingredients
-- ----------------------------------------------------------------------------
-- Remove these raw materials (and their bill-of-materials lines, which cascade
-- on the raw_material_id FK) from inventory entirely:
--   • Liquid sunflower lecithin  (RM-LECITHIN)
--   • Lollipop wrapper/packaging (RM-WRAPPER)
--   • Water (filtered)           (RM-WATER)
--   • LorAnn flavor oil — Lemon  (RM-OIL-LEMON)
--   • LorAnn flavor oil — Peppermint (RM-OIL-PEPPRMNT)
--   • Everything mango: Mango powder (RM-MANGO-PWD) + Mango oil (RM-OIL-MANGO)
--
-- These were leftovers from the pre-rename recipes (e.g. the old mango/peppermint
-- flavor oils no longer match the current flavor lineup). Deleting the
-- raw_materials row removes its bill_of_materials lines (ON DELETE CASCADE),
-- its restock-log rows (ON DELETE CASCADE), and any restock presets with it.
--
-- Idempotent: safe to re-run.
-- ============================================================================

DELETE FROM public.raw_materials
WHERE sku IN (
  'RM-LECITHIN',
  'RM-WRAPPER',
  'RM-WATER',
  'RM-OIL-LEMON',
  'RM-OIL-PEPPRMNT',
  'RM-MANGO-PWD',
  'RM-OIL-MANGO'
);
