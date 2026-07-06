/**
 * Geocoding + aggregation for the customer-facing "where kiwi pop lands" map.
 *
 * Order addresses are free-text (messy casing, state names vs codes) but the
 * ZIP is clean, so ZIP is the geographic key. We geocode to the centroid of the
 * 3-digit ZIP prefix (a metro-sized region, ~900 buckets nationwide) rather
 * than an exact address — that keeps buyers un-pinpointed while still clustering
 * dots by metro. Orders without a usable US ZIP (e.g. Canada) fall back to a
 * state/province centroid. Everything here is pure + client-safe: no DB, no
 * server-only deps, so the API route and any test can import it.
 */
import zip3centroids from './zip3-centroids.json';
import { MARKER_COLORS } from './map';

const ZIP3: Record<string, [number, number]> = zip3centroids as unknown as Record<
  string,
  [number, number]
>;

/**
 * State / province / territory centroids (2-letter code → [lat, lng]). US
 * values are averaged ZIP centroids; Canadian provinces are hand-set. Used only
 * as a fallback when a point has no usable ZIP3.
 */
export const REGION_CENTROIDS: Record<string, [number, number]> = {
  // US states + DC
  AL: [32.861, -86.844], AK: [64.2, -152.5], AZ: [33.538, -111.67],
  AR: [35.112, -92.39], CA: [36.778, -119.418], CO: [39.254, -105.291],
  CT: [41.564, -72.803], DE: [39.285, -75.528], DC: [38.895, -77.019],
  FL: [28.158, -82.029], GA: [33.05, -83.704], HI: [20.9, -156.4],
  ID: [44.525, -114.836], IL: [40.418, -88.987], IN: [39.935, -86.284],
  IA: [42.025, -93.343], KS: [38.515, -97.132], KY: [37.614, -84.818],
  LA: [30.924, -91.731], ME: [44.617, -69.448], MD: [39.053, -76.772],
  MA: [42.236, -71.492], MI: [43.445, -84.74], MN: [45.548, -94.126],
  MS: [32.832, -89.701], MO: [38.384, -92.467], MT: [46.949, -110.294],
  NE: [41.201, -98.19], NV: [38.9, -116.674], NH: [43.39, -71.573],
  NJ: [40.389, -74.517], NM: [34.707, -106.133], NY: [42.9, -75.5],
  NC: [35.575, -79.535], ND: [47.504, -99.606], OH: [40.39, -82.738],
  OK: [35.513, -97.002], OR: [44.518, -122.05], PA: [40.629, -77.557],
  RI: [41.699, -71.51], SC: [33.971, -81.053], SD: [44.288, -99.156],
  TN: [35.802, -86.47], TX: [31.287, -98.07], UT: [39.908, -111.811],
  VT: [44.029, -72.654], VA: [37.718, -78.233], WA: [47.325, -121.121],
  WV: [38.466, -80.986], WI: [44.103, -89.524], WY: [42.882, -107.257],
  // US territories
  PR: [18.221, -66.591], VI: [17.992, -64.807], GU: [13.444, 144.786],
  AS: [-14.271, -170.132], MP: [15.19, 145.741],
  // Canada provinces + territories
  ON: [50.0, -85.0], QC: [52.0, -71.5], BC: [53.7, -125.0],
  AB: [54.0, -114.5], MB: [53.0, -97.5], SK: [54.0, -105.5],
  NS: [45.0, -63.0], NB: [46.5, -66.0], NL: [53.0, -60.0],
  PE: [46.4, -63.2], NT: [64.8, -119.0], YT: [63.5, -135.0], NU: [70.0, -90.0],
};

/** Human-readable region names for the fallback centroids above. */
export const REGION_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', GU: 'Guam',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
  ON: 'Ontario', QC: 'Québec', BC: 'British Columbia', AB: 'Alberta',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', PE: 'Prince Edward Island',
  NT: 'Northwest Territories', YT: 'Yukon', NU: 'Nunavut',
};

/** Full state/province names (lowercased) → 2-letter code, for messy inputs. */
const NAME_TO_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [code, name] of Object.entries(REGION_NAMES)) {
    m[name.toLowerCase()] = code;
  }
  // A few common variants the canonical names don't cover.
  m['washington dc'] = 'DC';
  m['washington d.c.'] = 'DC';
  m['quebec'] = 'QC';
  return m;
})();

