/**
 * Shared types + helpers for the "find a pop" map (fixed locations + live
 * mobile presences). Safe to import from both server (API routes) and client
 * (map component, broadcaster page) — no server-only deps here.
 */

/** Brand neon tokens a marker star can be tinted with. */
export const MARKER_COLORS = {
  lime: '#a8ff3c',
  cyan: '#00f0ff',
  magenta: '#ff2d8a',
  ultraviolet: '#7b2dff',
  sodium: '#ffce1f',
  cherry: '#ff1f3d',
} as const;

export type MarkerColor = keyof typeof MARKER_COLORS;

export const MARKER_COLOR_KEYS = Object.keys(MARKER_COLORS) as MarkerColor[];

export function resolveColor(color?: string | null): string {
  if (color && color in MARKER_COLORS) return MARKER_COLORS[color as MarkerColor];
  return MARKER_COLORS.lime;
}

export type LocationKind = 'store' | 'retail' | 'popup' | 'festival';
export type PresenceKind = 'rover' | 'booth';
/** Aggregated buyer cluster on the customer-facing order map. */
export type OrderKind = 'orders';

/**
 * A presence is only "live" on the public map while it's flagged live AND was
 * pinged within this window. Keeps stale pins (closed laptop, dead battery)
 * from lingering. The broadcaster pings every ~10s, so 90s tolerates a few
 * dropped updates.
 */
export const LIVE_FRESH_SECONDS = 90;

/** Default geofence radius (meters) when an operator locks a zone "here". */
export const DEFAULT_ZONE_RADIUS_M = 800;

/** Default map center — Salt Lake City, where Kiwi Pop ships from. */
export const DEFAULT_CENTER: [number, number] = [40.7608, -111.891];

/** A point rendered on a public map (fixed location, live presence, or buyer cluster). */
export interface MapPoint {
  id: string;
  source: 'location' | 'live' | 'order';
  name: string;
  kind: LocationKind | PresenceKind | OrderKind;
  lat: number;
  lng: number;
  color: string; // resolved hex
  emoji?: string | null;
  description?: string | null;
  address?: string | null;
  url?: string | null;
  live?: boolean;
  lastSeenMinutes?: number | null;
  /** Number of orders aggregated at this point (order map only). Drives marker size + badge. */
  count?: number | null;
}

/** Haversine distance in meters between two lat/lng points. */
export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Basic lat/lng sanity check. */
export function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
