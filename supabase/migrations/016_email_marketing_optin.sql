-- ============================================================================
-- Kiwi Pop — marketing list capture from checkout
-- ----------------------------------------------------------------------------
-- Adds opt-in + name columns to the email_signups table so we have a single
-- deduped audience pulled from both the homepage form and checkout, with a
-- proper consent flag for CAN-SPAM / GDPR compliance.
-- ============================================================================

ALTER TABLE public.email_signups
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS opted_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_email_signups_marketing_opt_in
  ON public.email_signups (marketing_opt_in)
  WHERE marketing_opt_in = TRUE;

-- Backfill: anyone who signed up via the homepage "get on the list" form
-- before this migration explicitly asked to be on the list, so flip them to
-- opted-in retroactively. Checkout-sourced rows didn't exist before this
-- migration so they're left alone.
UPDATE public.email_signups
SET
  marketing_opt_in = TRUE,
  opted_in_at = COALESCE(opted_in_at, created_at)
WHERE marketing_opt_in = FALSE
  AND source IN ('list', 'landing-reviews');
