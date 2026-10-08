-- ============================================================================
-- Lock down SECURITY DEFINER functions exposed to the Data API
-- ----------------------------------------------------------------------------
-- Earlier migrations did `REVOKE ALL ... FROM PUBLIC` and granted service_role.
-- That does not remove the explicit EXECUTE grants Supabase puts on anon and
-- authenticated when a function is created. Those roles can still call the
-- functions through /rest/v1/rpc with the public anon key. None of the staff
-- functions checked the caller.
--
-- This migration:
--   * revokes anon, authenticated, and PUBLIC on staff / trigger functions
--   * leaves service_role (the Next.js server) able to call them
--   * rejects any caller that is not the service role or an admin, so a
--     future GRANT cannot silently reopen the hole
--   * makes point redemption check auth.uid() and the published 500 pt = $5 rate
--   * keeps is_admin() callable — RLS policies evaluate it for anon and
--     authenticated, and it only returns a boolean about the caller
--   * keeps handle_new_user() executable by supabase_auth_admin (signup trigger)
--   * keeps rls_auto_enable() executable by the roles that run DDL
--   * pins search_path on the two trigger functions the linter flagged
--
-- Production already applied the unconditional form of this file as version
-- 20261008054715. This copy keeps that version so db push will not re-run it
-- there. The rls_auto_enable revoke below is conditional for a fresh setup.
-- ============================================================================

-- Reject Data API callers that are not the server (service_role) or an admin
-- session. Must use auth.role()/is_admin(): inside a SECURITY DEFINER function
-- current_user is the owner, so it cannot be used for authorization.
CREATE OR REPLACE FUNCTION public.assert_staff_caller()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN;
  END IF;
  IF public.is_admin() THEN
    RETURN;
  END IF;
  RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.assert_staff_caller() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_staff_caller() TO service_role;

