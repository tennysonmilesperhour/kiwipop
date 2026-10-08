import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { applyPaidCheckoutSession } from '@/lib/order-paid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function handlePaymentIntentFailed(
  intent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;

  await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle();

  if (error || !order) return;

  if (order.status !== 'cancelled') {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
  }
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET not configured' },
      { status: 500 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await applyPaidCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] handler failed', { type: event.type, err });
    return NextResponse.json(
      { error: 'Handler failed', type: event.type },
      { status: 500 }
    );
  }
}
