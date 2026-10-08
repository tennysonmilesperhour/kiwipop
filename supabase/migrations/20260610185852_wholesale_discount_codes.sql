-- ============================================================================
-- Kiwi Pop — Wholesale welcome discount codes
-- ----------------------------------------------------------------------------
-- When a wholesale account is approved, it gets 4 one-time-use 25%-off codes:
--   • 1 "first_order" code for the account's own first wholesale order
--   • 3 "referral" codes to hand out (so 4 coupons total)
-- Each code is single-use and unique to the account. Redemption is recorded
-- when the order it's attached to is actually paid (Stripe webhook), so an
-- abandoned checkout never burns a code.
--
-- Idempotent: safe to run repeatedly.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wholesale_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wholesale_account_id UUID NOT NULL
    REFERENCES public.wholesale_accounts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  percent_off INTEGER NOT NULL DEFAULT 25
    CHECK (percent_off > 0 AND percent_off <= 100),
  kind TEXT NOT NULL DEFAULT 'referral'
    CHECK (kind IN ('first_order', 'referral')),
  redeemed_at TIMESTAMPTZ,
  redeemed_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Codes are matched case-insensitively at checkout, so enforce uniqueness on
-- the upper-cased value.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wholesale_discount_codes_code_upper
  ON public.wholesale_discount_codes (upper(code));

CREATE INDEX IF NOT EXISTS idx_wholesale_discount_codes_account
  ON public.wholesale_discount_codes (wholesale_account_id);

-- ----------------------------------------------------------------------------
-- Order-level discount columns. total_cents stays the source of truth for the
-- amount charged (the Stripe webhook overwrites it with the real paid amount);
-- these columns record what discount, if any, was applied.
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER,
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- RLS: admins manage everything; an account owner can read their own codes so
-- the customer-facing wholesale page can show them.
-- ----------------------------------------------------------------------------
ALTER TABLE public.wholesale_discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wholesale_discount_codes_self_select"
  ON public.wholesale_discount_codes;
DROP POLICY IF EXISTS "wholesale_discount_codes_admin_all"
  ON public.wholesale_discount_codes;

CREATE POLICY "wholesale_discount_codes_self_select"
  ON public.wholesale_discount_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wholesale_accounts wa
      WHERE wa.id = wholesale_discount_codes.wholesale_account_id
        AND wa.user_id = auth.uid()
    )
  );

CREATE POLICY "wholesale_discount_codes_admin_all"
  ON public.wholesale_discount_codes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