-- ----------------------------------------------------------------------------
-- Staff operations. Bodies match production; the only behavior change is the
-- caller check (and, for stock decrement, refusing a non-positive quantity,
-- which previously increased stock).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.adjust_raw_material_stock(
  p_material_id uuid,
  p_delta numeric,
  p_note text,
  p_actor uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit text;
  v_new numeric;
BEGIN
  PERFORM public.assert_staff_caller();

  IF p_delta IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'adjustment delta must be non-zero';
  END IF;

  SELECT unit INTO v_unit FROM public.raw_materials WHERE id = p_material_id;
  IF v_unit IS NULL THEN
    RAISE EXCEPTION 'raw material not found';
  END IF;

  UPDATE public.raw_materials
  SET quantity_available = GREATEST(0, quantity_available + p_delta)
  WHERE id = p_material_id
  RETURNING quantity_available INTO v_new;

  INSERT INTO public.raw_material_restocks
    (raw_material_id, quantity_added, unit, cost_cents, source, reference_url, note, created_by)
  VALUES
    (p_material_id, p_delta, v_unit, 0, 'adjustment', NULL, p_note, p_actor);

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_raw_material_stock(uuid, numeric, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_raw_material_stock(uuid, numeric, text, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.restock_raw_material(
  p_material_id uuid,
  p_quantity numeric,
  p_cost_cents integer,
  p_source text,
  p_reference_url text,
  p_actor uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit text;
BEGIN
  PERFORM public.assert_staff_caller();

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be positive';
  END IF;

  SELECT unit INTO v_unit FROM public.raw_materials WHERE id = p_material_id;
  IF v_unit IS NULL THEN
    RAISE EXCEPTION 'raw material not found';
  END IF;

  UPDATE public.raw_materials
  SET quantity_available = quantity_available + p_quantity,
      last_restocked = now(),
      cost_per_unit_cents = CASE
        WHEN p_cost_cents IS NOT NULL AND p_cost_cents > 0 AND p_quantity > 0
          THEN round(p_cost_cents::numeric / p_quantity, 4)
        ELSE cost_per_unit_cents
      END
  WHERE id = p_material_id;

  INSERT INTO public.raw_material_restocks
    (raw_material_id, quantity_added, unit, cost_cents, source, reference_url, created_by)
  VALUES
    (p_material_id, p_quantity, v_unit, COALESCE(p_cost_cents, 0),
     COALESCE(p_source, 'manual'), p_reference_url, p_actor);
END;
$$;

REVOKE ALL ON FUNCTION public.restock_raw_material(uuid, numeric, integer, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restock_raw_material(uuid, numeric, integer, text, text, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.decrement_stock_for_product(
  p_product_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_staff_caller();

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be positive';
  END IF;

  UPDATE public.inventory
  SET quantity_available = GREATEST(0, COALESCE(quantity_available, 0) - p_quantity),
      last_updated = NOW()
  WHERE product_id = p_product_id;

  UPDATE public.products
  SET in_stock = GREATEST(0, COALESCE(in_stock, 0) - p_quantity)
  WHERE id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_stock_for_product(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_product(uuid, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.consume_ingredients_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_staff_caller();

  UPDATE public.orders
    SET ingredients_consumed_at = now()
    WHERE id = p_order_id
      AND ingredients_consumed_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.raw_materials rm
  SET quantity_available = GREATEST(0, rm.quantity_available - usage.total_qty),
      last_restocked = rm.last_restocked
  FROM (
    SELECT bom.raw_material_id,
           SUM(oi.quantity * comp.quantity * bom.quantity_per_unit) AS total_qty
    FROM public.order_items oi
    JOIN public.product_pop_composition comp ON comp.product_id = oi.product_id
    JOIN public.bill_of_materials bom ON bom.product_id = comp.component_product_id
    WHERE oi.order_id = p_order_id
    GROUP BY bom.raw_material_id
  ) usage
  WHERE rm.id = usage.raw_material_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ingredients_for_order(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ingredients_for_order(uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.draw_raffle_winner(p_slug text DEFAULT 'artwork-001')
RETURNS public.raffle_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  picked public.raffle_entries;
BEGIN
  PERFORM public.assert_staff_caller();

  SELECT *
    INTO picked
    FROM public.raffle_entries
   WHERE raffle_slug = p_slug
     AND is_winner = FALSE
   ORDER BY random()
   LIMIT 1;

  IF picked.id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.raffle_entries
     SET is_winner = TRUE,
         won_at    = NOW()
   WHERE id = picked.id
  RETURNING * INTO picked;

  RETURN picked;
END;
$$;

REVOKE ALL ON FUNCTION public.draw_raffle_winner(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.draw_raffle_winner(text)
  TO service_role;

DROP FUNCTION IF EXISTS public.producible_pops_by_flavor();

CREATE OR REPLACE FUNCTION public.producible_pops_by_flavor()
RETURNS TABLE(product_id uuid, sku text, name text, producible integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_staff_caller();

  RETURN QUERY
  SELECT p.id, p.sku, p.name,
    COALESCE(FLOOR(MIN(
      CASE WHEN bom.quantity_per_unit > 0
        THEN rm.quantity_available / bom.quantity_per_unit
        ELSE NULL END
    ))::int, 0) AS producible
  FROM public.products p
  JOIN public.bill_of_materials bom ON bom.product_id = p.id
  JOIN public.raw_materials rm ON rm.id = bom.raw_material_id
  WHERE p.sku IN ('KP-KIWI-KITTY','KP-LUCY-LEMON','KP-MANGO-MOLLY','KP-MARY-MINT')
  GROUP BY p.id, p.sku, p.name;
END;
$$;

REVOKE ALL ON FUNCTION public.producible_pops_by_flavor()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.producible_pops_by_flavor()
  TO service_role;

-- Points are awarded by the Stripe webhook after it marks the order paid.
-- Skip anything that is not paid/shipped/completed so a pending checkout id
-- cannot mint points.
CREATE OR REPLACE FUNCTION public.award_points_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_total int;
  v_status text;
  v_points int;
BEGIN
  PERFORM public.assert_staff_caller();

  SELECT user_id, total_cents, status
    INTO v_user, v_total, v_status
    FROM public.orders
   WHERE id = p_order_id;

  IF v_user IS NULL THEN
    RETURN;
  END IF;
  IF v_status NOT IN ('paid', 'shipped', 'completed') THEN
    RETURN;
  END IF;

  v_points := FLOOR(COALESCE(v_total, 0) / 100.0)::int * 5;
  IF v_points <= 0 THEN
    RETURN;
  END IF;

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

REVOKE ALL ON FUNCTION public.award_points_for_order(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_points_for_order(uuid)
  TO service_role;

-- 500 points = $5 (500 cents), matching lib/rewards.ts. A signed-in user may
-- redeem only their own balance. The Next.js route calls this with the
-- service role after auth.getUser(), so service_role is allowed to pass the
-- user id it already checked. Anon cannot call it.
CREATE OR REPLACE FUNCTION public.redeem_points_for_reward(
  p_user uuid,
  p_points integer,
  p_amount_cents integer,
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
  IF coalesce(auth.role(), '') = 'service_role' THEN
    NULL;
  ELSIF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_points IS NULL OR p_points <= 0 OR p_points % 500 <> 0 THEN
    RAISE EXCEPTION 'points must be a positive multiple of 500';
  END IF;
  IF p_amount_cents IS DISTINCT FROM p_points THEN
    RAISE EXCEPTION 'reward amount does not match points';
  END IF;
  IF p_code IS NULL OR length(btrim(p_code)) < 4 THEN
    RAISE EXCEPTION 'invalid reward code';
  END IF;

  SELECT points_balance INTO v_balance
    FROM public.profiles
   WHERE id = p_user
     FOR UPDATE;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'no profile';
  END IF;
  IF v_balance < p_points THEN
    RAISE EXCEPTION 'insufficient points';
  END IF;

  INSERT INTO public.reward_codes (user_id, code, amount_off_cents, points_spent)
  VALUES (p_user, p_code, p_amount_cents, p_points);

  INSERT INTO public.points_ledger (user_id, delta, reason)
  VALUES (p_user, -p_points, 'redeemed');

  UPDATE public.profiles
  SET points_balance = points_balance - p_points
  WHERE id = p_user;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_points_for_reward(uuid, integer, integer, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_points_for_reward(uuid, integer, integer, text)
  TO authenticated, service_role;

-- is_admin() stays executable by anon and authenticated. RLS policies call it
-- while evaluating ordinary reads; revoking it would turn those queries into
-- permission errors. It returns only whether auth.uid() has role = 'admin'.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Signup trigger. Not a normal RPC (it returns trigger). Direct calls fail,
-- but anon/authenticated should not hold EXECUTE. supabase_auth_admin fires
-- the trigger on auth.users and loses access if we only revoke PUBLIC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Signup trigger role. handle_new_user() is created in repo migrations.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
  END IF;
END;
$$;

-- Event trigger behind ensure_rls. This function is created by Supabase on
-- hosted projects and is not in the repo migrations, so a fresh database
-- following docs/DEPLOY.md does not have it. REVOKE on a missing function
-- aborts the migration. Direct RPC calls fail (RETURNS event_trigger). DDL
-- roles still need EXECUTE when the function exists, or CREATE TABLE aborts
-- when the event trigger runs.
-- EXECUTE is used so PostgreSQL does not resolve the function at parse time
-- when pg_proc has no row.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role';
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO supabase_admin';
    END IF;
  END IF;
END;
$$;

-- Trigger functions. Not SECURITY DEFINER, but anon could execute them and
-- their search_path was unset. Updates go through the service role.
ALTER FUNCTION public.touch_admin_sheets_updated_at() SET search_path = public;
ALTER FUNCTION public.sync_product_cost_from_basis() SET search_path = public;

REVOKE ALL ON FUNCTION public.touch_admin_sheets_updated_at()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_product_cost_from_basis()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_admin_sheets_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_product_cost_from_basis() TO service_role;

-- New functions created by postgres should not be executable by the public
-- Data API roles until a migration grants them. service_role is unchanged.
-- Default privileges do not fully cover PUBLIC: every new function still
-- needs an explicit REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
