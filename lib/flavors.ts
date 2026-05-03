/**
 * Canonical flavor metadata. SKU + name come from the production costing
 * spreadsheet (kiwi_pop_costing.xlsx). The DB seed migration uses these
 * SKUs; the storefront merges live product rows by SKU with this brand info.
 */
export interface FlavorBrandInfo {
  sku: string;
  name: string;
  display: string;
  feeling: string;
  fn: string;
  flavor: string;
  color: string;
  status: 'live' | 'soon';
  description: string;
}

export const FLAVORS: readonly FlavorBrandInfo[] = [
  {
    sku: 'KP-KIWI-KITTY',
    name: 'kiwi kitty',
    display: 'kiwi\nkitty',
    feeling: '// the original',
    fn: '6 functionals · luster dust',
    flavor: 'kiwi · sweet, tart, clean',
    color: '#a8ff3c',
    status: 'live',
    description:
      "the launch flavor. bright kiwi, edible mica glitter swirled through the middle. ~35 cal. <1g of sugar. sweetened with monk fruit and xylitol on an isomalt base. a little secret in your mouth.",
  },
  {
    sku: 'KP-LUCY-LEMON',
    name: 'lemon g. luci',
    display: 'lemon g.\nluci',
    feeling: '// the bright one',
    fn: '6 functionals · luster dust',
    flavor: 'lemon + ginger · sharp and citrus',
    color: '#ffce1f',
    status: 'soon',
    description:
      "the g is for ginger. bright lemon out front, ginger snap on the back end — sharper, more awake. freeze-dried lemon and ground ginger riding on the same isomalt base. coming soon.",
  },
  {
    sku: 'KP-MANGO-MOLLY',
    name: 'mango molly',
    display: 'mango\nmolly',
    feeling: '// the warm one',
    fn: '6 functionals · luster dust',
    flavor: 'mango · ripe, glossy, sticky',
    color: '#ff2d8a',
    status: 'soon',
    description:
      "ripe mango, glossy on the lips. freeze-dried mango powder cut with the LorAnn oil for full saturation. coming soon.",
  },
  {
    sku: 'KP-MARY-MINT',
    name: 'mary mint',
    display: 'mary\nmint',
    feeling: '// the cool down',
    fn: '6 functionals · luster dust',
    flavor: 'peppermint · clean, cold, sharp',
    color: '#00f0ff',
    status: 'soon',
    description:
      "cold peppermint, no sweetness on the back end. the mint that doesn't apologize. coming soon.",
  },
] as const;

export const FLAVORS_BY_SKU: Record<string, FlavorBrandInfo> = Object.fromEntries(
  FLAVORS.map((f) => [f.sku, f])
);

/**
 * Per-flavor product hero image, used wherever we render a flavor product
 * (landing flavor rail, /products/[id] hero, cart line items). Keyed by SKU.
 * Centralized here so the homepage and the product/preorder pages stay in
 * sync — no more "placeholder on the product page, real photo on the home
 * page" drift.
 */
export const FLAVOR_IMG: Record<string, string> = {
  'KP-KIWI-KITTY': '/landing/img/kiwi-kitty-pop.webp',
  'KP-LUCY-LEMON': '/landing/img/yellow-hair.jpg',
  'KP-MANGO-MOLLY': '/landing/img/lips-lollipop.jpg',
  'KP-MARY-MINT': '/landing/img/eye-galaxy.jpg',
};

/**
 * Per-flavor pack SKUs for the [1, 6, 20] ladder. Single defaults to the
 * flavor's own SKU; 6-pack and 20-pack point at flavor-specific bundle
 * SKUs (preorder-only for the three preorder flavors, live for kiwi
 * kitty via the existing KP-PACK-6 / KP-PACK-20 rows).
 */
export const PACK_SKUS_BY_FLAVOR: Record<
  string,
  { 1: string; 6: string; 20: string }
> = {
  'KP-KIWI-KITTY': {
    1: 'KP-KIWI-KITTY',
    6: 'KP-PACK-6',
    20: 'KP-PACK-20',
  },
  'KP-LUCY-LEMON': {
    1: 'KP-LUCY-LEMON',
    6: 'KP-LUCY-LEMON-PACK-6',
    20: 'KP-LUCY-LEMON-PACK-20',
  },
  'KP-MANGO-MOLLY': {
    1: 'KP-MANGO-MOLLY',
    6: 'KP-MANGO-MOLLY-PACK-6',
    20: 'KP-MANGO-MOLLY-PACK-20',
  },
  'KP-MARY-MINT': {
    1: 'KP-MARY-MINT',
    6: 'KP-MARY-MINT-PACK-6',
    20: 'KP-MARY-MINT-PACK-20',
  },
};

