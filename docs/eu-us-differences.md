# US ⇄ EU — how the two versions differ

**Research date: 2026‑07‑26.**

> ⚠️ **This is research, not regulatory sign‑off.** Everything below needs
> confirming with a competent EU food‑law consultant (and against AESAN guidance
> for Spain) before it goes on a physical label or into a signed wholesale
> agreement. It is written down here so the wholesale pages stop inventing their
> own version of the answer.

The machine‑readable version of this lives in **`lib/markets.ts`** — the label
module and the wholesale pages render from it, so change it there rather than
editing prose in three places.

## The headline problem: the EU has no route to the tingle

Both of our spilanthol sources are unauthorised novel foods in the EU.

| Ingredient | EU status |
|---|---|
| Jambu (*Acmella oleracea*) | **Not authorised.** The Commission terminated NF 2019/1369 (Acmella oleracea extract) on 26 Nov 2025 without adding it to the Union list. |
| Spilanthol extract powder | **Not authorised.** NF 2019/1394 terminated 27 Mar 2026, same outcome. |
| Chilcuague (*Heliopsis longipes*) | **Not authorised.** Never submitted — no application has ever been made for the plant or for affinin. |

The mouth tingle is the product's entire sensory hook, so this is a commercial
decision, not a labelling detail. The three honest options:

1. **Ship a European pop without the tingle.** Still a good low‑sugar functional
   lollipop; loses the thing that makes it memorable.
2. **File our own novel food dossier.** Multi‑year, expensive, and the two
   terminated procedures above are not an encouraging precedent.
3. **Hold the EU launch** until there's a route.

The Barcelona one‑pager now states this plainly rather than implying the
European pop is the US pop with a translated label.

> **Correction note.** The one‑pager previously claimed EFSA had "reviewed
> spilanthol and established a safe daily intake." That was wrong and is now
> fixed. Terminating an authorisation procedure is close to the opposite of
> establishing a safe intake.

## Second blocker: magnesium

The US pop carries **300 mg** of magnesium glycinate. The SCF/EFSA tolerable
upper level for **supplemental** magnesium is **250 mg/day** (readily
dissociable salts). The EU pop has to come down to ≤250 mg — a formulation
change, not a labelling one. Some member states also set their own maxima for
food supplements, so confirm against Spanish limits specifically.

## Needs review, not yet blocking

- **B12 at ~40,000% NRV.** 1 mg of methylcobalamin against a 2.5 µg NRV. Legal
  to declare, but several member states cap vitamin levels in food supplements
  and this is the kind of number that draws a question.
- **Everything else against the Novel Food Catalogue.** Jambu and chilcuague are
  the two we've confirmed. Lucuma, maca, and the spirulina / matcha colour
  sources should each be checked before the EU spec is called final.

## Settled labelling differences

| | US | EU |
|---|---|---|
| **Product category** | Dietary supplement in confection form (DSHEA); structure/function claims + FDA disclaimer | Confectionery, or a food supplement under Dir. 2002/46/EC. Structure/function claims aren't a category that exists — claims must come off the Reg. 1924/2006 authorised list |
| **Coconut** | Mandatory allergen — FDA classifies it as a tree nut | **Not** one of the 14 Annex II allergens. We declare it anyway |
| **Polyols** | Voluntary GI note | **Mandatory**: "excessive consumption may produce laxative effects" (Reg. 1169/2011 Annex III, >10% added polyols — we're at ~16 g in a ~17 g pop) |
| **Additive naming** | Plain names | Category + E‑number: isomalt (E953), xylitol (E967), colour: mica (E555), acidity regulator: citric acid (E330) |
| **Nutrition panel** | Per serving, calories, "includes added sugars", sodium in mg | Per 100 g, kJ before kcal, "of which polyols", salt not sodium, vitamins as % NRV |
| **FDA disclaimer / Prop 65** | Required | Inapplicable — do **not** print either on an EU label |

## What this means in code

- `lib/markets.ts` — `RESTRICTED_INGREDIENTS`, `EU_INGREDIENT_NAMES`,
  `MARKET_WARNINGS`, `FORMULA_DIFFERENCES`, `EU_BLOCKERS`.
- `lib/labels.ts` — `ingredientStatement(flavor, market)` and
  `flavorLabel(flavor, market)` take a market and default to `'us'`. The EU
  statement drops jambu + chilcuague and switches additives to E‑numbers;
  `warningsFor('eu')` adds the polyol statement and strips the FDA/Prop 65 lines.
- `NUTRITION_PER_POP` is **US format only**. The EU per‑100 g panel currently
  lives hand‑written on the Barcelona one‑pager; if a second EU surface ever
  needs it, move it into `lib/markets.ts` rather than copying it.
