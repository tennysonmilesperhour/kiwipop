/**
 * Placeholder merch lineup for the launch fundraiser.
 *
 * These items are intentionally not in the products table — they're handled
 * by the /api/merch-checkout endpoint, which creates a one-shot Stripe
 * Checkout session directly from this static list. Swap real assets, prices,
 * and copy in here once printing partner is locked.
 */
export interface MerchItem {
  slug: string;
  num: string;
  name: string;
  display: string;
  kind: string;
  blurb: string;
  priceCents: number;
  color: string;
}

export const MERCH: readonly MerchItem[] = [
  {
    slug: 'kiwi-kitty-tee',
    num: '/01',
    name: 'kiwi kitty tee',
    display: 'kiwi\nkitty\ntee',
    kind: '// the launch shirt',
    blurb: 'heavyweight cotton · neon green print on midnight · unisex fit',
    priceCents: 3500,
    color: '#a8ff3c',
  },
  {
    slug: 'lucy-lemon-tee',
    num: '/02',
    name: 'lucy lemon tee',
    display: 'lucy\nlemon\ntee',
    kind: '// the bright shirt',
    blurb: 'heavyweight cotton · acid yellow print on bone · unisex fit',
    priceCents: 3500,
    color: '#ffce1f',
  },
  {
    slug: 'mango-molly-tee',
    num: '/03',
    name: 'mango molly tee',
    display: 'mango\nmolly\ntee',
    kind: '// the warm shirt',
    blurb: 'heavyweight cotton · hot pink print on midnight · unisex fit',
    priceCents: 3500,
    color: '#ff2d8a',
  },
  {
    slug: 'mary-mint-tee',
    num: '/04',
    name: 'mary mint tee',
    display: 'mary\nmint\ntee',
    kind: '// the cool shirt',
    blurb: 'heavyweight cotton · cyan print on bone · unisex fit',
    priceCents: 3500,
    color: '#00f0ff',
  },
  {
    slug: 'crew-tee',
    num: '/05',
    name: 'kiwi pop crew tee',
    display: 'kiwi\npop\ncrew',
    kind: '// the staff shirt',
    blurb: 'heavyweight cotton · ultraviolet print on midnight · unisex fit',
    priceCents: 4000,
    color: '#7b2dff',
  },
] as const;

export const MERCH_BY_SLUG: Record<string, MerchItem> = Object.fromEntries(
  MERCH.map((m) => [m.slug, m])
);
