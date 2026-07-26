/**
 * US ⇄ EU market differences — the single source of truth.
 *
 * Kiwi Pop is sold as one product with two labels. Almost everything is
 * shared, but a handful of things genuinely differ between the US and the
 * EU, and until now those differences lived as hand-written prose scattered
 * across the Barcelona one-pager, the line sheet, and the label module. That
 * drifts. This file holds them once; the pages render from it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * READ BEFORE PRINTING ANYTHING
 *
 * This module encodes our current understanding of the regulatory position.
 * It is research, not regulatory sign-off. Every EU claim here must be
 * confirmed by a competent food-law consultant (and, for Spain, against
 * AESAN guidance) before it goes on a physical label or into a signed
 * wholesale agreement. Where we are unsure, the entry says so rather than
 * guessing — see `EU_BLOCKERS`.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type Market = 'us' | 'eu';

export interface MarketInfo {
  id: Market;
  label: string;
  /** How the product is legally framed in this market. */
  productCategory: string;
  /** The regulation that governs the ingredient list + nutrition panel. */
  labellingRegime: string;
}

export const MARKETS: Record<Market, MarketInfo> = {
  us: {
    id: 'us',
    label: 'United States',
    productCategory:
      'dietary supplement in confection form (DSHEA); structure/function claims permitted with the FDA disclaimer',
    labellingRegime: '21 CFR 101 — Nutrition Facts, FDA allergen rules, Prop 65 where applicable',
  },
  eu: {
    id: 'eu',
    label: 'European Union',
    productCategory:
      'confectionery, or a food supplement under Directive 2002/46/EC — the US "dietary supplement in confection form" framing does not transfer, and structure/function claims are not a category that exists here',
    labellingRegime:
      'Regulation (EU) 1169/2011 — per-100 g nutrition declaration, Annex II allergens, Annex III mandatory statements; health claims restricted to the Reg. 1924/2006 authorised list',
  },
};

/**
 * A shared-base ingredient whose availability depends on the market.
 * Anything not listed here is permitted in both.
 */
export interface RestrictedIngredient {
  /** Matches the string used in the label ingredient statement. */
  ingredient: string;
  permittedIn: Market[];
  reason: string;
}

/**
 * The spilanthol problem.
 *
 * Both of our tingle ingredients are unauthorised novel foods in the EU. The
 * Commission terminated the authorisation procedure for Acmella oleracea
 * extract (NF 2019/1369) on 26 Nov 2025 and for spilanthol extract powder
 * (NF 2019/1394) on 27 Mar 2026, in both cases *without* adding them to the
 * Union list. Chilcuague has never been through the process at all.
 *
 * So the EU formula currently has no route to the mouth tingle — which is
 * the product's entire sensory hook. This is a commercial blocker, not a
 * labelling detail. See EU_BLOCKERS below.
 */
export const RESTRICTED_INGREDIENTS: readonly RestrictedIngredient[] = [
  {
    ingredient: 'chilcuague (heliopsis longipes)',
    permittedIn: ['us'],
    reason:
      'Not an authorised novel food in the EU (Reg. 2015/2283). Never submitted — no application has been made for Heliopsis longipes or its alkamide, affinin.',
  },
  {
    ingredient: 'jambu (acmella oleracea)',
    permittedIn: ['us'],
    reason:
      'Not an authorised novel food in the EU. The Commission terminated the Acmella oleracea extract procedure (NF 2019/1369) on 26 Nov 2025 and the spilanthol extract powder procedure (NF 2019/1394) on 27 Mar 2026, in both cases without adding them to the Union list.',
  },
] as const;

/** Is a given ingredient string permitted in a market? */
export function isIngredientPermitted(ingredient: string, market: Market): boolean {
  const restricted = RESTRICTED_INGREDIENTS.find((r) => r.ingredient === ingredient);
  return restricted ? restricted.permittedIn.includes(market) : true;
}

/**
 * EU ingredient lists name additives by category + E-number. The US uses
 * plain names. Keyed by the US-facing string used in the label module.
 */
export const EU_INGREDIENT_NAMES: Record<string, string> = {
  isomalt: 'isomalt (E953)',
  xylitol: 'xylitol (E967)',
  'edible mica (luster dust)': 'colour: mica (E555)',
  'citric acid': 'acidity regulator: citric acid (E330)',
};

