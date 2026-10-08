-- ============================================================================
-- Kiwi Pop — "find a pop" map: fixed locations + live mobile presence
-- ----------------------------------------------------------------------------
-- Two tables power the interactive map on /find-us:
--
--   map_locations   — fixed/scheduled spots: a retail counter, a store, a
--                     popup, or a festival booth with known coordinates.
--                     Each renders as a colored star on the map.
--
--   live_presences  — the "Red Bull backpack girl" / roving-booth feature.
--                     The admin creates a presence and hands the operator a
--                     secret share link (/live/<share_token>). On their phone
--                     the operator flips a toggle and the browser streams GPS
--                     to /api/live/<token>/ping. A presence shows on the public
--                     map only while it is `is_live` AND was pinged recently
--                     (freshness window enforced in the API, default 90s).
--
--                     Optional geofence: zone_lat/lng + zone_radius_m. With
--                     `auto_off_on_exit` (default true), the ping endpoint
--                     flips `is_live` off the moment the operator leaves the
--                     zone, so a rep who wanders off the festival grounds
--                     stops appearing automatically. They can disable that
--                     toggle to keep broadcasting anywhere.
--
-- Access model (matches the rest of the app): all reads/writes go through
-- /api/** route handlers using the service-role client, so RLS is enabled to
-- lock out anon/auth direct access. live_presences.share_token is a bearer
-- secret — it must never be exposed by a public-read policy, which is exactly
-- why there is no public SELECT policy here.
--
-- Idempotent.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- map_locations — fixed / scheduled spots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.map_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'retail'
                CHECK (kind IN ('store', 'retail', 'popup', 'festival')),
  description TEXT,
  address     TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  url         TEXT,                       -- optional link (maps, event page, IG)
  color       TEXT NOT NULL DEFAULT 'lime'
                CHECK (color IN ('lime', 'cyan', 'magenta', 'ultraviolet', 'sodium', 'cherry')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at   TIMESTAMPTZ,               -- optional window for temporary spots
  ends_at     TIMESTAMPTZ,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_locations_active
  ON public.map_locations (is_active);

ALTER TABLE public.map_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "map_locations_admin_write" ON public.map_locations;
CREATE POLICY "map_locations_admin_write" ON public.map_locations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- live_presences — live mobile booths / roving reps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_presences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label            TEXT NOT NULL,                -- shown in the map popup
  kind             TEXT NOT NULL DEFAULT 'rover'
                     CHECK (kind IN ('rover', 'booth')),
  share_token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  color            TEXT NOT NULL DEFAULT 'magenta'
                     CHECK (color IN ('lime', 'cyan', 'magenta', 'ultraviolet', 'sodium', 'cherry')),
  emoji            TEXT NOT NULL DEFAULT '⭐',
  message          TEXT,                          -- "find me by the main stage!"

  -- optional geofence
  zone_lat         DOUBLE PRECISION,
  zone_lng         DOUBLE PRECISION,
  zone_radius_m    INTEGER CHECK (zone_radius_m IS NULL OR zone_radius_m > 0),
  auto_off_on_exit BOOLEAN NOT NULL DEFAULT TRUE,

  -- live state (updated by the ping endpoint)
  is_live          BOOLEAN NOT NULL DEFAULT FALSE,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  accuracy_m       DOUBLE PRECISION,
  last_ping_at     TIMESTAMPTZ,

  -- admin kill switch — disables the share link entirely
  enabled          BOOLEAN NOT NULL DEFAULT TRUE,

  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_presences_live
  ON public.live_presences (is_live, last_ping_at DESC);

ALTER TABLE public.live_presences ENABLE ROW LEVEL SECURITY;

-- No public/anon policies on purpose: share_token is a secret and every
-- read/write happens through the service-role API. Admin write policy is here
-- for completeness / dashboard parity.
DROP POLICY IF EXISTS "live_presences_admin_write" ON public.live_presences;
CREATE POLICY "live_presences_admin_write" ON public.live_presences
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
