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
    fn: '8 actives · kava + theobromine · blue spirulina',
    flavor: 'kiwi · sweet, tart, clean',
    color: '#a8ff3c',
    status: 'live',
    description:
      "the launch flavor. real kiwi powder, kava + theobromine for the lean-back-and-glow, blue spirulina for the color. ~35 calories. zero added sugar — sweetened with monk fruit on an isomalt + xylitol base. a little secret in your mouth.",
  },
  {
    sku: 'KP-LUCY-LEMON',
    name: 'lucy lemon',
    display: 'lucy\nlemon',
    feeling: '// the bright one',
    fn: '8 actives · kava + theobromine · blue spirulina',
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
    fn: '8 actives · kava + theobromine · blue spirulina',
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
    fn: '8 actives · kava + theobromine · blue spirulina',
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
 * Functional ingredients per pop, v2.0 recipe. The first six are the headline
 * "actives" rendered in the homepage signal grid; taurine, spirulina, and the
 * electrolyte blend are full-payload sidekicks called out in copy below.
 */
export interface FunctionalIngredient {
  name: string;
  amount: string;
  why: string;
}

export const FUNCTIONALS: readonly FunctionalIngredient[] = [
  {
    name: 'kava',
    amount: '0.75 g instant',
    why: 'the lean-back. soft body, eyes still working.',
  },
  {
    name: 'theobromine',
    amount: '175 mg',
    why: 'one square of dark chocolate. a slow lift, no crash.',
  },
  {
    name: 'ginseng',
    amount: '150 mg',
    why: 'the smooth focus. eyes open longer.',
  },
  {
    name: 'magnesium',
    amount: '300 mg glycinate',
    why: 'the soft lock on the muscles. relaxed, not asleep.',
  },
  {
    name: 'taurine',
    amount: '250 mg',
    why: 'amino acid, light hand. evens out the kava.',
  },
  {
    name: 'b12',
    amount: '1 mg methylcobalamin',
    why: 'the active form, full dose. brain on.',
  },
  {
    name: 'electrolytes',
    amount: '250 mg blend',
    why: 'sodium / potassium. you sweat. we replace.',
  },
  {
    name: 'spirulina',
    amount: '125 mg blue',
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
    body: 'sweet, tart, clean. real kiwi powder up front. the blue spirulina catches the light.',
  },
  {
    index: '02:00',
    title: 'the lean',
    body: 'kava settles in. shoulders drop, mouth goes a little tingly. small private smile.',
  },
  {
    index: '20:00',
    title: 'the after',
    body: 'theobromine + b12 + electrolytes doing the math in the background. you feel like you ate.',
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
