-- ============================================================================
-- Kiwi Pop — artwork raffle entries
-- ----------------------------------------------------------------------------
-- Stores public raffle entries from the homepage form. Includes a
-- security-definer function admins can call to randomly draw a winner.
-- Idempotent: safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.raffle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_slug TEXT NOT NULL DEFAULT 'artwork-001',
  name TEXT NOT NULL,
  -- email is stored lowercased by the API; the composite unique constraint
  -- below relies on the column value directly so the Supabase JS upsert
  -- onConflict syntax works (expression indexes don't).
  email TEXT NOT NULL,
  phone TEXT,
  social_handle TEXT,
  source TEXT NOT NULL DEFAULT 'landing',
  ip_address INET,
  user_agent TEXT,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  won_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'raffle_entries_slug_email_key'
  ) THEN
    ALTER TABLE public.raffle_entries
      ADD CONSTRAINT raffle_entries_slug_email_key
      UNIQUE (raffle_slug, email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_raffle_entries_created_at
  ON public.raffle_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_raffle_entries_winner
  ON public.raffle_entries (raffle_slug)
  WHERE is_winner = TRUE;

ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "raffle_entries_admin_all" ON public.raffle_entries;
CREATE POLICY "raffle_entries_admin_all" ON public.raffle_entries
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Anonymous inserts go through the /api/raffle/enter route handler using the
-- service-role key, so no public RLS policy is needed.

-- ----------------------------------------------------------------------------
-- draw_raffle_winner(slug)
-- Picks one random non-winner entry, marks it as the winner, and returns the
-- full row. Returns NULL if no eligible entries exist.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.draw_raffle_winner(p_slug TEXT DEFAULT 'artwork-001')
RETURNS public.raffle_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  picked public.raffle_entries;
BEGIN
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

REVOKE ALL ON FUNCTION public.draw_raffle_winner(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.draw_raffle_winner(TEXT) TO service_role;
