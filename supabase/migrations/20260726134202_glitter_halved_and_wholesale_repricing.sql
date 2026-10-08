-- ============================================================================
-- Kiwi Pop — halve the glitter, reprice wholesale to margin targets
-- ----------------------------------------------------------------------------
-- Three changes, all driven by the cost analysis in docs/revenue-plan-2026.md:
--
-- 1. GLITTER HALVED. Edible luster dust was 0.1 g/pop at ~$1.00/g — 10¢/pop,
--    18% of the entire bill of materials and the second-largest line after
--    isomalt. Cutting to 0.05 g/pop halves that line. The swirl is a visual
--    accent through the middle of the pop, not a coating, so half the dose
--    still reads on camera and in the hand.
--
-- 2. ISOMALT WHOLESALE SOURCE. The wholesale preset pointed at the LorAnn
--    10 lb pack ($0.0164/g) — that's a bulk-retail price, not a wholesale one.
--    Repointed at the Bakers Authority 45 lb bag ($218.10 → $0.0107/g), the
--    cheapest confirmed no-application source. Larger tiers (25 kg industrial,
--    500 kg import) are quote-only and documented in docs/ingredient-sourcing.md.
--
-- 3. WHOLESALE REPRICED TO MARGIN TARGETS. The old tiers ($2.00 / $1.65 per pop
--    against a $5.00 MSRP) handed retailers a 60–67% margin. Specialty and
--    impulse retail closes at 40–50%; everything above that was margin we were
--    donating. New ladder, with the retailer's margin as the design input:
--
--      door         $2.50  MOQ   100   → 50% retailer margin
--      volume       $2.25  MOQ   500   → 55% retailer margin
--      distributor  $1.85  MOQ 2,500   → resells at $2.50, keeps 26%
--
--    The tier CHECK constraints only allowed ('standard','premium'), so both
--    wholesale_pricing and wholesale_accounts gain a third value. The stored
--    keys stay 'standard'/'premium'/'distributor' to avoid rewriting existing
--    account rows; the customer-facing labels (Door / Volume / Distributor)
--    live in lib/wholesale-tiers.ts.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Glitter: 0.1 g → 0.05 g per pop, every flavor
-- ---------------------------------------------------------------------------
UPDATE bill_of_materials b
SET quantity_per_unit = 0.05
FROM raw_materials rm
WHERE rm.id = b.raw_material_id
  AND rm.sku = 'RM-LUSTER';

-- Reflect the saving in the cost ladder. Luster dust runs roughly 13¢ / 10¢ /
-- 7.5¢ per pop across DIY tiers 1–3 (small jars → 25 g jars → bulk), so
-- halving the dose takes ~7¢ / 5¢ / 4¢ off each tier. The copacker figure is
-- a quoted all-in price per pop, not a materials build-up, so it is left
-- alone — renegotiate it against the new spec at contract time.

-- Singles ---------------------------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 120, "diy_tier2": 90, "diy_tier3": 68, "copacker": 75}'::jsonb
  WHERE sku = 'KP-KIWI-KITTY';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 127, "diy_tier2": 97, "diy_tier3": 74, "copacker": 75}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 124, "diy_tier2": 94, "diy_tier3": 72, "copacker": 75}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 120, "diy_tier2": 90, "diy_tier3": 68, "copacker": 75}'::jsonb
  WHERE sku = 'KP-MARY-MINT';

-- Kiwi Pop multipacks ---------------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 360,  "diy_tier2": 270,  "diy_tier3": 204,  "copacker": 225}'::jsonb
  WHERE sku = 'KP-PACK-3';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 720,  "diy_tier2": 540,  "diy_tier3": 408,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 1440, "diy_tier2": 1080, "diy_tier3": 816,  "copacker": 900}'::jsonb
  WHERE sku = 'KP-PACK-12';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2400, "diy_tier2": 1800, "diy_tier3": 1360, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-PACK-20';

-- Lemon G. Luci multipacks ----------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 762,  "diy_tier2": 582,  "diy_tier3": 444,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2540, "diy_tier2": 1940, "diy_tier3": 1480, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON-PACK-20';

-- Molly's Mint multipacks -----------------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 744,  "diy_tier2": 564,  "diy_tier3": 432,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2480, "diy_tier2": 1880, "diy_tier3": 1440, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

