/**
 * Per-flavor label data — the ingredients, approximate nutrition, the
 * functional ("nutraceutical") payload, and the safety warnings that would
 * normally be printed on packaging. The lollipops themselves don't carry
 * this information yet, so /labels surfaces it online and the per-flavor
 * pages are what the on-pop QR codes point at.
 *
 * Most of this is shared across every flavor (same base, same actives, same
 * warnings). Only the ingredient statement and the adaptogen change per
 * flavor, so we derive those from the canonical FLAVORS data rather than
 * duplicating it.
 */
import {
  FLAVORS,
  FLAVORS_BY_SKU,
  ingredientsForFlavor,
  type FlavorBrandInfo,
  type FunctionalIngredient,
} from './flavors';

/** URL slug per flavor SKU. Used for /labels/[flavor] and the QR targets. */
export const FLAVOR_SLUG_BY_SKU: Record<string, string> = {
  'KP-KIWI-KITTY': 'kiwi',
  'KP-LUCY-LEMON': 'lemon-ginger',
  'KP-MANGO-MOLLY': 'matcha-mint',
  'KP-MARY-MINT': 'caramel-apple',
};

export const FLAVOR_SKU_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(FLAVOR_SLUG_BY_SKU).map(([sku, slug]) => [slug, sku]),
);

/**
 * The flavor-specific part of the ingredient statement: the flavoring,
 * the natural color source, and anything else unique to that pop. The
 * shared base + actives are appended to this in `ingredientStatement`.
 */
const FLAVOR_SPECIFIC_INGREDIENTS: Record<string, string[]> = {
  'KP-KIWI-KITTY': ['natural kiwi flavor', 'spirulina (color)'],
  'KP-LUCY-LEMON': [
    'freeze-dried lemon',
    'ground ginger',
    'turmeric (color)',
  ],
  'KP-MANGO-MOLLY': [
    'peppermint essential oil',
    'spearmint essential oil',
    'matcha (color)',
  ],
  'KP-MARY-MINT': [
    'lucuma caramel flavor',
    'apple powder',
    'ceylon cinnamon',
  ],
};

/** Ingredients shared by the lollipop base, in descending order by weight. */
const SHARED_BASE_INGREDIENTS = [
  'isomalt',
  'coconut oil',
] as const;

/** Shared functional actives + sweeteners that close out every statement. */
const SHARED_TAIL_INGREDIENTS = [
  'xylitol',
  'monk fruit extract',
  'jambu (acmella oleracea)',
  'theobromine',
  'magnesium glycinate',
  'taurine',
  'electrolyte blend (sodium + potassium)',
  'vitamin b12 (methylcobalamin)',
  'edible mica (luster dust)',
] as const;

/**
 * The full ingredient statement for one flavor, base → flavor specifics →
 * shared actives. Returned as an ordered list so the label can render it
 * as a proper "INGREDIENTS:" line.
 */
export function ingredientStatement(flavor: FlavorBrandInfo): string[] {
  const adaptogen = flavor.adaptogen;
  return [
    ...SHARED_BASE_INGREDIENTS,
    ...(FLAVOR_SPECIFIC_INGREDIENTS[flavor.sku] ?? []),
    ...SHARED_TAIL_INGREDIENTS,
    adaptogen,
  ];
}

export interface NutritionRow {
  label: string;
  value: string;
  /** indent sub-rows (e.g. "includes added sugars") one level */
  indent?: boolean;
}

/**
 * Approximate nutrition per pop. Shared across flavors — the per-flavor
 * swaps are flavoring/adaptogen amounts too small to move these numbers.
 * Clearly labelled approximate; this is not a finalized FDA panel yet.
 */
export const NUTRITION_PER_POP: readonly NutritionRow[] = [
  { label: 'serving size', value: '1 lollipop (~17 g)' },
  { label: 'servings per pop', value: '1' },
  { label: 'calories', value: '~35' },
  { label: 'total fat', value: '<1 g' },
  { label: 'sodium', value: '~100 mg' },
  { label: 'total carbohydrate', value: '~16 g' },
  { label: 'total sugars', value: '<1 g', indent: true },
  { label: 'includes added sugars', value: '0 g', indent: true },
  { label: 'sugar alcohols', value: '~16 g (isomalt + xylitol)', indent: true },
] as const;

export interface Warning {
  text: string;
  /** render in the magenta danger accent (pets / strong cautions) */
  danger?: boolean;
}

/** Shared safety + regulatory warnings for every flavor. */
export const WARNINGS: readonly Warning[] = [
  {
    text: 'contains coconut (a tree nut). every flavor is made on a coconut oil base.',
    danger: true,
  },
  {
    text: 'not for anyone under 18.',
  },
  {
    text: 'not for use by anyone pregnant or nursing without consulting a healthcare professional.',
  },
  {
    text: 'consult a doctor before use if you take prescription medication that may interact with the functional ingredients.',
  },
  {
    text: 'sweetened with sugar alcohols (isomalt, xylitol). these may cause gas, bloating, or a laxative effect in larger quantities — start with one pop.',
  },
  {
    text: 'xylitol is highly toxic to dogs. keep these pops away from pets.',
    danger: true,
  },
  {
    text: 'california residents: see the prop 65 notice on the fda + safety page.',
  },
] as const;

export const FDA_NOTICE =
  'these statements have not been evaluated by the food and drug administration. this product is not intended to diagnose, treat, cure, or prevent any disease. kiwi pop is a confection with functional ingredients — candy, not a drug, and not medical advice.';

/**
 * Everything the label page needs for one flavor, assembled in one place.
 */
export interface FlavorLabel {
  flavor: FlavorBrandInfo;
  slug: string;
  ingredients: string[];
  nutrition: readonly NutritionRow[];
  functionals: FunctionalIngredient[];
  warnings: readonly Warning[];
}

export function flavorLabel(flavor: FlavorBrandInfo): FlavorLabel {
  return {
    flavor,
    slug: FLAVOR_SLUG_BY_SKU[flavor.sku],
    ingredients: ingredientStatement(flavor),
    nutrition: NUTRITION_PER_POP,
    functionals: ingredientsForFlavor(flavor),
    warnings: WARNINGS,
  };
}

/** All flavor labels, in canonical FLAVORS order. */
export const FLAVOR_LABELS: FlavorLabel[] = FLAVORS.map(flavorLabel);

/** Resolve a slug to its label, or null for an unknown slug. */
export function labelForSlug(slug: string): FlavorLabel | null {
  const sku = FLAVOR_SKU_BY_SLUG[slug];
  if (!sku) return null;
  const flavor = FLAVORS_BY_SKU[sku];
  if (!flavor) return null;
  return flavorLabel(flavor);
}
