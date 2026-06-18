import 'server-only';

import Stripe from 'stripe';

let cached: Stripe | null = null;

function build(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY environment variable.'
    );
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
}

function getStripe(): Stripe {
  if (!cached) cached = build();
  return cached;
}

/**
 * Lazy-initialized Stripe client. Server-only.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

interface CheckoutLineItem {
  productId: string;
  name: string;
  amount: number;
  quantity: number;
  image?: string;
  stripePriceId?: string | null;
}

interface CreateCheckoutSessionParams {
  orderId: string;
  items: CheckoutLineItem[];
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  /**
   * Sum of line items in cents. Used to decide whether to apply a paid
   * shipping rate vs free-shipping over the threshold. Optional; if
   * omitted, no shipping_options are attached (current behavior).
   */
  subtotalCents?: number;
  /**
   * Percent discount to apply to the product subtotal (e.g. 25 for 25% off).
   * Attached as a one-time Stripe coupon so it shows on the receipt and is
   * reflected in session.amount_total. Optional.
   */
  discountPercentOff?: number;
  /**
   * Fixed discount in cents to apply (e.g. 500 for $5 off) — used by rewards
   * codes. Attached as a one-time amount_off Stripe coupon. Optional. If both
   * percent and amount are provided, percent wins.
   */
  discountAmountCents?: number;
}

/**
 * Retrieve (or lazily create) a reusable one-time percent-off coupon for a
 * given percentage. Stripe coupons are reusable across sessions; `duration:
 * 'once'` means it only discounts the single payment it's attached to.
 */
async function getOrCreateOnceCoupon(percentOff: number): Promise<string> {
  const id = `kiwipop-${percentOff}off-once`;
  try {
    const existing = await stripe.coupons.retrieve(id);
    if (existing && !(existing as { deleted?: boolean }).deleted) {
      return existing.id;
    }
  } catch {
    // Not found — fall through and create it.
  }
  const created = await stripe.coupons.create({
    id,
    percent_off: percentOff,
    duration: 'once',
    name: `${percentOff}% off (one-time)`,
  });
  return created.id;
}

/**
 * Retrieve (or lazily create) a reusable one-time amount-off coupon for a
 * given cents value (e.g. a $5 rewards code). `duration: 'once'` keeps it to
 * the single payment it's attached to.
 */
async function getOrCreateOnceAmountCoupon(amountCents: number): Promise<string> {
  const id = `kiwipop-amt${amountCents}-once`;
  try {
    const existing = await stripe.coupons.retrieve(id);
    if (existing && !(existing as { deleted?: boolean }).deleted) {
      return existing.id;
    }
  } catch {
    // Not found — fall through and create it.
  }
  const created = await stripe.coupons.create({
    id,
    amount_off: amountCents,
    currency: 'usd',
    duration: 'once',
    name: `$${(amountCents / 100).toFixed(2)} off (one-time)`,
  });
  return created.id;
}

/**
 * Stripe Shipping Rate ID for the standard US-domestic option. Pulled
 * from STRIPE_SHIPPING_RATE_DOMESTIC if set, otherwise falls back to the
 * production rate created in the Stripe dashboard. Kept in code so a
 * missing env var doesn't silently disable shipping.
 */
const STANDARD_DOMESTIC_SHIPPING_RATE =
  process.env.STRIPE_SHIPPING_RATE_DOMESTIC ?? 'shr_1TTXXlLMKed5UHTWC8xs9zTm';

/**
 * Free shipping kicks in once subtotal hits this threshold (matches the
 * promise on /legal/shipping). Override via FREE_SHIPPING_THRESHOLD_CENTS.
 */
const FREE_SHIPPING_THRESHOLD_CENTS =
  Number(process.env.FREE_SHIPPING_THRESHOLD_CENTS ?? '4000') || 4000;

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const inlineLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    params.items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: { productId: item.productId },
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    }));

  const someItemUsesStripePrice = params.items.some((item) => item.stripePriceId);
  const preferredLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    someItemUsesStripePrice
      ? params.items.map((item) =>
          item.stripePriceId
            ? { price: item.stripePriceId, quantity: item.quantity }
            : inlineLineItems[params.items.indexOf(item)],
        )
      : inlineLineItems;

  // Shipping: free over the threshold, $5 standard otherwise. Stripe collects
  // the shipping address so the rate can be applied + so we get a
  // delivery-grade address attached to the session/payment_intent.
  const subtotal = params.subtotalCents ?? null;
  const needsShippingCharge =
    subtotal !== null && subtotal < FREE_SHIPPING_THRESHOLD_CENTS;

  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
    needsShippingCharge
      ? [{ shipping_rate: STANDARD_DOMESTIC_SHIPPING_RATE }]
      : [];

  // A wholesale welcome code (or any percent discount) is attached as a
  // one-time Stripe coupon. Stripe applies it to the product line items and
  // reflects it in session.amount_total (which the webhook persists).
  const discountCouponId =
    params.discountPercentOff && params.discountPercentOff > 0
      ? await getOrCreateOnceCoupon(params.discountPercentOff)
      : params.discountAmountCents && params.discountAmountCents > 0
      ? await getOrCreateOnceAmountCoupon(params.discountAmountCents)
      : null;

  const sessionBase: Omit<Stripe.Checkout.SessionCreateParams, 'line_items'> = {
    mode: 'payment',
    payment_method_types: ['card'],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: { orderId: params.orderId },
    payment_intent_data: {
      metadata: { orderId: params.orderId },
    },
    shipping_address_collection: { allowed_countries: ['US'] },
    ...(shippingOptions.length > 0 ? { shipping_options: shippingOptions } : {}),
    ...(discountCouponId ? { discounts: [{ coupon: discountCouponId }] } : {}),
  };

  try {
    return await stripe.checkout.sessions.create({
      ...sessionBase,
      line_items: preferredLineItems,
    });
  } catch (err) {
    // If the failure was a stale / wrong-mode / deleted Stripe Price ID,
    // self-heal by rebuilding the session entirely from inline price_data
    // (computed from product.price_cents in the DB). The user's cart still
    // works; the only thing we lose is the Stripe Dashboard product link
    // for those line items.
    const looksLikeBadPrice =
      someItemUsesStripePrice &&
      err instanceof Stripe.errors.StripeError &&
      (err.code === 'resource_missing' ||
        /price/i.test(err.message ?? '') ||
        err.type === 'StripeInvalidRequestError');

    if (looksLikeBadPrice) {
      console.warn('[stripe] price_id rejected — falling back to inline price_data', {
        message: err.message,
        code: err.code,
      });
      return stripe.checkout.sessions.create({
        ...sessionBase,
        line_items: inlineLineItems,
      });
    }

    throw err;
  }
}
