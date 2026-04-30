-- ============================================================================
-- Kiwi Pop — wholesale intake column + tier-pricing seed
-- ----------------------------------------------------------------------------
-- Adds free-form intake_notes + requested_at to wholesale_accounts so the
-- public /wholesale/apply form can capture phone, channel, volume, and a
-- short message without losing data. Then seeds standard + premium tier
-- prices for Kiwi Kitty (the live flavor) at the rates from
-- kiwi_pop_costing.xlsx.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Capture intake context. tax_id stays as the formal EIN/tax id.
ALTER TABLE public.wholesale_accounts
  ADD COLUMN IF NOT EXISTS intake_notes TEXT,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Allow a customer to insert their own application row (in addition to
--    the existing 'wholesale_accounts_self_insert' policy from migration 002,
--    which already allows `auth.uid() = user_id` inserts). This is here as a
--    safety net in case migration 002 wasn't run cleanly.
DROP POLICY IF EXISTS "wholesale_accounts_self_insert" ON public.wholesale_accounts;
CREATE POLICY "wholesale_accounts_self_insert" ON public.wholesale_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wholesale_accounts_self_update" ON public.wholesale_accounts;
CREATE POLICY "wholesale_accounts_self_update" ON public.wholesale_accounts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Customers can update their own intake details but cannot promote
    -- themselves to approved or change tier. Admins do that via
    -- /api/admin/wholesale-accounts/[id].
    AND approval_status = (
      SELECT approval_status FROM public.wholesale_accounts WHERE id = wholesale_accounts.id
    )
    AND tier = (
      SELECT tier FROM public.wholesale_accounts WHERE id = wholesale_accounts.id
    )
  );

-- 3. Seed Kiwi Kitty wholesale pricing at the rates from costing.xlsx.
--    Tier A small order = standard / $2.00 per pop, MOQ 50.
--    Tier C large order = premium / $1.65 per pop, MOQ 200.
INSERT INTO public.wholesale_pricing (product_id, tier, price_cents, min_quantity)
SELECT p.id, t.tier, t.price_cents, t.min_quantity
FROM public.products p
CROSS JOIN (VALUES
  ('standard'::TEXT, 200,  50),
  ('premium'::TEXT,  165, 200)
) AS t(tier, price_cents, min_quantity)
WHERE p.sku = 'KP-KIWI-KITTY'
  AND NOT EXISTS (
    SELECT 1 FROM public.wholesale_pricing wp
    WHERE wp.product_id = p.id AND wp.tier = t.tier
  );

-- 4. Same seed for the three preorder flavors so wholesale buyers can
--    preorder full cases at tier pricing once approved.
INSERT INTO public.wholesale_pricing (product_id, tier, price_cents, min_quantity)
SELECT p.id, t.tier, t.price_cents, t.min_quantity
FROM public.products p
CROSS JOIN (VALUES
  ('standard'::TEXT, 200,  50),
  ('premium'::TEXT,  165, 200)
) AS t(tier, price_cents, min_quantity)
WHERE p.sku IN ('KP-LUCY-LEMON', 'KP-MANGO-MOLLY', 'KP-MARY-MINT')
  AND NOT EXISTS (
    SELECT 1 FROM public.wholesale_pricing wp
    WHERE wp.product_id = p.id AND wp.tier = t.tier
  );