/** Render an ingredient the way the given market's label names it. */
export function marketIngredientName(ingredient: string, market: Market): string {
  if (market === 'eu') return EU_INGREDIENT_NAMES[ingredient] ?? ingredient;
  return ingredient;
}

export interface AllergenRule {
  allergen: string;
  /** Markets where declaration is legally mandatory. */
  mandatoryIn: Market[];
  note: string;
}

/**
 * Coconut is the interesting one: the FDA classifies it as a tree nut and
 * requires declaration, while EU Annex II does not list it at all (the EU
 * nut list is almond, hazelnut, walnut, cashew, pecan, Brazil, pistachio,
 * macadamia). We declare it in both regardless — the US because we must,
 * the EU because a customer with a coconut allergy does not care which
 * annex it is on.
 */
export const ALLERGEN_RULES: readonly AllergenRule[] = [
  {
    allergen: 'coconut',
    mandatoryIn: ['us'],
    note:
      'FDA classifies coconut as a tree nut, so US declaration is mandatory. EU Annex II does not list coconut, so declaration is voluntary there — we declare it anyway.',
  },
] as const;

export interface MarketWarning {
  text: string;
  /** Markets where this warning is legally required. */
  requiredIn: Market[];
  basis: string;
  /**
   * True when the surface renders this statement in its own slot rather than
   * inside the warnings list (the FDA disclaimer has its own block). Listed
   * here anyway so the market rules stay complete in one place, but callers
   * building a warnings list should skip it.
   */
  renderedSeparately?: boolean;
}

/**
 * Warnings whose *legal* status differs by market. Shared safety warnings
 * that we carry everywhere by choice live in lib/labels.ts.
 */
export const MARKET_WARNINGS: readonly MarketWarning[] = [
  {
    text: 'excessive consumption may produce laxative effects.',
    requiredIn: ['eu'],
    basis:
      'Reg. (EU) 1169/2011 Annex III — mandatory for foods containing more than 10% added polyols. At ~16 g of isomalt + xylitol in a ~17 g pop we are far over that threshold, so this wording is not optional in the EU.',
  },
  {
    text: 'these statements have not been evaluated by the food and drug administration.',
    requiredIn: ['us'],
    basis: 'DSHEA disclaimer, required for structure/function claims. No EU equivalent — do not print it on an EU label.',
    renderedSeparately: true,
  },
  {
    text: 'california residents: see the prop 65 notice on the fda + safety page.',
    requiredIn: ['us'],
    basis: 'California Proposition 65. Not applicable outside the US.',
  },
] as const;

export function warningsForMarket(market: Market): readonly MarketWarning[] {
  return MARKET_WARNINGS.filter((w) => w.requiredIn.includes(market));
}

export interface NutritionFormat {
  basis: string;
  energy: string;
  notes: readonly string[];
}

export const NUTRITION_FORMAT: Record<Market, NutritionFormat> = {
  us: {
    basis: 'per serving (1 lollipop)',
    energy: 'calories',
    notes: [
      'Nutrition Facts panel per 21 CFR 101.9.',
      '"Includes added sugars" line is mandatory.',
      'Sodium declared in mg.',
    ],
  },
  eu: {
    basis: 'per 100 g (mandatory), optionally also per pop',
    energy: 'kJ and kcal, in that order',
    notes: [
      'Declaration order is fixed: energy, fat, of which saturates, carbohydrate, of which sugars, protein, salt.',
      '"Of which polyols" is the line that carries our sugar alcohols; there is no "added sugars" line in the EU format.',
      'Salt, not sodium — salt = sodium × 2.5.',
      'Vitamins must be declared as % NRV. Our 1 mg of B12 is ~40,000% NRV against a 2.5 µg reference, which is legal to state but will read alarmingly on a European panel and invites questions we should be ready for.',
    ],
  },
};

export interface FormulaDifference {
  /** Short label for the row/table heading. */
  title: string;
  us: string;
  eu: string;
  /** Whether this is settled, or still an open question. */
  status: 'settled' | 'open';
}

/**
 * The buyer-facing summary of how the two versions differ. Rendered on the
 * Barcelona one-pager and the wholesale line sheet.
 */
