import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProductRef {
  id: string;
  sku: string | null;
  name: string | null;
}
interface OrderItemRow {
  quantity: number | null;
  product: ProductRef | null;
}
interface OrderShape {
  id: string;
  shipping_address: { kind?: string | null } | null;
  items: OrderItemRow[] | null;
}

export interface ProductionSummaryEntry {
  productId: string;
  sku: string | null;
  name: string;
  totalQuantity: number;
  orderCount: number;
}

/**
 * Aggregates quantity-per-flavor across orders that are paid but not yet
 * shipped (the "to fulfill" bucket). Donations have no physical fulfillment,
 * so they're excluded.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(
      'id, shipping_address, items:order_items(quantity, product:products(id, sku, name))',
    )
    .eq('status', 'paid');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to load production summary', details: error.message },
      { status: 500 },
    );
  }

  const orders = (data ?? []) as unknown as OrderShape[];

  const byProduct = new Map<
    string,
    {
      productId: string;
      sku: string | null;
      name: string;
      totalQuantity: number;
      orderIds: Set<string>;
    }
  >();

  let orderCount = 0;
  let totalJars = 0;

  for (const order of orders) {
    if (order.shipping_address?.kind === 'donation') continue;
    orderCount += 1;
    for (const item of order.items ?? []) {
      const product = item.product;
      const qty = item.quantity ?? 0;
      if (!product?.id || qty <= 0) continue;
      totalJars += qty;
      const existing = byProduct.get(product.id);
      if (existing) {
        existing.totalQuantity += qty;
        existing.orderIds.add(order.id);
      } else {
        byProduct.set(product.id, {
          productId: product.id,
          sku: product.sku,
          name: product.name ?? 'Unknown',
          totalQuantity: qty,
          orderIds: new Set([order.id]),
        });
      }
    }
  }

  const entries: ProductionSummaryEntry[] = [...byProduct.values()]
    .map((e) => ({
      productId: e.productId,
      sku: e.sku,
      name: e.name,
      totalQuantity: e.totalQuantity,
      orderCount: e.orderIds.size,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return NextResponse.json({
    entries,
    orderCount,
    totalJars,
  });
}
