import 'server-only';

import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    'Missing STRIPE_SECRET_KEY environment variable. Set it in .env.local for local dev or Vercel project settings for production.'
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

interface CheckoutLineItem {
  productId: string;
  name: string;
  amount: number;
  quantity: number;
  image?: string;
}

interface CreateCheckoutSessionParams {
  orderId: string;
  items: CheckoutLineItem[];
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(
    (item) => ({
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
    })
  );

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
