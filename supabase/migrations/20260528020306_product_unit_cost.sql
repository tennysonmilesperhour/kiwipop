-- ============================================================================
-- Kiwi Pop — per-product unit cost (material COGS only)
-- ----------------------------------------------------------------------------
-- Until now we had nothing in the DB tying product price to actual cost. The
-- "Kiwi Pop — Wholesale Costing & Margin Workbook" Google Sheet (Drive file
-- 1mRgUQAmbUfPNUekJlDBUb29nwUK1GWYfTQUjiCkTt_c, modified 2026-05-20) holds
-- the BOM × Amazon/bulk-anchored placeholder prices and outputs an active
-- per-pop material cost per flavor. Those numbers are what we trust today,
-- so we lift the per-pop figures into a new `products.cost_cents` column and
-- compute multipack costs as per-pop × pack-size.
--
-- Per-pop active cost from sheet (DIY tier):
--   Kiwi Pop                 $1.27 → 127¢
--   Lemon G. Luci            $1.34 → 134¢
--   Molly's Mint             $1.31 → 131¢
--   Mary Caramel Apple       $1.27 → 127¢
--
-- Variety pack cost assumes equal split across the 4 flavors:
--   per-flavor average = (127 + 134 + 131 + 127) / 4 = 129.75¢
--   8-pack (2 of each)  = 8 × 129.75 ≈ 1038¢
--   20-pack (5 of each) = 20 × 129.75 ≈ 2595¢
--   40-pack (10 of ea.) = 40 × 129.75 ≈ 5190¢
--   12-pack             = 12 × 129.75 ≈ 1557¢
--
-- Non-pop SKUs (Afters/Pregame placeholders, Donation, Taste Test variety)
-- are left at the default 0 — they're either content placeholders or a
-- meta-SKU and shouldn't influence wholesale margin math.
--
-- Cost is material only — overhead/labor/shipping is volume-dependent and
-- belongs in a separate calc when we do quote-time net margin.
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_cents int NOT NULL DEFAULT 0;

COMMENT ON COLUMN products.cost_cents IS
  'Per-unit material cost in cents. Sourced from the Wholesale Costing & Margin Workbook (DIY active tier). Updated by /admin manually — does not include overhead, labor, or shipping.';

-- Per-flavor singles
UPDATE products SET cost_cents = 127 WHERE sku = 'KP-KIWI-KITTY';
UPDATE products SET cost_cents = 134 WHERE sku = 'KP-LUCY-LEMON';
UPDATE products SET cost_cents = 131 WHERE sku = 'KP-MANGO-MOLLY';
UPDATE products SET cost_cents = 127 WHERE sku = 'KP-MARY-MINT';

-- Per-flavor multipacks (per-pop × pack-size)
UPDATE products SET cost_cents = 381  WHERE sku = 'KP-PACK-3';      -- 3 × 127
UPDATE products SET cost_cents = 762  WHERE sku = 'KP-PACK-6';      -- 6 × 127
UPDATE products SET cost_cents = 1524 WHERE sku = 'KP-PACK-12';     -- 12 × 127
UPDATE products SET cost_cents = 2540 WHERE sku = 'KP-PACK-20';     -- 20 × 127

UPDATE products SET cost_cents = 804  WHERE sku = 'KP-LUCY-LEMON-PACK-6';
UPDATE products SET cost_cents = 2680 WHERE sku = 'KP-LUCY-LEMON-PACK-20';

UPDATE products SET cost_cents = 786  WHERE sku = 'KP-MANGO-MOLLY-PACK-6';
UPDATE products SET cost_cents = 2620 WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

UPDATE products SET cost_cents = 762  WHERE sku = 'KP-MARY-MINT-PACK-6';
UPDATE products SET cost_cents = 2540 WHERE sku = 'KP-MARY-MINT-PACK-20';

-- Variety packs at 4-flavor average ($1.2975/pop)
UPDATE products SET cost_cents = 1038 WHERE sku = 'KP-VARIETY-PACK-8';
UPDATE products SET cost_cents = 2595 WHERE sku = 'KP-VARIETY-PACK-20';
UPDATE products SET cost_cents = 5190 WHERE sku = 'KP-VARIETY-PACK-40';