/**
 * Reverse map: any pack/flavor SKU -> the flavor SKU it belongs to.
 * Lets a pack-specific product page (e.g. KP-PACK-6) resolve back to
 * the flavor it represents so we can show the right hero photo and
 * pack tiles.
 */
export const FLAVOR_SKU_FOR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [flavorSku, packs] of Object.entries(PACK_SKUS_BY_FLAVOR)) {
    map[packs[1]] = flavorSku;
    map[packs[6]] = flavorSku;
    map[packs[20]] = flavorSku;
  }
  return map;
})();

/**
 * Resolves the best image for a product: prefer whatever the DB has on
 * `image_url` (admin can upload one any time); fall back to the brand
 * asset for that flavor (resolves bundle SKUs back to their flavor via
 * FLAVOR_SKU_FOR); null if neither exists.
 */
export function imageForProduct(
  sku: string | null | undefined,
  imageUrl: string | null | undefined,
): string | null {
  if (imageUrl) return imageUrl;
  if (!sku) return null;
  if (FLAVOR_IMG[sku]) return FLAVOR_IMG[sku];
  const flavorSku = FLAVOR_SKU_FOR[sku];
  if (flavorSku && FLAVOR_IMG[flavorSku]) return FLAVOR_IMG[flavorSku];
  return null;
}


/**
 * The six functional things doing real work, per the production recipe.
 * Source: kiwi_pop_costing.xlsx (Recipes tab, shared columns).
 */
export interface FunctionalIngredient {
  name: string;
  amount: string;
  why: string;
}

export const FUNCTIONALS: readonly FunctionalIngredient[] = [
  {
    name: 'theobromine',
    amount: '175 mg',
    why: 'a small square of dark chocolate, in lollipop form. lifted, not jittery.',
  },
  {
    name: 'kava',
    amount: '0.75 g instant',
    why: 'the relaxed thing. shoulders drop. you smile a little, alone.',
  },
  {
    name: 'ginseng',
    amount: '150 mg',
    why: 'half a supplement dose. steady wake, no crash.',
  },
  {
    name: 'b12',
    amount: '1 mg methylcobalamin',
    why: 'the active form. brain on, no buzz.',
  },
  {
    name: 'magnesium glycinate',
    amount: '300 mg',
    why: 'the un-cramp. legs stay loose on the floor.',
  },
  {
    name: 'taurine',
    amount: '250 mg',
    why: 'clean focus current. no energy-drink edge.',
  },
  {
    name: 'electrolytes',
    amount: '250 mg blend',
    why: 'sodium + potassium. you sweat, we replace.',
  },
  {
    name: 'blue spirulina',
    amount: '125 mg',
    why: 'where the color comes from. trace nutrition, real pigment.',
  },
] as const;

/**
 * The four-moment "what it's actually like" timeline used on the homepage
 * and product page.
 */
export interface TimelineMoment {
  index: string;
  title: string;
  body: string;
}

export const TIMELINE: readonly TimelineMoment[] = [
  {
    index: '00:00',
    title: 'the unwrap',
    body: 'matte foil, neon green underneath. the wrapper is good enough you might keep it.',
  },
  {
    index: '00:15',
    title: 'first lick',
    body: 'sweet, tart, clean. <1g of sugar — no sugar burn. the mica glitter catches the light.',
  },
  {
    index: '02:00',
    title: 'the lift',
    body: 'theobromine + kava click in. shoulders drop, head clears. you smile a little, alone.',
  },
  {
    index: '20:00',
    title: 'the after',
    body: 'theobromine + kava + b12 + electrolytes doing the math in the background. you feel like you ate.',
  },
] as const;

/**
 * Customer pull-quotes. Replace with real attributed comments as they come in.
 */
export interface PullQuote {
  text: string;
  byline: string;
  highlight?: boolean;
}

export const PULL_QUOTES: readonly PullQuote[] = [
  {
    text: 'kava in a lollipop. GENIUS.',
    byline: '@ on tiktok',
    highlight: true,
  },
  { text: "i kept the wrapper. that's a tell.", byline: '@ on instagram' },
  {
    text: "finally something at the festival that isn't water or beer.",
    byline: '@ in dms',
  },
  {
    text: 'sent one to my friend in vienna. she texted at 3am.',
    byline: '@ from austria',
  },
] as const;

/**
 * Multi-pack pricing tiers, per shopify_launch_spec.md.
 */
export interface PackTier {
  size: number;
  label: string;
  priceCents: number;
  perPopCents: number;
  badge?: string;
}

export const PACKS: readonly PackTier[] = [
  { size: 1, label: 'single', priceCents: 500, perPopCents: 500 },
  {
    size: 6,
    label: '6-pack',
    priceCents: 2500,
    perPopCents: 417,
    badge: 'share size',
  },
  {
    size: 20,
    label: 'party pack',
    priceCents: 6000,
    perPopCents: 300,
    badge: 'best value',
  },
] as const;
