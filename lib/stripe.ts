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
}

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
