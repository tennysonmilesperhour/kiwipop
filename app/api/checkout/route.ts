import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@/lib/stripe';
import { checkoutRequestSchema } from '@/lib/validators';
import { resolveDiscount } from '@/lib/discounts';
import { getPreorderOnlyMode } from '@/lib/settings';
import { preorderFulfillmentNote } from '@/lib/commerce';
import { retiredCheckoutRejection } from '@/lib/retired';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
  price_cents: number;
  image_url: string | null;
  in_stock: number;
  preorder_only: boolean;
  preorder_deadline: string | null;
  stripe_price_id: string | null;
}

interface CheckoutItem {
  productId: string;
  quantity: number;
}

async function loadProducts(productIds: string[]): Promise<Map<string, ProductRow>> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, sku, name, price_cents, image_url, in_stock, preorder_only, preorder_deadline, stripe_price_id')
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

  let productsById: Map<string, ProductRow>;
  try {
    productsById = await loadProducts(parsed.items.map((i) => i.productId));
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    console.error('[checkout] failed to load products', err);
    return NextResponse.json({ error: detail }, { status: 503 });
  }

  // Retired SKUs are hidden, not deleted. Reject before any order row or
  // Stripe session so a stale cart cannot buy them.
  const retired = retiredCheckoutRejection(
    parsed.items.flatMap((item) => {
      const product = productsById.get(item.productId);
      return product ? [product] : [];
    })
  );
  if (retired) {
    return NextResponse.json(
      { error: retired.error },
      { status: retired.status }
    );
  }

  // Site-wide "preorder only" mode (Admin → Products). When on, every line is
  // a preorder regardless of stock, so the out-of-stock guard is skipped.
  const preorderOnlyMode = await getPreorderOnlyMode();
  const isPreorderItem = (product: ProductRow): boolean =>
    preorderOnlyMode || product.preorder_only;

  for (const item of parsed.items) {
    const product = productsById.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product unavailable: ${item.productId}` },
        { status: 400 }
      );
    }
    if (product.in_stock <= 0 && !isPreorderItem(product)) {
      return NextResponse.json(
        { error: `Sold out: ${product.name}` },
        { status: 409 }
      );
    }
  }

  const totalCents = computeTotalCents(parsed.items, productsById);
  if (totalCents <= 0) {
    return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
  }

  const isPreorderOrder = parsed.items.some((item) => {
    const product = productsById.get(item.productId);
    return product ? isPreorderItem(product) : false;
  });

  // Optional wholesale discount code. Validated against the codes table; an
  // invalid or already-used code is rejected so the customer gets clear
  // feedback rather than a silently-ignored discount. The code isn't marked
  // redeemed here — that happens once the order is actually paid (Stripe
  // webhook), so an abandoned checkout never burns a one-time code.
  let discountCode: string | null = null;
  let discountPercentOff = 0;
  let discountAmountCents = 0;
  let discountCents = 0;
  if (parsed.discountCode) {
    const code = await resolveDiscount(parsed.discountCode);
    if (!code) {
      return NextResponse.json(
        { error: 'That discount code is invalid or has already been used.' },
        { status: 400 }
      );
    }
    discountCode = code.code;
    if (code.percentOff > 0) {
      discountPercentOff = code.percentOff;
      discountCents = Math.round((totalCents * code.percentOff) / 100);
    } else {
      // Fixed-amount reward code — never discount below zero.
      discountAmountCents = Math.min(code.amountOffCents, totalCents);
      discountCents = discountAmountCents;
    }
  }

  const totalAfterDiscount = Math.max(0, totalCents - discountCents);

  // If the caller has an active session, attach their user_id so the order
  // shows up in their account history. Guests check out without a session
  // and the order stays user_id=null (retrievable via the order id link).
  let authedUserId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
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
      subtotal_cents: totalCents,
      discount_code: discountCode,
      discount_cents: discountCents,
      total_cents: totalAfterDiscount,
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
      is_preorder: isPreorderItem(product),
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

  // Marketing list capture: if the customer ticked the opt-in box, upsert
  // them into email_signups with their first/last name from shipping. Failure
  // here must NOT block checkout — the order is already paid-pending and the
  // most important thing is to get them to Stripe.
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null;
    const userAgent = request.headers.get('user-agent') ?? null;
    const nowIso = new Date().toISOString();

    if (parsed.marketingOptIn) {
      await supabaseAdmin.from('email_signups').upsert(
        {
          email: parsed.email.toLowerCase(),
          source: 'checkout',
          first_name: parsed.shippingAddress.firstName,
          last_name: parsed.shippingAddress.lastName,
          marketing_opt_in: true,
          opted_in_at: nowIso,
          ip_address: ip,
          user_agent: userAgent,
        },
        { onConflict: 'email' },
      );
    } else {
      // Even without opt-in we record the contact (no marketing_opt_in flag)
      // so admins can see who has bought without ever subscribing — but only
      // if they aren't already in the table. Never overwrite an existing
      // opt-in flag from a prior signup.
      await supabaseAdmin.from('email_signups').upsert(
        {
          email: parsed.email.toLowerCase(),
          source: 'checkout',
          first_name: parsed.shippingAddress.firstName,
          last_name: parsed.shippingAddress.lastName,
          ip_address: ip,
          user_agent: userAgent,
        },
        { onConflict: 'email', ignoreDuplicates: true },
      );
    }
  } catch (err) {
    console.error('[checkout] email_signups upsert failed', err);
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  try {
    const session = await createCheckoutSession({
      orderId: order.id as string,
      customerEmail: parsed.email,
      successUrl: `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout/cancelled?order_id=${order.id}`,
      subtotalCents: totalCents,
      ...(discountPercentOff > 0 ? { discountPercentOff } : {}),
      ...(discountAmountCents > 0 ? { discountAmountCents } : {}),
      items: parsed.items.map((item) => {
        const product = productsById.get(item.productId)!;
        const preorder = isPreorderItem(product);
        return {
          productId: product.id,
          name: product.name,
          amount: product.price_cents,
          quantity: item.quantity,
          image: product.image_url ?? undefined,
          stripePriceId: product.stripe_price_id,
          ...(preorder
            ? { description: preorderFulfillmentNote(product.preorder_deadline) }
            : {}),
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
