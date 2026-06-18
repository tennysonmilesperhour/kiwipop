-- ============================================================================
-- Kiwi Pop — customer accounts (retail / wholesale) + rewards points
-- ----------------------------------------------------------------------------
--  • profiles.account_type lets a signup choose retail or wholesale. Wholesale
--    signups land a pending wholesale_accounts row (pricing unlocks on admin
--    approval, reusing the existing flow).
--  • Rewards points: earn 5 points per $1 paid; 500 points redeem for $5 off
--    via a one-time reward code that plugs into the existing checkout discount.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Profile columns.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'retail'
    CHECK (account_type IN ('retail','wholesale')),
  ADD COLUMN IF NOT EXISTS points_balance integer NOT NULL DEFAULT 0;

-- 2. Points ledger (authoritative history; balance is recomputed from it).
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON public.points_ledger(user_id);
-- One "earned" row per order keeps point awards idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_ledger_earned_order
  ON public.points_ledger(order_id) WHERE reason = 'earned';

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS points_ledger_self ON public.points_ledger;
CREATE POLICY points_ledger_self ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS points_ledger_admin ON public.points_ledger;
CREATE POLICY points_ledger_admin ON public.points_ledger
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Reward codes (one-time $X off, minted by spending points).
CREATE TABLE IF NOT EXISTS public.reward_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  amount_off_cents integer NOT NULL CHECK (amount_off_cents > 0),
  points_spent integer NOT NULL,
  redeemed_at timestamptz,
  redeemed_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_codes_code_upper
  ON public.reward_codes (upper(code));
CREATE INDEX IF NOT EXISTS idx_reward_codes_user ON public.reward_codes(user_id);

ALTER TABLE public.reward_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reward_codes_self ON public.reward_codes;
CREATE POLICY reward_codes_self ON public.reward_codes
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS reward_codes_admin ON public.reward_codes;
CREATE POLICY reward_codes_admin ON public.reward_codes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Award points for a paid order (5 pts / whole $). Idempotent per order;
--    skips guest orders (no user to credit).
CREATE OR REPLACE FUNCTION public.award_points_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_total int;
  v_points int;
BEGIN
  SELECT user_id, total_cents INTO v_user, v_total
  FROM public.orders WHERE id = p_order_id;
  IF v_user IS NULL THEN RETURN; END IF;

  v_points := FLOOR(COALESCE(v_total, 0) / 100.0)::int * 5;
  IF v_points <= 0 THEN RETURN; END IF;

  INSERT INTO public.points_ledger (user_id, order_id, delta, reason)
  VALUES (v_user, p_order_id, v_points, 'earned')
  ON CONFLICT (order_id) WHERE reason = 'earned' DO NOTHING;

  UPDATE public.profiles
  SET points_balance = (
    SELECT COALESCE(SUM(delta), 0) FROM public.points_ledger WHERE user_id = v_user
  )
  WHERE id = v_user;
END;
$$;
REVOKE ALL ON FUNCTION public.award_points_for_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_points_for_order(uuid) TO service_role;

-- 5. Redeem points for a reward code (atomic: guards balance, mints code,
--    debits ledger + balance).
CREATE OR REPLACE FUNCTION public.redeem_points_for_reward(
  p_user uuid,
  p_points int,
  p_amount_cents int,
  p_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance int;
BEGIN
  SELECT points_balance INTO v_balance FROM public.profiles WHERE id = p_user FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'no profile'; END IF;
  IF v_balance < p_points THEN RAISE EXCEPTION 'insufficient points'; END IF;

  INSERT INTO public.reward_codes (user_id, code, amount_off_cents, points_spent)
  VALUES (p_user, p_code, p_amount_cents, p_points);

  INSERT INTO public.points_ledger (user_id, delta, reason)
  VALUES (p_user, -p_points, 'redeemed');

  UPDATE public.profiles SET points_balance = points_balance - p_points WHERE id = p_user;
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_points_for_reward(uuid, int, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_points_for_reward(uuid, int, int, text) TO service_role;

-- 6. Extend the new-user trigger: honor account_type from signup metadata and
--    auto-create a pending wholesale account for wholesale signups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_role TEXT;
  v_account_type TEXT;
  v_business TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_email_allowlist WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    resolved_role := 'admin';
  ELSE
    resolved_role := 'customer';
  END IF;

  v_account_type := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'account_type', ''), 'retail');
  IF v_account_type NOT IN ('retail', 'wholesale') THEN
    v_account_type := 'retail';
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    resolved_role,
    v_account_type
  )
  ON CONFLICT (id) DO UPDATE SET account_type = EXCLUDED.account_type;

  IF v_account_type = 'wholesale'
     AND NOT EXISTS (SELECT 1 FROM public.wholesale_accounts WHERE user_id = NEW.id) THEN
    v_business := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'business_name', ''),
                           split_part(NEW.email, '@', 1));
    INSERT INTO public.wholesale_accounts (user_id, business_name, approval_status)
    VALUES (NEW.id, v_business, 'pending');
  END IF;

  RETURN NEW;
END;
$$;
