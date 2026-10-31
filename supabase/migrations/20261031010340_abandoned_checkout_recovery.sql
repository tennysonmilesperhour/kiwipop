-- ============================================================================
-- Kiwi Pop: checkout abandonment recovery (recording on, emails off)
-- ----------------------------------------------------------------------------
-- More than half of storefront checkouts end with the Stripe session expiring
-- unpaid. This records each one so the admin can see what was left behind and,
-- once Tennyson approves the copy, send ONE recovery email per abandonment.
--
--   * abandoned_checkouts: one row per expired, unpaid storefront order.
--     Written by the Stripe webhook (checkout.session.expired) and by the
--     reconcile pass, both of which already flip these orders to cancelled.
--   * app_settings.abandoned_checkout_emails_enabled: the switch. Defaults to
--     false, so this migration sends nothing. See
--     docs/abandoned-checkout-email.md for the copy and how to turn it on.
--
-- Additive only: a new table and a new column with a default. Nothing that
-- exists today is changed, so the app version already deployed keeps working.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE
    REFERENCES public.orders(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  -- Snapshot of the cart: [{ product_id, name, quantity, price_cents }].
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER,
  total_cents INTEGER,
  discount_code TEXT,
  -- When the order was started (orders.created_at), not when Stripe expired it.
  checkout_started_at TIMESTAMPTZ NOT NULL,
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (recovery_status IN ('pending', 'sent', 'skipped', 'failed')),
  recovery_skip_reason TEXT,
  recovery_sent_at TIMESTAMPTZ,
  recovery_error TEXT,
  -- Set when the same email later pays for an order, whether or not an email
  -- went out. Recovered-by-email = recovery_sent_at < recovered_at.
  recovered_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  recovered_at TIMESTAMPTZ,
  -- Unguessable token for the "restore my cart" and unsubscribe links.
  recovery_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_email
  ON public.abandoned_checkouts (lower(email));
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_pending
  ON public.abandoned_checkouts (abandoned_at)
  WHERE recovery_status = 'pending';

-- Admin-only. The server writes with the service role, which bypasses RLS.
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abandoned_checkouts_admin_all"
  ON public.abandoned_checkouts;
CREATE POLICY "abandoned_checkouts_admin_all"
  ON public.abandoned_checkouts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.abandoned_checkouts FROM anon;

-- The switch. OFF until Tennyson approves the email copy.
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS abandoned_checkout_emails_enabled BOOLEAN NOT NULL DEFAULT FALSE;
