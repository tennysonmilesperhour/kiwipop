-- ============================================================================
-- Kiwi Pop: sales rep attribution on wholesale accounts
-- ----------------------------------------------------------------------------
-- docs/sales-commission-plan.md: a door belongs to the rep who opened it for
-- 12 months from the opening order, and commission is paid on collected cash.
-- None of that can be worked out later unless each account records its rep
-- from day one, so this lands before the first salesperson starts.
--
--   * sales_reps: the people who can own a door. A rep does not need a login;
--     profile_id is optional for when one is given an account.
--   * wholesale_accounts.rep_id: who opened the door. NULL = house account
--     (inbound, founder-sourced, or a distributor like Big Skar).
--   * wholesale_accounts.rep_assigned_at: when the rep was attached, so the
--     12-month ownership window has a start even before the first order.
--
-- Additive only: one new table and two nullable columns. Existing accounts
-- stay NULL (house accounts), which is what they are.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sales_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  started_on DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_reps_admin_all" ON public.sales_reps;
CREATE POLICY "sales_reps_admin_all"
  ON public.sales_reps
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.sales_reps FROM anon;

ALTER TABLE public.wholesale_accounts
  ADD COLUMN IF NOT EXISTS rep_id UUID
    REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rep_assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wholesale_accounts_rep_id
  ON public.wholesale_accounts (rep_id)
  WHERE rep_id IS NOT NULL;
