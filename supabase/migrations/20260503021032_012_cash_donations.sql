-- ============================================================================
-- Kiwi Pop — manual cash donation entries
-- ----------------------------------------------------------------------------
-- The fundraiser progress bar on the homepage normally sums paid orders +
-- the founder's baseline pledge. Cash given in person at events / shows / etc
-- never touches Stripe, so it doesn't show up in that math. This table lets
-- the admin (only Tennyson, gated by /admin) record those cash gifts so the
-- progress bar reflects the real total.
--
-- Anyone with admin role on profiles can insert / read / delete via the
-- /api/admin/cash-donations route (which uses requireAdmin + the service-role
-- supabaseAdmin client). RLS denies everyone else.
--
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cash_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  donor_name TEXT,
  note TEXT,
  received_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_donations_received_at
  ON public.cash_donations (received_at DESC);

ALTER TABLE public.cash_donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_donations_admin_all" ON public.cash_donations;
CREATE POLICY "cash_donations_admin_all" ON public.cash_donations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
