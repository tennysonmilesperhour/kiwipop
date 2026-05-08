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
  /**
   * Short label used by the comedown checkout flavor picker. We don't want
   * to slice the marketing name (e.g. "lemon g. luci" → "g.") because
   * those abbreviated tokens read like product codes. Spell out the flavor
   * profile instead — "kiwi", "lemon ginger", "mint", "caramel apple".
   */
  pickerLabel: string;
}

export const FLAVORS: readonly FlavorBrandInfo[] = [
  {
    sku: 'KP-KIWI-KITTY',
    name: 'kiwi pop',
    display: 'kiwi\npop',
    feeling: '// the original',
    fn: 'full functional payload · luster dust',
    flavor: 'kiwi · sweet, tart, clean',
    color: '#a8ff3c',
    status: 'live',
    description:
      "the launch flavor. bright kiwi, edible mica glitter swirled through the middle. ~35 cal. <1g of sugar. xylitol-sweetened (tooth-friendly, no insulin spike) with a touch of monk fruit on an isomalt base. a little secret in your mouth.",
    pickerLabel: 'kiwi',
  },
  {
    sku: 'KP-LUCY-LEMON',
    name: 'lemon g. luci',
    display: 'lemon g.\nluci',
    feeling: '// get bright',
    fn: 'full functional payload · luster dust',
    flavor: 'lemon + ginger · sharp and citrus',
    color: '#ffce1f',
    status: 'soon',
    description:
      "the g is for ginger. bright lemon out front, ginger snap on the back end — sharper, more awake. freeze-dried lemon and ground ginger riding on the same isomalt base. coming soon.",
    pickerLabel: 'lemon ginger',
  },
  {
    sku: 'KP-MANGO-MOLLY',
    name: "molly's mint",
    display: "molly's\nmint",
    feeling: '// cool down',
    fn: 'full functional payload · luster dust',
    flavor: 'mint · cool, clean, lifted',
    color: '#00f0ff',
    status: 'soon',
    description:
      "bright peppermint, clean and cold on the back end. the mint that wakes you up without apologizing. coming soon.",
    pickerLabel: 'mint',
  },
  {
    sku: 'KP-MARY-MINT',
    name: 'mary caramel apple',
    display: 'mary\ncaramel apple',
    feeling: '// cozy up',
    fn: 'full functional payload · luster dust',
    flavor: 'caramel apple · warm, glossy, autumnal',
    color: '#d97539',
    status: 'soon',
    description:
      "warm caramel wrapped around tart green apple, glossy on the lips. autumn in lollipop form. coming soon.",
    pickerLabel: 'caramel apple',
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
 * The functional ingredients doing real work, per the production recipe.
 * Source: kiwi_pop_costing.xlsx (Recipes tab, shared columns).
 */
export interface FunctionalIngredient {
  name: string;
  amount: string;
  why: string;
}

export const FUNCTIONALS: readonly FunctionalIngredient[] = [
  {
    name: 'jambu',
    amount: 'food-flavor amount',
    why: 'the spark. brazilian flower (acmella oleracea). electric mouth tingle on the first lick — also called the buzz button.',
  },
  {
    name: 'theobromine',
    amount: '175 mg',
    why: 'a small square of dark chocolate, in lollipop form. lifted, not jittery.',
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
  {
    name: 'xylitol',
    amount: '~1.2 g',
    why: 'tooth-friendly sweetener. starves cavity bacteria, low-glycemic, no insulin spike.',
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
    index: '00:20',
    title: 'the spark',
    body: 'jambu hits. the brazilian buzz-button flower wakes the palate — fizzy mouth-tingle, watering, fully awake. people have used it this way for centuries.',
  },
  {
    index: '02:00',
    title: 'the lift',
    body: 'theobromine clicks in. shoulders drop, head clears. you smile a little, alone.',
  },
  {
    index: '20:00',
    title: 'the after',
    body: 'theobromine + b12 + electrolytes doing the math in the background. you feel like you ate.',
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

/**
 * Variety pack tiers: equal amounts of every flavor in one bundle.
 * The numbers below match the matching SKUs in the products table:
 *
 *   KP-VARIETY-PACK-8    8 pops  · 2 of each flavor   · $30 · price_1TSqZZ…
 *   KP-VARIETY-PACK-20   20 pops · 5 of each flavor   · $60 · price_1TT4eR…
 *   KP-VARIETY-PACK-40   40 pops · 10 of each flavor  · $100 · price_1TT4g6…
 *
 * The pre-pop math:
 *   8  →  $3.75/pop
 *   20 →  $3.00/pop  (matches the solo 20-pack)
 *   40 →  $2.50/pop  (best value)
 */
export interface VarietyTier {
  size: 8 | 20 | 40;
  perFlavor: 2 | 5 | 10;
  sku: string;
  label: string;
  priceCents: number;
  perPopCents: number;
  badge?: string;
}

export const VARIETY_TIERS: readonly VarietyTier[] = [
  {
    size: 8,
    perFlavor: 2,
    sku: 'KP-VARIETY-PACK-8',
    label: 'starter variety',
    priceCents: 3000,
    perPopCents: 375,
  },
  {
    size: 20,
    perFlavor: 5,
    sku: 'KP-VARIETY-PACK-20',
    label: 'party variety',
    priceCents: 6000,
    perPopCents: 300,
    badge: 'crowd size',
  },
  {
    size: 40,
    perFlavor: 10,
    sku: 'KP-VARIETY-PACK-40',
    label: 'mega variety',
    priceCents: 10000,
    perPopCents: 250,
    badge: 'best value',
  },
] as const;
