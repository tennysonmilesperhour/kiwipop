-- ============================================================================
-- Kiwi Pop — production cost basis (DIY × tier ladder + copacker)
-- ----------------------------------------------------------------------------
-- Migration 026 re-seeded `products.cost_cents` to Tier 2 ingredient prices.
-- But the workbook actually models four distinct cost scenarios and the
-- admin needs to flip between them to see "what if we sourced bulk?" or
-- "what if we used a copacker?" without losing the other numbers.
--
-- Each product now carries the full set in `cost_basis_cents jsonb`:
--
--   diy_tier1  small-bulk ingredient prices (Amazon small packs / craft
--              suppliers). What 024 originally seeded.
--   diy_tier2  Amazon-anchored mid-bulk (the next pouch/lot size up).
--              The current default per migration 026.
--   diy_tier3  large bulk (4500–10000g lots, 10000ct packaging). Real
--              inventory commitment but materially cheaper per pop.
--   copacker   external manufacturer at ~$0.75/pop including labor &
--              packaging. Per the workbook's Operating Overhead model,
--              this is roughly flat per pop regardless of flavor.
--
-- app_settings gains `active_cost_basis` so the admin can switch the
-- whole system between scenarios from one place. A trigger keeps the
-- existing `products.cost_cents` (read by quotes, margin display, etc.)
-- in sync with `cost_basis_cents[active_basis]` so the rest of the app
-- doesn't need to know which basis is live.
-- ============================================================================

-- Multi-basis cost storage
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_basis_cents jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.cost_basis_cents IS
  'Per-unit cost in cents under each production scenario. Keys: diy_tier1, diy_tier2, diy_tier3, copacker. The active scenario''s value is mirrored into cost_cents by a trigger on app_settings.';

-- Singles ----------------------------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 127, "diy_tier2": 95,  "diy_tier3": 72, "copacker": 75}'::jsonb
  WHERE sku = 'KP-KIWI-KITTY';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 134, "diy_tier2": 102, "diy_tier3": 78, "copacker": 75}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 131, "diy_tier2": 99,  "diy_tier3": 76, "copacker": 75}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 127, "diy_tier2": 95,  "diy_tier3": 72, "copacker": 75}'::jsonb
  WHERE sku = 'KP-MARY-MINT';

-- Kiwi Pop multipacks ----------------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 381,  "diy_tier2": 285,  "diy_tier3": 216,  "copacker": 225}'::jsonb
  WHERE sku = 'KP-PACK-3';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 762,  "diy_tier2": 570,  "diy_tier3": 432,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 1524, "diy_tier2": 1140, "diy_tier3": 864,  "copacker": 900}'::jsonb
  WHERE sku = 'KP-PACK-12';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2540, "diy_tier2": 1900, "diy_tier3": 1440, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-PACK-20';

-- Lemon G. Luci multipacks ----------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 804,  "diy_tier2": 612,  "diy_tier3": 468,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2680, "diy_tier2": 2040, "diy_tier3": 1560, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON-PACK-20';

-- Molly's Mint multipacks ------------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 786,  "diy_tier2": 594,  "diy_tier3": 456,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2620, "diy_tier2": 1980, "diy_tier3": 1520, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

-- Mary Caramel Apple multipacks -----------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 762,  "diy_tier2": 570,  "diy_tier3": 432,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-MARY-MINT-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2540, "diy_tier2": 1900, "diy_tier3": 1440, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-MARY-MINT-PACK-20';

-- Variety packs (4-flavor average: t1=$1.2975, t2=$0.9775, t3=$0.745, cp=$0.75)
UPDATE products SET cost_basis_cents = '{"diy_tier1": 1038, "diy_tier2": 782,  "diy_tier3": 596,  "copacker": 600}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-8';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2595, "diy_tier2": 1955, "diy_tier3": 1490, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-20';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 5190, "diy_tier2": 3910, "diy_tier3": 2980, "copacker": 3000}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-40';

-- App settings: active basis selector
ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS active_cost_basis text NOT NULL DEFAULT 'diy_tier2'
    CHECK (active_cost_basis IN ('diy_tier1', 'diy_tier2', 'diy_tier3', 'copacker'));

-- Trigger: when active_cost_basis flips, re-mirror products.cost_cents
-- from the chosen JSONB key. Products that don't have a value for the
-- new basis keep their existing cost_cents (admin can fill it in).
CREATE OR REPLACE FUNCTION public.sync_product_cost_from_basis()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.active_cost_basis IS DISTINCT FROM OLD.active_cost_basis THEN
    UPDATE products
    SET cost_cents = COALESCE(
      (cost_basis_cents->>NEW.active_cost_basis)::int,
      cost_cents
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_cost_from_basis ON app_settings;
CREATE TRIGGER trg_sync_product_cost_from_basis
  AFTER UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_cost_from_basis();

-- Make sure cost_cents matches the seeded basis right now
UPDATE products p
SET cost_cents = COALESCE(
  (p.cost_basis_cents->>s.active_cost_basis)::int,
  p.cost_cents
)
FROM app_settings s
WHERE s.id = 1
  AND p.cost_basis_cents ? s.active_cost_basis;
