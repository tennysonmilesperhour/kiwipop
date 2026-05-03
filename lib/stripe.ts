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
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    params.items.map((item) => {
      if (item.stripePriceId) {
        return {
          price: item.stripePriceId,
          quantity: item.quantity,
        };
      }
      return {
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
      };
    });

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: {
      orderId: params.orderId,
    },
    payment_intent_data: {
      metadata: {
        orderId: params.orderId,
      },
    },
  });
}
