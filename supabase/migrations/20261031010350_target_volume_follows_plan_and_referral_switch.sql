-- ============================================================================
-- Kiwi Pop: target volume follows the plan, referral codes switch
-- ----------------------------------------------------------------------------
-- 1. target_monthly_volume follows lib/plan.ts
--    The admin divides fixed overhead by app_settings.target_monthly_volume to
--    get overhead per pop, so every break-even and net-margin read depends on
--    it. It was a hand-typed number (10,000 on 31 Oct 2026) while the plan
--    says 4,710 for October and 6,480 for November.
--    target_volume_follows_plan = true means the server uses the current plan
--    month's pop figure and the daily cron writes it back to this column.
--    Typing a number into Admin > Wholesale > "Assumed monthly volume" turns
--    following off (a manual override); the "follow the plan" link turns it
--    back on. Outside the Aug to Dec 2026 plan the stored number is used.
--
-- 2. wholesale_referral_codes_enabled
--    Approved wholesale accounts can get 3 referral codes to hand out, on top
--    of their own first-order code. OFF by default: only the first-order code
--    is minted, and referral codes cannot be redeemed at checkout. See
--    docs/open-items.md for how to turn it on.
--
-- Additive: two columns with defaults, plus setting the volume to the
-- current plan month (the previous value is recorded above).
-- ============================================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS target_volume_follows_plan BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wholesale_referral_codes_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Bring the stored number in line with this month's plan figure now, rather
-- than waiting for the first cron run. Mirrors PLAN_MONTHS in lib/plan.ts.
UPDATE public.app_settings
SET target_monthly_volume = plan.pops,
    updated_at = NOW()
FROM (
  VALUES
    ('2026-08-01'::date, 1400),
    ('2026-09-01'::date, 2760),
    ('2026-10-01'::date, 4710),
    ('2026-11-01'::date, 6480),
    ('2026-12-01'::date, 8120)
) AS plan(month, pops)
WHERE app_settings.id = 1
  AND app_settings.target_volume_follows_plan
  AND plan.month = date_trunc('month', NOW() AT TIME ZONE 'America/Denver')::date;