-- Mary Caramel Apple multipacks -----------------------------------------
UPDATE products SET cost_basis_cents = '{"diy_tier1": 720,  "diy_tier2": 540,  "diy_tier3": 408,  "copacker": 450}'::jsonb
  WHERE sku = 'KP-MARY-MINT-PACK-6';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2400, "diy_tier2": 1800, "diy_tier3": 1360, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-MARY-MINT-PACK-20';

-- Variety packs (4-flavor average: t1 $1.2275, t2 $0.9275, t3 $0.705, cp $0.75)
UPDATE products SET cost_basis_cents = '{"diy_tier1": 982,  "diy_tier2": 742,  "diy_tier3": 564,  "copacker": 600}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-8';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 2455, "diy_tier2": 1856, "diy_tier3": 1410, "copacker": 1500}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-20';
UPDATE products SET cost_basis_cents = '{"diy_tier1": 4910, "diy_tier2": 3710, "diy_tier3": 2820, "copacker": 3000}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-40';

-- Re-mirror cost_cents from whatever basis is currently active.
UPDATE products p
SET cost_cents = COALESCE((p.cost_basis_cents->>s.active_cost_basis)::int, p.cost_cents)
FROM app_settings s
WHERE s.id = 1
  AND p.cost_basis_cents ? s.active_cost_basis;

-- ---------------------------------------------------------------------------
-- 2. Isomalt: repoint the wholesale preset at a real wholesale tier
-- ---------------------------------------------------------------------------
UPDATE raw_materials
SET wholesale_url         = 'https://www.bakersauthority.com/products/isomalt-45-lb-bag',
    wholesale_pack_weight = 20411.7,   -- 45 lb in grams
    wholesale_pack_price_cents = 21810 -- $218.10
WHERE sku = 'RM-ISOMALT';

-- ---------------------------------------------------------------------------
-- 3. Wholesale tiers: add 'distributor', reprice to margin targets
-- ---------------------------------------------------------------------------
ALTER TABLE public.wholesale_pricing
  DROP CONSTRAINT IF EXISTS wholesale_pricing_tier_check;
ALTER TABLE public.wholesale_pricing
  ADD CONSTRAINT wholesale_pricing_tier_check
  CHECK (tier IN ('standard', 'premium', 'distributor'));

ALTER TABLE public.wholesale_accounts
  DROP CONSTRAINT IF EXISTS wholesale_accounts_tier_check;
ALTER TABLE public.wholesale_accounts
  ADD CONSTRAINT wholesale_accounts_tier_check
  CHECK (tier IN ('standard', 'premium', 'distributor'));

COMMENT ON COLUMN public.wholesale_pricing.tier IS
  'Wholesale price tier. standard = Door ($2.50, MOQ 100, 50% retailer margin); premium = Volume ($2.25, MOQ 500, 55%); distributor = Distributor ($1.85, MOQ 2500). Display labels live in lib/wholesale-tiers.ts.';

-- Reseed all three tiers across the four single-pop SKUs. Wholesale is sold
-- per pop, so only the singles carry tier pricing — multipacks are DTC.
DELETE FROM public.wholesale_pricing
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE sku IN ('KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT')
);

INSERT INTO public.wholesale_pricing (product_id, tier, price_cents, min_quantity)
SELECT p.id, t.tier, t.price_cents, t.min_quantity
FROM public.products p
CROSS JOIN (
  VALUES
    ('standard',    250,  100),
    ('premium',     225,  500),
    ('distributor', 185, 2500)
) AS t(tier, price_cents, min_quantity)
WHERE p.sku IN ('KP-KIWI-KITTY', 'KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT');

-- Big Skar applied as channel=distributor but was sitting on the 'premium'
-- account tier, which under the new ladder is the mid volume tier. Move them
-- to the tier they actually applied for.
UPDATE public.wholesale_accounts
SET tier = 'distributor'
WHERE intake_notes ILIKE '%channel=distributor%'
  AND approval_status = 'approved';

-- ---------------------------------------------------------------------------
-- 4. Fix the 12-pack, which was priced below every wholesale tier
-- ---------------------------------------------------------------------------
-- KP-PACK-12 sat at $18.00 for 12 pops = $1.50/pop — under the distributor
-- price, on a public SKU. It is currently in_stock = 0 so nothing has leaked.
-- Repriced to $42.00 ($3.50/pop), which slots correctly between the 6-pack
-- ($4.17/pop) and the 20-pack ($3.00/pop).
UPDATE public.products
SET price_cents = 4200
WHERE sku = 'KP-PACK-12';
