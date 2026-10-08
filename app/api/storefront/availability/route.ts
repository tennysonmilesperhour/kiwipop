import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getPreorderOnlyMode } from '@/lib/settings';
import { retiredCheckoutRejection } from '@/lib/retired';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AvailabilityRow {
  id: string;
  sku: string | null;
  in_stock: number;
  preorder_only: boolean;
  preorder_deadline: string | null;
}

/**
 * Public stock snapshot for cart and checkout. in_stock and preorder flags
 * are already shown on product pages; this just lets the cart re-check them
 * after an item has been sitting in local storage.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const rawIds =
    body && typeof body === 'object' && Array.isArray((body as { productIds?: unknown }).productIds)
      ? (body as { productIds: unknown[] }).productIds
      : [];
  const productIds = rawIds
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .slice(0, 40);

  const preorderOnlyMode = await getPreorderOnlyMode();
  if (productIds.length === 0) {
    return NextResponse.json({ preorderOnlyMode, products: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, sku, in_stock, preorder_only, preorder_deadline')
    .in('id', productIds);

  if (error) {
    return NextResponse.json(
      { error: 'Could not load availability' },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as AvailabilityRow[];
  const retired = retiredCheckoutRejection(rows);
  if (retired) {
    return NextResponse.json(
      { error: retired.error, retiredProductIds: retired.retiredProductIds },
      { status: retired.status }
    );
  }

  return NextResponse.json({
    preorderOnlyMode,
    products: rows.map((row) => ({
      id: row.id,
      in_stock: row.in_stock,
      preorder_only: row.preorder_only,
      preorder_deadline: row.preorder_deadline,
    })),
  });
}
