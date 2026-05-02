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
    fn: '6 functionals · pop rocks · luster dust',
    flavor: 'kiwi · sweet, tart, clean',
    color: '#a8ff3c',
    status: 'live',
    description:
      "the launch flavor. bright kiwi, real pop rocks crystals snapping inside, edible mica glitter swirled through the middle. ~35 cal. <1g of sugar. sweetened with monk fruit and xylitol on an isomalt base. a little secret in your mouth.",
  },
  {
    sku: 'KP-LUCY-LEMON',
    name: 'lucy lemon',
    display: 'lucy\nlemon',
    feeling: '// the bright one',
    fn: '6 functionals · pop rocks · luster dust',
    flavor: 'lemon + ginger · sharp and citrus',
    color: '#ffce1f',
    status: 'soon',
    description:
      "lemon meets ginger. sharper, more awake. freeze-dried lemon and ground ginger riding on the same isomalt base. coming soon.",
  },
  {
    sku: 'KP-MANGO-MOLLY',
    name: 'mango molly',
    display: 'mango\nmolly',
    feeling: '// the warm one',
    fn: '6 functionals · pop rocks · luster dust',
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
    fn: '6 functionals · pop rocks · luster dust',
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
    title: 'the snap',
    body: 'pop rocks hit. small electric thing on your tongue. you smile a little, alone.',
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
    size: 3,
    label: '3-pack',
    priceCents: 1200,
    perPopCents: 400,
    badge: 'starter',
  },
  { size: 6, label: '6-pack', priceCents: 2400, perPopCents: 400 },
  {
    size: 12,
    label: '12-pack',
    priceCents: 4800,
    perPopCents: 400,
    badge: 'best value',
  },
] as const;
