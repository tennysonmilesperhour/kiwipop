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
  /** Shown on the Stripe Checkout line. Used for the preorder ship note. */
  description?: string;
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
 * Optional Stripe Shipping Rate ID. The dashboard rate
 * shr_1TTXXlLMKed5UHTWC8xs9zTm has tax_behavior=unspecified, which Stripe
 * rejects once automatic_tax is on. When STRIPE_SHIPPING_RATE_DOMESTIC is
 * unset, checkout sends an inline tax-inclusive shipping_rate_data instead.
 */
const STANDARD_DOMESTIC_SHIPPING_RATE = process.env.STRIPE_SHIPPING_RATE_DOMESTIC;

const INLINE_DOMESTIC_SHIPPING: Stripe.Checkout.SessionCreateParams.ShippingOption =
  {
    shipping_rate_data: {
      type: 'fixed_amount',
      display_name: 'Standard Domestic (US)',
      fixed_amount: { amount: 499, currency: 'usd' },
      tax_behavior: 'inclusive',
      delivery_estimate: {
        minimum: { unit: 'business_day', value: 2 },
        maximum: { unit: 'business_day', value: 4 },
      },
    },
  };

/**
 * Free shipping kicks in once subtotal hits this threshold (matches the
 * promise on /legal/shipping). Override via FREE_SHIPPING_THRESHOLD_CENTS.
 */
const FREE_SHIPPING_THRESHOLD_CENTS =
  Number(process.env.FREE_SHIPPING_THRESHOLD_CENTS ?? '4000') || 4000;

function inlineLineItem(
  item: CheckoutLineItem
): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        images: item.image ? [item.image] : [],
        metadata: { productId: item.productId },
        tax_code: 'txcd_40090001',
      },
      unit_amount: item.amount,
      tax_behavior: 'inclusive',
    },
    quantity: item.quantity,
  };
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const inlineLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    params.items.map(inlineLineItem);

  // A catalog Price cannot carry a per-checkout description, so preorder
  // lines (which need the ship note) always use inline price_data.
  const someItemUsesStripePrice = params.items.some(
    (item) => item.stripePriceId && !item.description
  );
  const preferredLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    someItemUsesStripePrice
      ? params.items.map((item, index) =>
          item.stripePriceId && !item.description
            ? { price: item.stripePriceId, quantity: item.quantity }
            : inlineLineItems[index]
        )
      : inlineLineItems;

  // Shipping: free over the threshold, $4.99 standard otherwise. Stripe collects
  // the shipping address so the rate can be applied + so we get a
  // delivery-grade address attached to the session/payment_intent.
  const subtotal = params.subtotalCents ?? null;
  const needsShippingCharge =
    subtotal !== null && subtotal < FREE_SHIPPING_THRESHOLD_CENTS;

  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
    needsShippingCharge
      ? [
          STANDARD_DOMESTIC_SHIPPING_RATE
            ? { shipping_rate: STANDARD_DOMESTIC_SHIPPING_RATE }
            : INLINE_DOMESTIC_SHIPPING,
        ]
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
    automatic_tax: { enabled: true },
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