export const FORMULA_DIFFERENCES: readonly FormulaDifference[] = [
  {
    title: 'Mouth tingle (jambu + chilcuague)',
    us: 'Both spilanthol sources are in the US formula: jambu for the fast spark, chilcuague to hold it open.',
    eu: 'Neither is an authorised novel food in the EU, so as things stand the European formula cannot carry the tingle at all. Resolving this is the single biggest open item on the EU launch — we will not ship a European pop that quietly drops the hook without telling you first.',
    status: 'open',
  },
  {
    title: 'Product category',
    us: 'Dietary supplement in confection form (DSHEA), with structure/function claims and the FDA disclaimer.',
    eu: 'Confectionery, or a food supplement under Directive 2002/46/EC. Structure/function claims are not a category that exists in the EU — anything claim-like has to come off the Reg. 1924/2006 authorised list.',
    status: 'settled',
  },
  {
    title: 'Coconut allergen',
    us: 'Mandatory declaration — the FDA classifies coconut as a tree nut.',
    eu: 'Not one of the 14 Annex II allergens, so declaration is voluntary. We declare it anyway.',
    status: 'settled',
  },
  {
    title: 'Polyol warning',
    us: 'We carry a voluntary "may cause GI upset in larger quantities" note.',
    eu: 'Mandatory. Reg. 1169/2011 Annex III requires "excessive consumption may produce laxative effects" above 10% added polyols, and we are far above it.',
    status: 'settled',
  },
  {
    title: 'Additive naming',
    us: 'Plain names — isomalt, xylitol, edible mica.',
    eu: 'Category + E-number — isomalt (E953), xylitol (E967), colour: mica (E555).',
    status: 'settled',
  },
  {
    title: 'Nutrition panel',
    us: 'Per serving, calories, "includes added sugars", sodium in mg.',
    eu: 'Per 100 g, kJ before kcal, "of which polyols", salt rather than sodium, vitamins as % NRV.',
    status: 'settled',
  },
  {
    title: 'Magnesium dose',
    us: '300 mg magnesium glycinate per pop.',
    eu: 'Above the 250 mg/day EFSA-SCF upper level for supplemental magnesium. The European pop likely has to come down to ≤250 mg, which is a formulation change, not a labelling one.',
    status: 'open',
  },
] as const;

export interface Blocker {
  title: string;
  detail: string;
  severity: 'blocking' | 'needs-review';
}

/**
 * Open EU questions, in priority order. These are the things that stop us
 * signing an EU wholesale order, and they should be worked through with a
 * food-law consultant rather than resolved in this repo.
 */
export const EU_BLOCKERS: readonly Blocker[] = [
  {
    title: 'No authorised route to the tingle',
    detail:
      'Jambu and chilcuague are both unauthorised novel foods in the EU, and the two relevant applications (NF 2019/1369, NF 2019/1394) were terminated without authorisation in Nov 2025 and Mar 2026. The options are: sell a European pop with no tingle, pursue our own novel food dossier (multi-year, expensive), or hold the EU launch. This needs a commercial decision before the Barcelona conversation goes further.',
    severity: 'blocking',
  },
  {
    title: 'Magnesium exceeds the EU supplemental upper level',
    detail:
      'The SCF/EFSA upper level for supplemental magnesium is 250 mg/day; our pop carries 300 mg. Some member states also set their own maxima for food supplements. Reformulate down for the EU, or justify the pop as confectionery rather than a supplement — a decision with knock-on labelling consequences.',
    severity: 'blocking',
  },
  {
    title: 'B12 at ~40,000% NRV',
    detail:
      '1 mg of methylcobalamin against a 2.5 µg NRV. Legal to declare, but several member states set maximum vitamin levels for food supplements and this is the kind of number that draws a question from a national authority. Confirm against Spanish limits specifically.',
    severity: 'needs-review',
  },
  {
    title: 'Every other ingredient still needs a Novel Food Catalogue check',
    detail:
      'Jambu and chilcuague are the two we have confirmed. Lucuma, maca, and the spirulina/matcha colour sources should each be checked against the catalogue before the EU spec is treated as final.',
    severity: 'needs-review',
  },
] as const;
