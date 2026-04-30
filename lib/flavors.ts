/**
 * Canonical flavor metadata. The DB seed migration uses these SKUs;
 * the storefront merges live product rows by SKU with this brand info.
 */
export interface FlavorBrandInfo {
  sku: string;
  name: string;
  display: string;
  feeling: string;
  fn: string;
  color: string;
  description: string;
}

export const FLAVORS: readonly FlavorBrandInfo[] = [
  {
    sku: 'KP-GREEN-HOUR',
    name: 'green hour',
    display: 'green\nhour',
    feeling: '// the night is starting',
    fn: '80mg caffeine + L-theanine',
    color: '#a8ff3c',
    description:
      "the soft start. you haven't taken your jacket off yet. lime, kiwi-skin tartness, a clean lift that lasts about two hours. zero sugar. fully vegan.",
  },
  {
    sku: 'KP-GLOSS',
    name: 'gloss',
    display: 'gloss',
    feeling: '// the night is on',
    fn: '150mg caffeine + ginseng',
    color: '#ff2d8a',
    description:
      "you're already on the floor. cherry-pomegranate, glossy on the lips, ginseng cuts the wall around 1am. for the people who never sit down.",
  },
  {
    sku: 'KP-AFTER',
    name: 'after',
    display: 'after',
    feeling: '// after the after',
    fn: 'ashwagandha + magnesium',
    color: '#7b2dff',
    description:
      "the wind-down. blackcurrant + sea-salt, no caffeine, magnesium and ashwagandha. for the uber home, the bath, the sleep that finally works.",
  },
  {
    sku: 'KP-STATIC',
    name: 'static',
    display: 'static',
    feeling: '// stay awake or die',
    fn: '200mg caffeine + taurine',
    color: '#00f0ff',
    description:
      "the heaviest pop. blue raspberry, full 200mg, taurine. don't take it past 4am unless you mean it. limit one.",
  },
] as const;

export const FLAVORS_BY_SKU: Record<string, FlavorBrandInfo> = Object.fromEntries(
  FLAVORS.map((f) => [f.sku, f])
);
