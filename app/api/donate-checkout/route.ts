import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DONATION_SKU = 'KP-DONATION-1USD';

const donateSchema = z.object({
  amountDollars: z.number().int().min(1).max(50_000),
  email: z.string().email(),
  message: z.string().max(500).optional(),
  name: z.string().max(120).optional(),
});

interface DonationProduct {
  id: string;
  name: string;
  price_cents: number;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = donateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amountDollars, email, message, name } = parsed.data;

  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name, price_cents')
    .eq('sku', DONATION_SKU)
    .maybeSingle<DonationProduct>();

  if (productError || !product) {
    return NextResponse.json(
      { error: 'Donation product is not available yet — try again shortly.' },
      { status: 503 }
    );
  }

  const totalCents = product.price_cents * amountDollars;

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

  const trimmedMessage = message?.trim() ?? '';
  const trimmedName = name?.trim() ?? '';

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: authedUserId,
      user_email: email,
      status: 'pending',
      total_cents: totalCents,
      shipping_address: {
        kind: 'donation',
        donorName: trimmedName || null,
        donationMessage: trimmedMessage || null,
      },
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Failed to create donation order', details: orderError?.message },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert([
      {
        order_id: order.id as string,
        product_id: product.id,
        quantity: amountDollars,
        price_cents: product.price_cents,
        is_preorder: false,
      },
    ]);

  if (itemsError) {
    return NextResponse.json(
      { error: 'Failed to record donation', details: itemsError.message },
      { status: 500 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Kiwi Pop Launch Fundraiser · $${amountDollars} donation`,
          description: 'Tip jar — counts toward the launch fundraiser. No goods ship.',
          metadata: { kind: 'donation', sku: DONATION_SKU },
        },
        unit_amount: totalCents,
      },
      quantity: 1,
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: email,
      success_url: `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}&kind=donation`,
      cancel_url: `${origin}/donate?cancelled=1`,
      submit_type: 'donate',
      metadata: {
        orderId: order.id as string,
        kind: 'donation',
        donationMessage: trimmedMessage.slice(0, 480),
        donorName: trimmedName.slice(0, 120),
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id as string,
          kind: 'donation',
        },
      },
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json(
      {
        error: 'Failed to start payment session',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
