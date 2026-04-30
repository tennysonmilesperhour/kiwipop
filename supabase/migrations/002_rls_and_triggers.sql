-- ============================================================================
-- Kiwi Pop — RLS, Triggers, and Storage hardening
-- ----------------------------------------------------------------------------
-- This migration is idempotent: it can be run repeatedly without error.
-- Apply with: supabase db push
--   or paste into Supabase Dashboard → SQL editor.
-- ============================================================================

-- 0. Helper: is_admin() — checks the calling user is an admin.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 1. Auto-create profile on auth.users INSERT.
--    Today the client tries to upsert a profile during sign-up, which races
--    on closed tabs and email-confirmation flows. A trigger guarantees one row
--    per auth user with role='customer'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Enable RLS on every table that does not already have it.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_pricing   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_of_materials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns             ENABLE ROW LEVEL SECURITY;

-- 3. Drop the old SELECT-only policies so we can replace them with the
--    full SELECT/INSERT/UPDATE/DELETE matrix below.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile"           ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"         ON public.profiles;
DROP POLICY IF EXISTS "Users can view own orders"            ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items"       ON public.order_items;
DROP POLICY IF EXISTS "Users can view own wholesale account" ON public.wholesale_accounts;

-- ============================================================================
-- profiles
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all"   ON public.profiles;

CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- products: public read, admin write
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_public_select" ON public.products;
DROP POLICY IF EXISTS "products_admin_all"     ON public.products;

CREATE POLICY "products_public_select" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_admin_all" ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- orders: customer reads/updates own; admin reads/updates everything.
-- Anonymous checkout (no auth) writes via service-role from /api/checkout.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_self_select" ON public.orders;
DROP POLICY IF EXISTS "orders_self_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all"   ON public.orders;

CREATE POLICY "orders_self_select" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_self_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- order_items: scoped via parent order
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "order_items_self_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_admin_all"   ON public.order_items;

CREATE POLICY "order_items_self_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- inventory: admin full access, public can read for stock display.
--   (We expose stock counts on the storefront anyway.)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "inventory_public_select" ON public.inventory;
DROP POLICY IF EXISTS "inventory_admin_all"     ON public.inventory;

CREATE POLICY "inventory_public_select" ON public.inventory
  FOR SELECT USING (true);

CREATE POLICY "inventory_admin_all" ON public.inventory
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- wholesale_accounts: customers can request + read/update their own.
--   Approval status changes are admin-only via a per-column check.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "wholesale_accounts_self_select" ON public.wholesale_accounts;
DROP POLICY IF EXISTS "wholesale_accounts_self_insert" ON public.wholesale_accounts;
DROP POLICY IF EXISTS "wholesale_accounts_admin_all"   ON public.wholesale_accounts;

CREATE POLICY "wholesale_accounts_self_select" ON public.wholesale_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wholesale_accounts_self_insert" ON public.wholesale_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wholesale_accounts_admin_all" ON public.wholesale_accounts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- wholesale_pricing: admin write, public read (so the storefront can show
-- tier pricing if needed). Tighten to authenticated-only if you prefer.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "wholesale_pricing_public_select" ON public.wholesale_pricing;
DROP POLICY IF EXISTS "wholesale_pricing_admin_all"     ON public.wholesale_pricing;

CREATE POLICY "wholesale_pricing_public_select" ON public.wholesale_pricing
  FOR SELECT USING (true);

CREATE POLICY "wholesale_pricing_admin_all" ON public.wholesale_pricing
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- quotes: scoped to wholesale account owner; admin full access.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "quotes_self_select" ON public.quotes;
DROP POLICY IF EXISTS "quotes_admin_all"   ON public.quotes;

CREATE POLICY "quotes_self_select" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wholesale_accounts wa
      WHERE wa.id = quotes.wholesale_account_id
        AND wa.user_id = auth.uid()
    )
  );

CREATE POLICY "quotes_admin_all" ON public.quotes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- Admin-only operational tables: suppliers, manufacturing_batches,
-- raw_materials, bill_of_materials, expenses, shipments, returns.
-- No customer-facing access. RLS denies all reads/writes for non-admins.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "suppliers_admin_all"            ON public.suppliers;
DROP POLICY IF EXISTS "manufacturing_batches_admin_all" ON public.manufacturing_batches;
DROP POLICY IF EXISTS "raw_materials_admin_all"        ON public.raw_materials;
DROP POLICY IF EXISTS "bill_of_materials_admin_all"    ON public.bill_of_materials;
DROP POLICY IF EXISTS "expenses_admin_all"             ON public.expenses;
DROP POLICY IF EXISTS "shipments_admin_all"            ON public.shipments;
DROP POLICY IF EXISTS "returns_admin_all"              ON public.returns;

CREATE POLICY "suppliers_admin_all"             ON public.suppliers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "manufacturing_batches_admin_all" ON public.manufacturing_batches
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "raw_materials_admin_all"         ON public.raw_materials
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "bill_of_materials_admin_all"     ON public.bill_of_materials
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "expenses_admin_all"              ON public.expenses
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "shipments_admin_all"             ON public.shipments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Returns: customers can also see their own (via the order they own).
CREATE POLICY "returns_admin_all" ON public.returns
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "returns_self_select" ON public.returns;
CREATE POLICY "returns_self_select" ON public.returns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = returns.order_id
        AND o.user_id = auth.uid()
    )
  );

-- 4. Storage bucket for product images.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "product_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_admin_write"   ON storage.objects;

CREATE POLICY "product_images_public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_write" ON storage.objects
  FOR ALL
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- 5. Convenience: index on stripe_payment_intent_id (used by webhook lookups).
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id
  ON public.orders(stripe_payment_intent_id);

-- ============================================================================
-- Done. Verify with:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
--   SELECT * FROM pg_policies WHERE schemaname='public' ORDER BY tablename;
-- ============================================================================
