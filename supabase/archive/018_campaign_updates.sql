-- ============================================================================
-- Kiwi Pop — campaign update feed
-- ----------------------------------------------------------------------------
-- Powers the GoFundMe-style update feed on the /campaign page. The admin
-- posts updates (text, optional image, optional milestone flag) and they
-- appear chronologically on the public page. Milestones get special visual
-- treatment (confetti banner, badge).
--
-- Anyone can READ (public feed). Only admin can INSERT / UPDATE / DELETE.
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
  milestone_label TEXT,            -- e.g. "🎉 $500 raised!" or "First wholesale deal!"
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_updates_published
  ON public.campaign_updates (published_at DESC);

ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;

-- Public can read all updates
DROP POLICY IF EXISTS "campaign_updates_public_read" ON public.campaign_updates;
CREATE POLICY "campaign_updates_public_read" ON public.campaign_updates
  FOR SELECT USING (true);

-- Only admin can write
DROP POLICY IF EXISTS "campaign_updates_admin_write" ON public.campaign_updates;
CREATE POLICY "campaign_updates_admin_write" ON public.campaign_updates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
