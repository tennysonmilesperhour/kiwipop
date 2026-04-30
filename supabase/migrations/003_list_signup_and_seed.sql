-- ============================================================================
-- Kiwi Pop — list signups + flavor seed
-- ----------------------------------------------------------------------------
-- Adds the email_signups table for the homepage "get on the list" form
-- and seeds the four canonical flavors so the storefront has products on
-- first deploy.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'list',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_signups_admin_all" ON public.email_signups;
CREATE POLICY "email_signups_admin_all" ON public.email_signups
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Anonymous inserts are denied via RLS; the /api/list route handler uses
-- the service-role key so the public form still works.

CREATE INDEX IF NOT EXISTS idx_email_signups_email
  ON public.email_signups (email);
CREATE INDEX IF NOT EXISTS idx_email_signups_created_at
  ON public.email_signups (created_at DESC);

-- ============================================================================
-- Seed: four canonical flavors. Idempotent via ON CONFLICT (sku).
-- Adjust price_cents / preorder_only later if you want different defaults.
-- ============================================================================

INSERT INTO public.products (
  name, description, sku, price_cents,
  preorder_only, in_stock, image_url
)
VALUES
  (
    'Green Hour',
    'the soft start. you haven''t taken your jacket off yet. lime, kiwi-skin tartness, a clean lift that lasts about two hours. zero sugar. fully vegan. 80mg caffeine + L-theanine.',
    'KP-GREEN-HOUR',
    500,
    false,
    800,
    null
  ),
  (
    'Gloss',
    'you''re already on the floor. cherry-pomegranate, glossy on the lips, ginseng cuts the wall around 1am. for the people who never sit down. 150mg caffeine + ginseng.',
    'KP-GLOSS',
    500,
    false,
    800,
    null
  ),
  (
    'After',
    'the wind-down. blackcurrant + sea-salt, no caffeine, magnesium and ashwagandha. for the uber home, the bath, the sleep that finally works.',
    'KP-AFTER',
    500,
    false,
    800,
    null
  ),
  (
    'Static',
    'the heaviest pop. blue raspberry, full 200mg, taurine. don''t take it past 4am unless you mean it. limit one. 200mg caffeine + taurine.',
    'KP-STATIC',
    600,
    true,
    400,
    null
  )
ON CONFLICT (sku) DO NOTHING;

-- Seed inventory rows for each flavor matched to the in_stock count.
INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, quantity_preordered)
SELECT id, in_stock, 0, 0
FROM public.products
WHERE sku IN ('KP-GREEN-HOUR', 'KP-GLOSS', 'KP-AFTER', 'KP-STATIC')
ON CONFLICT (product_id) DO NOTHING;