/** Resolve a free-text state/province to a 2-letter code, or null. */
export function normalizeRegionCode(state?: string | null): string | null {
  if (!state) return null;
  const raw = state.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.length === 2 && REGION_CENTROIDS[upper]) return upper;
  const byName = NAME_TO_CODE[raw.toLowerCase()];
  if (byName) return byName;
  if (REGION_CENTROIDS[upper]) return upper;
  // Free-text like "New Jersey (NJ)" — pull out an embedded valid 2-letter code.
  const embedded = upper.match(/\b([A-Z]{2})\b/g);
  if (embedded) {
    for (const code of embedded) if (REGION_CENTROIDS[code]) return code;
  }
  return null;
}

/** Title-case a free-text city ("san diego" / "SAN DIEGO" → "San Diego"). */
export function titleCaseCity(city?: string | null): string | null {
  if (!city) return null;
  const t = city.trim();
  if (!t) return null;
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** A minimal order address, as stored in orders.shipping_address (JSONB). */
export interface OrderAddress {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

/** One aggregated dot on the order map. */
export interface OrderCluster {
  key: string;
  lat: number;
  lng: number;
  count: number;
  /** Display label, e.g. "San Diego, CA" or "Ontario". */
  label: string;
  /** 2-letter region code when known, for counting states reached. */
  region: string | null;
}

/** Extract the US 3-digit ZIP prefix from a raw ZIP, or null (e.g. Canada). */
function zip3Prefix(zip?: string | null): string | null {
  if (!zip) return null;
  const digits = zip.replace(/\D/g, '');
  if (digits.length < 5) return null; // US ZIPs are 5 digits; short = not US
  return digits.slice(0, 3);
}

interface Bucket {
  lat: number;
  lng: number;
  count: number;
  region: string | null;
  labels: Map<string, number>;
}

function bump(labels: Map<string, number>, label: string) {
  labels.set(label, (labels.get(label) ?? 0) + 1);
}

function topLabel(labels: Map<string, number>): string {
  let best = '';
  let bestN = -1;
  for (const [label, n] of labels) {
    if (n > bestN) {
      best = label;
      bestN = n;
    }
  }
  return best;
}

/**
 * Aggregate order addresses into map clusters. Each order is placed at its ZIP3
 * centroid (metro-level) when it has a US ZIP, otherwise at its state/province
 * centroid. Orders with no resolvable geography are dropped. Returns clusters
 * sorted by count (busiest first).
 */
export function clusterOrders(addresses: OrderAddress[]): OrderCluster[] {
  const buckets = new Map<string, Bucket>();

  for (const addr of addresses) {
    const region = normalizeRegionCode(addr.state);
    const z3 = zip3Prefix(addr.zip);

    let key: string;
    let lat: number;
    let lng: number;
    let label: string;

    if (z3 && ZIP3[z3]) {
      [lat, lng] = ZIP3[z3];
      key = `z3:${z3}`;
      const city = titleCaseCity(addr.city);
      label = city ? (region ? `${city}, ${region}` : city) : region ? REGION_NAMES[region] ?? region : `ZIP ${z3}xx`;
    } else if (region && REGION_CENTROIDS[region]) {
      [lat, lng] = REGION_CENTROIDS[region];
      key = `rg:${region}`;
      const city = titleCaseCity(addr.city);
      label = city ? `${city}, ${region}` : REGION_NAMES[region] ?? region;
    } else {
      continue; // no geography we can place
    }

    const b = buckets.get(key);
    if (b) {
      b.count += 1;
      bump(b.labels, label);
    } else {
      const labels = new Map<string, number>();
      bump(labels, label);
      buckets.set(key, { lat, lng, count: 1, region, labels });
    }
  }

  const clusters: OrderCluster[] = [];
  for (const [key, b] of buckets) {
    clusters.push({
      key,
      lat: b.lat,
      lng: b.lng,
      count: b.count,
      label: topLabel(b.labels),
      region: b.region,
    });
  }
  clusters.sort((a, b) => b.count - a.count);
  return clusters;
}

/**
 * Pick a marker color by order volume so the map reads as a heat gradient:
 * hotter (more orders) → warmer neon.
 */
export function colorForCount(count: number): string {
  if (count >= 10) return MARKER_COLORS.cherry;
  if (count >= 5) return MARKER_COLORS.magenta;
  if (count >= 3) return MARKER_COLORS.sodium;
  if (count >= 2) return MARKER_COLORS.cyan;
  return MARKER_COLORS.lime;
}
