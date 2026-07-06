import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { MapPoint } from '@/lib/map';
import {
  clusterOrders,
  colorForCount,
  type OrderAddress,
} from '@/lib/order-map';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OrderRow {
  shipping_address:
    | (OrderAddress & { kind?: string | null })
    | null;
}

/**
 * Public feed for the customer-facing order map. Aggregates paid orders into
 * metro-level clusters (ZIP3 centroids) so buyers are never pinpointed — only
 * the shape of demand is exposed. No names, emails, or street addresses ever
 * leave this route; the response is counts + coordinates only.
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('shipping_address')
    .in('status', ['paid', 'shipped', 'completed']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const addresses: OrderAddress[] = [];
  for (const row of (data ?? []) as OrderRow[]) {
    const addr = row.shipping_address;
    if (!addr) continue;
    if (addr.kind === 'donation') continue; // donations have no real ship-to
    addresses.push({
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
    });
  }

  const clusters = clusterOrders(addresses);

  const points: MapPoint[] = clusters.map((c) => ({
    id: c.key,
    source: 'order',
    name: c.label,
    kind: 'orders',
    lat: c.lat,
    lng: c.lng,
    color: colorForCount(c.count),
    count: c.count,
    description:
      c.count === 1 ? '1 kiwi pop order' : `${c.count} kiwi pop orders`,
    live: false,
  }));

  const orders = clusters.reduce((sum, c) => sum + c.count, 0);
  const regions = new Set<string>();
  for (const c of clusters) if (c.region) regions.add(c.region);

  return NextResponse.json({
    points,
    stats: { orders, places: clusters.length, regions: regions.size },
  });
}
