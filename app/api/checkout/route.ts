import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@/lib/stripe';
import { checkoutRequestSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProductRow {
  id: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  in_stock: number;
  preorder_only: boolean;
  stripe_price_id: string | null;
}

interface CheckoutItem {
  productId: string;
  quantity: number;
}

async function loadProducts(productIds: string[]): Promise<Map<string, ProductRow>> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price_cents, image_url, in_stock, preorder_only, stripe_price_id')
    .in('id', productIds);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  const byId = new Map<string, ProductRow>();
  for (const row of (data ?? []) as ProductRow[]) {
    byId.set(row.id, row);
  }
  return byId;
}

function computeTotalCents(
  items: CheckoutItem[],
  productsById: Map<string, ProductRow>
): number {
  return items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    return sum + product.price_cents * item.quantity;
  }, 0);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = checkoutRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: err.flatten() },
        { status: 400 }
      );
    }
    throw err;
  }

  const productsById = await loadProducts(parsed.items.map((i) => i.productId));

  for (const item of parsed.items) {
    const product = productsById.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product unavailable: ${item.productId}` },
        { status: 400 }
      );
    }
    if (product.in_stock <= 0 && !product.preorder_only) {
      return NextResponse.json(
        { error: `Product out of stock: ${product.name}` },
        { status: 409 }
      );
    }
  }

  const totalCents = computeTotalCents(parsed.items, productsById);
  if (totalCents <= 0) {
    return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
  }

  const isPreorderOrder = parsed.items.some(
    (item) => productsById.get(item.productId)?.preorder_only === true
  );

  // If the caller has an active session, attach their user_id so the order
  // shows up in their account history. Guests check out without a session
  // and the order stays user_id=null (retrievable via the order id link).
  let authedUserId: string | null = null;
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authedUserId = user?.id ?? null;
  } catch {
    authedUserId = null;
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: authedUserId,
      user_email: parsed.email,
      status: 'pending',
      total_cents: totalCents,
      shipping_address: parsed.shippingAddress,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Failed to create order', details: orderError?.message },
      { status: 500 }
    );
  }

  const orderItemsRows = parsed.items.map((item) => {
    const product = productsById.get(item.productId)!;
    return {
      order_id: order.id as string,
      product_id: item.productId,
      quantity: item.quantity,
      price_cents: product.price_cents,
      is_preorder: product.preorder_only,
    };
  });

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemsRows);

  if (itemsError) {
    return NextResponse.json(
      { error: 'Failed to create order items', details: itemsError.message },
      { status: 500 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  try {
    const session = await createCheckoutSession({
      orderId: order.id as string,
      customerEmail: parsed.email,
      successUrl: `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout/cancelled?order_id=${order.id}`,
      items: parsed.items.map((item) => {
        const product = productsById.get(item.productId)!;
        return {
          productId: product.id,
          name: product.name,
          amount: product.price_cents,
          quantity: item.quantity,
          image: product.image_url ?? undefined,
          stripePriceId: product.stripe_price_id,
        };
      }),
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: session.url,
      sessionId: session.id,
      isPreorder: isPreorderOrder,
    });
  } catch (err) {
    console.error('[checkout] stripe session create failed', err);
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);

    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: `Stripe rejected the checkout: ${detail}`,
        details: detail,
      },
      { status: 502 }
    );
  }
}
