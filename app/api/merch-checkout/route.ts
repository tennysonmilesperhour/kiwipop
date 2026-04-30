import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { MERCH_BY_SLUG } from '@/lib/merch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const merchCheckoutSchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = merchCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const item = MERCH_BY_SLUG[parsed.data.slug];
  if (!item) {
    return NextResponse.json({ error: 'Unknown merch item' }, { status: 404 });
  }

  const quantity = parsed.data.quantity ?? 1;
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.blurb,
          metadata: { merchSlug: item.slug, kind: 'merch' },
        },
        unit_amount: item.priceCents,
      },
      quantity,
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${origin}/checkout/success?merch=${item.slug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/merch`,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'MX'] },
      metadata: { merchSlug: item.slug, kind: 'merch' },
    });

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to start payment session',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
