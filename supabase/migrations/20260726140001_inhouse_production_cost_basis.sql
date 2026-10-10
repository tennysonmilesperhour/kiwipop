-- ============================================================================
-- Kiwi Pop — in-house staffed production as a costed scenario
-- ----------------------------------------------------------------------------
-- The cost ladder had four scenarios, three of which (diy_tier1/2/3) price
-- MATERIALS ONLY and assume the founders do the work for free, and one
-- (copacker) which is an all-in per-pop price for buying the finished pop.
--
-- There was no way to model the option actually being taken: making them
-- ourselves with PAID staff in a rented commissary kitchen. That sits between
-- the two — our materials, our formula, our schedule, but a real labour line.
--
-- New basis `inhouse` = materials at diy_tier2 + $0.45/pop conversion.
--
-- Conversion is labour + kitchen rent, modelled in lib/production-cost.ts:
--
--   Throughput      75 pops per person-hour on a 3-person parallel line
--   Wage            $22.50/hr, +13% employer burden = $25.43/hr loaded
--   Kitchen         $25/clock-hour, $450/month minimum (Square Kitchen SLC)
--
-- The load-bearing distinction: LABOUR scales with person-hours, KITCHEN
-- scales with clock-hours. Three people on a line burn three person-hours per
-- clock-hour but rent only one, which is why December needs ~108 paid hours
-- but only ~8 kitchen hours a week.
--
-- Conversion cost per pop FALLS with volume as the kitchen minimum spreads:
-- ~$0.67/pop at 1,400/month, settling at ~$0.45 above ~4,000/month. The 45¢
-- seeded here is the at-scale figure; August and September will run higher.
--
-- Materials are anchored to diy_tier2 because that is where sourcing actually
-- is today. Reaching diy_tier3 pulls every number below down by ~22¢/pop.
--
-- NOTE: `inhouse` is deliberately NOT made the active basis here. Flip it in
-- Admin → Wholesale once staff are actually hired and on the clock.
-- ============================================================================

ALTER TABLE app_settings
  DROP CONSTRAINT IF EXISTS app_settings_active_cost_basis_check;
ALTER TABLE app_settings
  ADD CONSTRAINT app_settings_active_cost_basis_check
  CHECK (active_cost_basis IN
    ('diy_tier1', 'diy_tier2', 'diy_tier3', 'copacker', 'inhouse'));

COMMENT ON COLUMN products.cost_basis_cents IS
  'Per-unit cost in cents under each production scenario. Keys: diy_tier1, diy_tier2, diy_tier3 (materials only — founder labour unpaid); copacker (all-in, finished pop delivered); inhouse (materials at diy_tier2 + $0.45/pop staffed conversion). The active scenario''s value is mirrored into cost_cents by a trigger on app_settings.';

-- Singles: diy_tier2 + 45¢ ------------------------------------------------
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 135}'::jsonb
  WHERE sku = 'KP-KIWI-KITTY';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 142}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 139}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 135}'::jsonb
  WHERE sku = 'KP-MARY-MINT';

-- Kiwi Pop multipacks ----------------------------------------------------
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 405}'::jsonb
  WHERE sku = 'KP-PACK-3';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 810}'::jsonb
  WHERE sku = 'KP-PACK-6';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 1620}'::jsonb
  WHERE sku = 'KP-PACK-12';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 2700}'::jsonb
  WHERE sku = 'KP-PACK-20';

-- Lemon G. Luci multipacks ----------------------------------------------
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 852}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON-PACK-6';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 2840}'::jsonb
  WHERE sku = 'KP-LUCY-LEMON-PACK-20';

-- Molly's Mint multipacks ------------------------------------------------
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 834}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY-PACK-6';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 2780}'::jsonb
  WHERE sku = 'KP-MANGO-MOLLY-PACK-20';

-- Mary Caramel Apple multipacks -----------------------------------------
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 810}'::jsonb
  WHERE sku = 'KP-MARY-MINT-PACK-6';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 2700}'::jsonb
  WHERE sku = 'KP-MARY-MINT-PACK-20';

-- Variety packs (4-flavor average: $0.9275 materials + $0.45 = $1.3775/pop)
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 1102}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-8';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 2756}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-20';
UPDATE products SET cost_basis_cents = cost_basis_cents || '{"inhouse": 5510}'::jsonb
  WHERE sku = 'KP-VARIETY-PACK-40';

-- Payroll admin + food-handler permits are new recurring overhead the old
-- $150/month figure never contemplated. Bump to a realistic operating number:
-- hosting/software $150, product liability $175, bookkeeping $200, packing
-- supplies $150, marketplace + trade-show amortisation $400, payroll service
-- $120, misc/travel $325.
UPDATE app_settings
SET monthly_overhead_cents = 152000
WHERE id = 1 AND monthly_overhead_cents < 152000;
