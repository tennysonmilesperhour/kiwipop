-- ============================================================================
-- Kiwi Pop — re-seed per-pop cost from Tier 1 to Tier 2 (Amazon-anchored)
-- ----------------------------------------------------------------------------
-- Migration 024 seeded products.cost_cents from the Wholesale Costing &
-- Margin Workbook's "Active" column, which is currently using **Tier 1**
-- (small-bulk) ingredient prices. Tier 2 in the same sheet is "Medium /
-- Amazon-anchored" — the same suppliers, the same SKUs, just the next
-- pouch size up. Those prices are achievable today (no new supplier
-- relationships) and cut ~25% off material cost per pop, mostly from
-- packaging (wrappers, stickers, sticks bought in 1000-count lots),
-- isomalt and xylitol in 2kg pouches, and luster dust in 25g jars.
--
-- New per-pop cost basis (Tier 2):
--   Kiwi Pop                $0.95  ($1.27 → $0.95, -25%)
--   Lemon G. Luci           $1.02  ($1.34 → $1.02, -24%)
--   Molly's Mint            $0.99  ($1.31 → $0.99, -24%)
--   Mary Caramel Apple      $0.95  ($1.27 → $0.95, -25%)
--
-- Multipack cost = per-pop × pack-size, matching the formula in 024.
-- Variety pack cost uses the 4-flavor average ($0.9775/pop ≈ 98¢).
-- ============================================================================

-- Singles
UPDATE products SET cost_cents = 95  WHERE sku = 'KP-KIWI-KITTY';
UPDATE products SET cost_cents = 102 WHERE sku = 'KP-LUCY-LEMON';
UPDATE products SET cost_cents = 99  WHERE sku = 'KP-MANGO-MOLLY';
UPDATE products SET cost_cents = 95  WHERE sku = 'KP-MARY-MINT';

-- Kiwi Pop multipacks
UPDATE products SET cost_cents = 285  WHERE sku = 'KP-PACK-3';   -- 3 × 95
UPDATE products SET cost_cents = 570  WHERE sku = 'KP-PACK-6';   -- 6 × 95
UPDATE products SET cost_cents = 1140 WHERE sku = 'KP-PACK-12';  -- 12 × 95
UPDATE products SET cost_cents = 1900 WHERE sku = 'KP-PACK-20';  -- 20 × 95

-- Lemon G. Luci multipacks
UPDATE products SET cost_cents = 612  WHERE sku = 'KP-LUCY-LEMON-PACK-6';   -- 6 × 102
UPDATE products SET cost_cents = 2040 WHERE sku = 'KP-LUCY-LEMON-PACK-20';  -- 20 × 102

-- Molly's Mint multipacks
UPDATE products SET cost_cents = 594  WHERE sku = 'KP-MANGO-MOLLY-PACK-6';  -- 6 × 99
UPDATE products SET cost_cents = 1980 WHERE sku = 'KP-MANGO-MOLLY-PACK-20'; -- 20 × 99

-- Mary Caramel Apple multipacks
UPDATE products SET cost_cents = 570  WHERE sku = 'KP-MARY-MINT-PACK-6';   -- 6 × 95
UPDATE products SET cost_cents = 1900 WHERE sku = 'KP-MARY-MINT-PACK-20';  -- 20 × 95

-- Variety packs at 4-flavor average ($0.9775/pop)
UPDATE products SET cost_cents = 782  WHERE sku = 'KP-VARIETY-PACK-8';   -- 8 × 97.75 ≈ 782
UPDATE products SET cost_cents = 1955 WHERE sku = 'KP-VARIETY-PACK-20';  -- 20 × 97.75 = 1955
UPDATE products SET cost_cents = 3910 WHERE sku = 'KP-VARIETY-PACK-40';  -- 40 × 97.75 = 3910
