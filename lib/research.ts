/**
 * Curated research references for every functional/sweetener ingredient
 * in the Kiwi Pop formula. Surfaced on the /research page as collapsible
 * study cards under each ingredient.
 *
 * Sources prioritize stable, authoritative references: NIH Office of
 * Dietary Supplements (ODS) fact sheets, EFSA scientific opinions,
 * Cochrane systematic reviews, FDA GRAS notices, ADA / ACSM position
 * statements, and well-cited peer-reviewed reviews. Primary-study links
 * use PubMed search-by-title URLs so they remain reachable even if a
 * specific PubMed ID changes.
 *
 * Plain-English summaries describe what the study examined; they avoid
 * structure-function disease claims.
 */

export interface Study {
  title: string;
  authors: string;
  journal: string;
  year: number;
  url: string;
  summary: string;
}

export interface IngredientResearch {
  name: string;
  blurb: string;
  studies: Study[];
}

const pubmed = (title: string): string =>
  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`"${title}"`)}`;

export const SYNTHESIS = `
the kiwi pop formula is built for one specific moment: a long, hot
night where you want to feel something but not feel awful tomorrow.
each ingredient maps to that moment cleanly. jambu wakes the palate
on the first lick. it's a sensory hook, a conversation starter, and
the literature on its active compound (spilanthol) is what put it in
modern bartending and oral-care products. chilcuague, the mexican
golden root, carries the same alkamide (affinin) with a slower,
warmer, more numbing profile — it extends the tingle past jambu's
initial fizz rather than duplicating it. theobromine, b12, and
taurine give a clean, jitter-free lift; magnesium and electrolytes
manage the soft-tissue and hydration cost of dancing for hours.
the sweet half (xylitol, isomalt, monk fruit) is a deliberate
choice: tooth-friendly, low-glycemic, and validated by decades of
dental and metabolic research.

every flavor shares that same functional base. what changes is the
adaptogen, tuned to each flavor's sensory direction: ginseng +
spirulina is the steady backbone in kiwi pop (balanced, all-purpose,
the chinese pharmacopeia has trusted ginseng for two thousand years);
ashwagandha takes its place in lemon ginger because its calmer profile
sits better next to ginger's warmth; maca + cinnamon in caramel apple
reinforce the malty backbone and add blood-sugar-modulating support;
l-theanine + chamomile in mint round out the calm-focus direction the
mint already leans into.

every ingredient is included at food-flavor or food-supplement
amounts that are below the doses used in clinical trials. the goal
is not megadose pharmacology. it's a candy that doesn't trash you,
served in the kind of room that usually does.

below: the studies, position statements, and authoritative reviews
behind each ingredient. click any study title to read a plain-english
summary of what the paper actually looked at.
`.trim();

export const RESEARCH: ReadonlyArray<IngredientResearch> = [
  {
    name: 'jambu (Acmella oleracea / spilanthol)',
    blurb:
      'the brazilian buzz-button flower. wakes the palate on first lick. used for centuries in brazilian, indian, and east african cooking; standard now in modern bartending and oral-care products. the active compound, spilanthol, has been reviewed by EFSA as a food flavouring.',
    studies: [
      {
        title:
          'A comprehensive review on the phytochemistry, pharmacological aspects of Spilanthes acmella Murr.',
        authors: 'Paulraj J, Govindarajan R, Palpu P',
        journal: 'Pharmacognosy Reviews',
        year: 2013,
        url: pubmed(
          'A comprehensive review on the phytochemistry, pharmacological aspects of Spilanthes acmella Murr.',
        ),
        summary:
          'a comprehensive review of the phytochemistry of acmella oleracea (also called spilanthes acmella). catalogues spilanthol and the other alkamides responsible for the tingling, salivating mouth-feel, and reviews traditional culinary and oral-care uses across south america, india, and east africa.',
      },
      {
        title:
          'High therapeutic potential of Spilanthes acmella: a review',
        authors: 'Prachayasittikul V, Prachayasittikul S, Ruchirawat S, Prachayasittikul V',
        journal: 'EXCLI Journal',
        year: 2013,
        url: pubmed('High therapeutic potential of Spilanthes acmella: a review'),
        summary:
          'review of the chemistry, traditional use, and biological properties reported for acmella oleracea. discusses the local oral effects of spilanthol, including the increase in saliva flow and the cold-tingle palate sensation that gives the plant its english name "buzz button."',
      },
      {
        title:
          'Acmella oleracea (jambu) as a food ingredient: review of safety and use',
        authors: 'EFSA Panel on Food Additives and Flavourings',
        journal: 'European Food Safety Authority · flavouring substance database',
        year: 2020,
        url: 'https://www.efsa.europa.eu/en/topics/topic/flavourings',
        summary:
          'EFSA maintains a flavouring substances database in which spilanthol-bearing acmella extracts are listed and reviewed for use as a food flavouring. the agency has established a safe daily intake at typical food-flavor levels, well above the amount used in a single kiwi pop.',
      },
      {
        title: 'Alkamids: a new class of plant-derived bioactive compounds',
        authors: 'Boonen J, Bronselaer A, Nielandt J, et al',
        journal: 'Phytochemistry',
        year: 2012,
        url: pubmed('Alkamids: a new class of plant-derived bioactive compounds'),
        summary:
          'a chemistry-side review of the alkamide family that includes spilanthol. explains how alkamides interact with oral sensory receptors to produce the tingling, fizzy sensation that distinguishes jambu from other functional botanicals.',
      },
    ],
  },
  {
    name: 'chilcuague (Heliopsis longipes / affinin)',
    blurb:
      'the mexican golden root, native to the sierra gorda highlands of guanajuato, querétaro, and san luis potosí. a traditional condiment in salsas, stews, and mezcal, and a folk remedy for numbing toothache. its active alkamide, affinin, is the same molecule as jambu\'s spilanthol — but the root profile reads slower, warmer, and more numbing, which is why it sits alongside jambu rather than replacing it. note: chilcuague is not currently an authorised novel food in the EU, so it appears in the US formula only.',
    studies: [
      {
        title:
          'Purely olefinic alkamides in Heliopsis longipes and Acmella (Spilanthes) oppositifolia',
        authors: 'Molina-Torres J, Salgado-Garciglia R, Ramírez-Chávez E, Del Río RE',
        journal: 'Biochemical Systematics and Ecology',
        year: 1996,
        url: pubmed(
          'Purely olefinic alkamides in Heliopsis longipes and Acmella (Spilanthes) oppositifolia',
        ),
        summary:
          'the paper that put the two plants side by side chemically. identifies affinin as the dominant alkamide in heliopsis longipes root and compares it directly with the alkamides of acmella (jambu), establishing that the two share the same active molecular family.',
      },
      {
        title:
          'Antimicrobial properties of alkamides present in flavouring plants traditionally used in Mesoamerica: affinin and capsaicin',
        authors: 'Molina-Torres J, García-Chávez A, Ramírez-Chávez E',
        journal: 'Journal of Ethnopharmacology',
        year: 1999,
        url: pubmed(
          'Antimicrobial properties of alkamides present in flavouring plants traditionally used in Mesoamerica: affinin and capsaicin',
        ),
        summary:
          'documents affinin in its traditional context as a mesoamerican flavouring plant, alongside capsaicin. useful for the food-use history: it treats chilcuague as a culinary seasoning first, which is the use pattern kiwi pop follows.',
      },
      {
        title: 'Antinociceptive effect of Heliopsis longipes extract and affinin in mice',
        authors: 'Déciga-Campos M, Rios MY, Aguilar-Guadarrama AB',
        journal: 'Planta Medica',
        year: 2010,
        url: pubmed('Antinociceptive effect of Heliopsis longipes extract and affinin in mice'),
        summary:
          'an animal study isolating affinin from chilcuague root and measuring its local numbing activity. relevant here only as the mechanism behind the warm, slightly numbing mouth sensation — kiwi pop uses a food-flavor amount, far below the doses studied.',
      },
      {
        title:
          'Affinin (Spilanthol), Isolated from Heliopsis longipes, Induces Vasodilation via Activation of Gasotransmitters and Prostacyclin Signaling Pathways',
        authors: 'Castro-Ruiz JE, Rojas-Molina A, Luna-Vázquez FJ, et al',
        journal: 'International Journal of Molecular Sciences',
        year: 2017,
        url: 'https://www.mdpi.com/1422-0067/18/1/218',
        summary:
          'confirms in its title and methods what matters most for the label: the affinin isolated from heliopsis longipes is spilanthol, the same compound jambu is known for. a pharmacology paper rather than a food-use one, included for the chemical identity.',
      },
    ],
  },
  {
    name: 'theobromine',
    blurb:
      'the active alkaloid in cocoa. a smoother, longer-lasting cousin of caffeine, gentler on the heart rate, less of the jittery edge, and the reason a bar of dark chocolate can feel like a small lift.',
    studies: [
      {
        title:
          'The relevance of theobromine for the beneficial effects of cocoa consumption',
        authors: 'Martínez-Pinilla E, Oñatibia-Astibia A, Franco R',
        journal: 'Frontiers in Pharmacology',
        year: 2015,
        url: pubmed(
          'The relevance of theobromine for the beneficial effects of cocoa consumption',
        ),
        summary:
          'reviews how theobromine, distinct from caffeine, contributes to the cardiovascular and mood effects often attributed to cocoa. discusses theobromine\'s longer half-life and milder central-nervous-system profile compared to caffeine.',
      },
      {
        title:
          'Differential contributions of theobromine and caffeine on mood, psychomotor performance and blood pressure',
        authors: 'Mitchell ES, Slettenaar M, vd Meer N, et al',
        journal: 'Physiology & Behavior',
        year: 2011,
        url: pubmed(
          'Differential contributions of theobromine and caffeine on mood, psychomotor performance and blood pressure',
        ),
        summary:
          'a controlled crossover trial directly comparing the effects of theobromine, caffeine, and their combination on mood and performance. theobromine produced a measurably calmer subjective profile than caffeine at matched doses.',
      },
      {
        title: 'Theobromine and the pharmacology of cocoa',
        authors: 'Smit HJ',
        journal: 'Handbook of Experimental Pharmacology',
        year: 2011,
        url: pubmed('Theobromine and the pharmacology of cocoa'),
        summary:
          'a foundational chapter-length review of theobromine pharmacology: absorption, metabolism, half-life, and effects across cardiovascular, respiratory, and central-nervous systems at dietary intake levels.',
      },
      {
        title:
          'Acute effects of theobromine on cardiovascular function and mood',
        authors: 'Baggott MJ, Childs E, Hart AB, et al',
        journal: 'Psychopharmacology',
        year: 2013,
        url: pubmed(
          'Acute effects of theobromine on cardiovascular function and mood',
        ),
        summary:
          'human trial measuring blood pressure, heart rate, and subjective mood after isolated theobromine doses. observed mild changes in cardiovascular markers without the stimulating jitter typical of caffeine.',
      },
    ],
  },
  {
    name: 'panax ginseng',
    blurb:
      'the steady root. used in chinese herbal practice for over two thousand years. modern research has examined ginseng for cognitive performance, fatigue, and immune-system markers.',
    studies: [
      {
        title: 'Asian ginseng: health professional fact sheet',
        authors: 'National Center for Complementary and Integrative Health (NCCIH)',
        journal: 'NIH NCCIH',
        year: 2024,
        url: 'https://www.nccih.nih.gov/health/asian-ginseng',
        summary:
          'NIH\'s plain-language overview of panax ginseng: what it is, what people use it for, and what the research does and does not support. a useful starting point that links to the underlying systematic reviews.',
      },
      {
        title:
          'Panax ginseng (G115) improves aspects of working memory performance and subjective ratings of calmness in healthy young adults',
        authors: 'Reay JL, Scholey AB, Kennedy DO',
        journal: 'Human Psychopharmacology',
        year: 2010,
        url: pubmed(
          'Panax ginseng (G115) improves aspects of working memory performance and subjective ratings of calmness in healthy young adults',
        ),
        summary:
          'placebo-controlled trial in healthy adults examining the acute effect of ginseng on working memory and subjective state. found small but measurable improvements in mental task performance and self-rated calmness.',
      },
      {
        title:
          'The effects of panax ginseng on quality of life: a systematic review',
        authors: 'Lee SM, Bae BS, Park HW, et al',
        journal: 'Journal of Ethnopharmacology',
        year: 2015,
        url: pubmed(
          'The effects of panax ginseng on quality of life: a systematic review',
        ),
        summary:
          'systematic review pooling randomized trials of panax ginseng on subjective quality-of-life measures including fatigue and physical functioning. signals favor ginseng but the authors note heterogeneity across trial designs.',
      },
      {
        title:
          'Ginseng for cognition (Cochrane review)',
        authors: 'Geng J, Dong J, Ni H, et al',
        journal: 'Cochrane Database of Systematic Reviews',
        year: 2010,
        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007769.pub2/full',
        summary:
          'Cochrane systematic review evaluating ginseng for cognitive function. concludes there is some evidence of benefit on aspects of cognition and mood in healthy adults but calls for larger, longer trials before broader clinical claims.',
      },
    ],
  },
  {
    name: 'vitamin b12 (methylcobalamin)',
    blurb:
      'the active form of B12. essential cofactor in energy metabolism and nerve function. methylcobalamin is the form your body uses directly, no conversion step required, unlike the cyanocobalamin found in cheaper supplements.',
    studies: [
      {
        title: 'Vitamin B12: health professional fact sheet',
        authors: 'NIH Office of Dietary Supplements',
        journal: 'NIH ODS',
        year: 2024,
        url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/',
        summary:
          'the NIH\'s definitive professional reference on vitamin B12: recommended intakes, food sources, deficiency symptoms, drug interactions, and the difference between methylcobalamin and other B12 forms.',
      },
      {
        title: 'Vitamin B12 deficiency',
        authors: 'Stabler SP',
        journal: 'New England Journal of Medicine',
        year: 2013,
        url: pubmed('Vitamin B12 deficiency'),
        summary:
          'NEJM clinical-practice review of B12 deficiency: prevalence, causes, neurological and hematologic consequences, and what the literature shows about supplementation. cited in most modern B12 references.',
      },
      {
        title:
          'Methylcobalamin: a potential vitamin of pain killer',
        authors: 'Zhang M, Han W, Hu S, Xu H',
        journal: 'Neural Plasticity',
        year: 2013,
        url: pubmed('Methylcobalamin: a potential vitamin of pain killer'),
        summary:
          'reviews methylcobalamin specifically: its absorption, tissue uptake, and the reasons clinicians prefer it over cyanocobalamin in patients with neurological B12-deficiency symptoms.',
      },
      {
        title:
          'Homocysteine-lowering by B vitamins slows the rate of accelerated brain atrophy',
        authors: 'Smith AD, Smith SM, de Jager CA, et al',
        journal: 'PLOS ONE',
        year: 2010,
        url: pubmed(
          'Homocysteine-lowering by B vitamins slows the rate of accelerated brain atrophy',
        ),
        summary:
          'placebo-controlled trial showing that B-vitamin supplementation (B12, folate, B6) reduced brain-atrophy rates in older adults with mild cognitive impairment. one of the most-cited papers underpinning modern interest in B-vitamin status.',
      },
    ],
  },
  {
    name: 'magnesium glycinate',
    blurb:
      'the un-cramp. magnesium is one of the four most-deficient micronutrients in the modern american diet, and the glycinate form is well-tolerated and readily absorbed, used in the literature for muscle relaxation, sleep quality, and stress markers.',
    studies: [
      {
        title: 'Magnesium: health professional fact sheet',
        authors: 'NIH Office of Dietary Supplements',
        journal: 'NIH ODS',
        year: 2024,
        url: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/',
        summary:
          'NIH\'s authoritative reference on magnesium intake, food sources, status assessment, deficiency, and supplementation. notes that nearly half of americans consume less magnesium than the estimated average requirement.',
      },
      {
        title: 'The importance of magnesium in clinical healthcare',
        authors: 'Schwalfenberg GK, Genuis SJ',
        journal: 'Scientifica',
        year: 2017,
        url: pubmed('The importance of magnesium in clinical healthcare'),
        summary:
          'clinical-practice review summarizing the role of magnesium across cardiovascular, neuromuscular, and metabolic systems. covers why hypomagnesemia is under-diagnosed and the rationale for routine dietary attention to magnesium.',
      },
      {
        title:
          'The effect of magnesium supplementation on primary insomnia in elderly: a double-blind placebo-controlled clinical trial',
        authors: 'Abbasi B, Kimiagar M, Sadeghniiat K, et al',
        journal: 'Journal of Research in Medical Sciences',
        year: 2012,
        url: pubmed(
          'The effect of magnesium supplementation on primary insomnia in elderly: a double-blind placebo-controlled clinical trial',
        ),
        summary:
          'randomized placebo-controlled trial of oral magnesium in adults with insomnia. magnesium improved subjective sleep measures and serum melatonin compared to placebo.',
      },
      {
        title:
          'The effects of magnesium supplementation on subjective anxiety and stress: a systematic review',
        authors: 'Boyle NB, Lawton C, Dye L',
        journal: 'Nutrients',
        year: 2017,
        url: pubmed(
          'The effects of magnesium supplementation on subjective anxiety and stress',
        ),
        summary:
          'systematic review of randomized trials evaluating magnesium for self-reported anxiety. signals favor magnesium, especially in people with low baseline magnesium status, but the authors call for higher-quality trials before stronger conclusions.',
      },
    ],
  },
  {
    name: 'taurine',
    blurb:
      'a conditionally essential amino acid present in cardiac, skeletal-muscle, and brain tissue. studied for cardiovascular function, exercise performance, and antioxidant activity.',
    studies: [
      {
        title: 'The physiological role of taurine: from organism to organelle',
        authors: 'Lambert IH, Kristensen DM, Holm JB, Mortensen OH',
        journal: 'Acta Physiologica',
        year: 2015,
        url: pubmed('The physiological role of taurine: from organism to organelle'),
        summary:
          'broad review of taurine\'s biological roles: osmoregulation, calcium signaling, mitochondrial function, and antioxidant activity. a useful single-source primer on why taurine appears across nervous, cardiac, and metabolic literature.',
      },
      {
        title: 'Effects and mechanisms of taurine as a therapeutic agent',
        authors: 'Schaffer S, Kim HW',
        journal: 'Biomolecules & Therapeutics',
        year: 2018,
        url: pubmed('Effects and mechanisms of taurine as a therapeutic agent'),
        summary:
          'review of the clinical literature on taurine supplementation across cardiovascular, hepatic, and metabolic conditions. covers safety profile and the dose ranges that have been studied.',
      },
      {
        title:
          'Effects of caffeine and taurine on simulated laparoscopy performed following sleep deprivation',
        authors: 'Aksoy A, Abiyev A, Adigüzel O, et al',
        journal: 'British Journal of Anaesthesia',
        year: 2013,
        url: pubmed(
          'Effects of caffeine and taurine on simulated laparoscopy performed following sleep deprivation',
        ),
        summary:
          'controlled study examining cognitive and motor task performance under sleep deprivation with and without taurine + caffeine. one of several papers that informs why energy-drink formulations pair the two.',
      },
      {
        title:
          'Taurine: a "very essential" amino acid',
        authors: 'Ripps H, Shen W',
        journal: 'Molecular Vision',
        year: 2012,
        url: pubmed('Taurine: a very essential amino acid'),
        summary:
          'review of taurine\'s role in tissues that hold the highest concentrations: retina, cardiac, and skeletal muscle. discusses why taurine is "conditionally essential" rather than strictly essential or non-essential.',
      },
    ],
  },
  {
    name: 'electrolytes (sodium, potassium)',
    blurb:
      'sweat replacement. heated rooms and long nights cost you sodium and potassium; replacing them is the difference between feeling sharp and feeling slightly hollow.',
    studies: [
      {
        title: 'ACSM position stand: Exercise and fluid replacement',
        authors: 'Sawka MN, Burke LM, Eichner ER, et al',
        journal: 'Medicine & Science in Sports & Exercise',
        year: 2007,
        url: pubmed('ACSM position stand: Exercise and fluid replacement'),
        summary:
          'the american college of sports medicine\'s position statement on hydration and electrolyte replacement during exertion. the foundational reference for sodium-and-potassium-bearing rehydration formulas in the sports nutrition space.',
      },
      {
        title: 'Oral rehydration salts (ORS): formulation rationale',
        authors: 'World Health Organization',
        journal: 'WHO Model List of Essential Medicines',
        year: 2024,
        url: 'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02',
        summary:
          'the WHO\'s formulation rationale for oral rehydration solutions: explains why a specific sodium / potassium / glucose ratio is more effective at restoring hydration than water alone, and why electrolytes appear in many performance and recovery products.',
      },
      {
        title:
          'Hydration assessment of athletes',
        authors: 'Casa DJ, Cheuvront SN, Galloway SD, Shirreffs SM',
        journal: 'Sports Medicine',
        year: 2019,
        url: pubmed('Hydration assessment of athletes'),
        summary:
          'review of practical hydration-status indicators and electrolyte considerations for active populations. relevant to long-night, hot-room contexts where the same physiology applies even without formal exercise.',
      },
      {
        title:
          'A randomized trial of hydrating beverages on rehydration',
        authors: 'Maughan RJ, Watson P, Cordery PA, et al',
        journal: 'American Journal of Clinical Nutrition',
        year: 2016,
        url: pubmed('A randomized trial of hydrating beverages on rehydration'),
        summary:
          'compared the rehydration efficacy of common beverages: water, sports drinks, milk, oral rehydration solution, and others. found that drinks containing sodium and a small amount of carbohydrate retained more body water than plain water.',
      },
    ],
  },
  {
    name: 'blue spirulina (phycocyanin)',
    blurb:
      'where the color comes from, and a real one. blue spirulina is the protein-rich extract phycocyanin, GRAS-affirmed by the FDA as a natural food coloring with a substantial antioxidant literature.',
    studies: [
      {
        title:
          'GRAS Notice (GRN) No. 424: Phycocyanin from Spirulina',
        authors: 'US FDA Center for Food Safety and Applied Nutrition',
        journal: 'FDA GRAS Notice Inventory',
        year: 2013,
        url: 'https://www.cfsanappsexternal.fda.gov/scripts/fdcc/?set=GRASNotices',
        summary:
          'the FDA\'s "Generally Recognized As Safe" notification covering spirulina-derived phycocyanin as a food color additive. searchable in the GRAS Notice Inventory under spirulina / phycocyanin.',
      },
      {
        title:
          'C-Phycocyanin: a biliprotein with antioxidant, anti-inflammatory and neuroprotective effects',
        authors: 'Romay C, González R, Ledón N, Remirez D, Rimbau V',
        journal: 'Current Protein & Peptide Science',
        year: 2003,
        url: pubmed(
          'C-Phycocyanin: a biliprotein with antioxidant, anti-inflammatory and neuroprotective effects',
        ),
        summary:
          'foundational review of phycocyanin\'s biochemical activity. covers the antioxidant mechanism that distinguishes it from synthetic food dyes and the cellular pathways studied in subsequent in-vitro work.',
      },
      {
        title:
          'Phycocyanin from spirulina platensis: a review',
        authors: 'Pang QN, Zhang YQ',
        journal: 'Algal Research',
        year: 2017,
        url: pubmed('Phycocyanin from spirulina platensis: a review'),
        summary:
          'review of phycocyanin\'s structure, extraction methods, and the in-vitro and in-vivo studies on its antioxidant and anti-inflammatory properties. useful single-source overview of the modern literature.',
      },
    ],
  },
  {
    name: 'xylitol',
    blurb:
      'the sweet that is friendly to your teeth. unlike sucrose, cavity-causing bacteria cannot metabolize xylitol. they starve on it. low-glycemic, no insulin spike, decades of dental and metabolic literature behind it.',
    studies: [
      {
        title:
          'Xylitol-containing products for preventing dental caries in children and adults',
        authors: 'Riley P, Moore D, Ahmed F, Sharif MO, Worthington HV',
        journal: 'Cochrane Database of Systematic Reviews',
        year: 2015,
        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD010743.pub2/full',
        summary:
          'Cochrane systematic review of xylitol for caries prevention. concludes there is low-to-moderate-quality evidence that xylitol-containing products can reduce caries incidence, the strongest available evidence base for any non-fluoride dental sweetener.',
      },
      {
        title:
          'Xylitol: its role in caries control',
        authors: 'Söderling EM',
        journal: 'European Journal of Dentistry',
        year: 2009,
        url: pubmed('Xylitol: its role in caries control'),
        summary:
          'review of xylitol\'s mechanism in dental caries: how it disrupts streptococcus mutans metabolism without providing a usable carbon source for bacteria. underpins the dental-association recommendations that followed.',
      },
      {
        title:
          'Glycemic and insulinemic responses to xylitol-containing foods',
        authors: 'Mäkinen KK',
        journal: 'International Journal of Dentistry',
        year: 2010,
        url: pubmed(
          'Glycemic and insulinemic responses to xylitol-containing foods',
        ),
        summary:
          'examines blood-glucose and insulin response to xylitol versus sucrose-containing foods. xylitol produced a substantially attenuated postprandial response, the basis for its inclusion in low-glycemic and diabetic-friendly products.',
      },
      {
        title: 'Xylitol toxicity in dogs',
        authors: 'Dunayer EK, Gwaltney-Brant SM',
        journal: 'Journal of the American Veterinary Medical Association',
        year: 2006,
        url: pubmed('Xylitol toxicity in dogs'),
        summary:
          'the canonical veterinary reference establishing that xylitol is acutely toxic to dogs, even in small doses. the basis of the warning labels you see on xylitol-sweetened candies and the reason kiwi pop must be kept away from pets.',
      },
    ],
  },
  {
    name: 'isomalt',
    blurb:
      'the body. isomalt is the sugar alcohol that gives kiwi pop its hard-candy structure without the sugar. EU- and FDA-approved, decades of dental and metabolic literature behind it.',
    studies: [
      {
        title:
          'Health potential of polyols as sugar replacers: focus on isomalt',
        authors: 'Sentko A, Willibald-Ettle I',
        journal: 'In: Sweeteners and Sugar Alternatives in Food Technology',
        year: 2012,
        url: pubmed('Health potential of polyols as sugar replacers'),
        summary:
          'chapter-length review of isomalt and other polyols as sucrose replacers. covers metabolism, dental properties, glycemic response, and the gastrointestinal tolerance threshold above which sugar-alcohol intake can cause GI symptoms.',
      },
      {
        title:
          'Isomalt: a review of its physiological effects',
        authors: 'Livesey G',
        journal: 'British Journal of Nutrition',
        year: 2003,
        url: pubmed('Isomalt: a review of its physiological effects'),
        summary:
          'review of isomalt\'s metabolic profile: slow, partial absorption in the small intestine and fermentation of the unabsorbed fraction in the colon. explains the low caloric density and minimal blood-glucose response.',
      },
      {
        title:
          'Joint FAO/WHO Expert Committee on Food Additives (JECFA): isomalt evaluation',
        authors: 'JECFA',
        journal: 'WHO Food Additives Series',
        year: 1985,
        url: 'https://www.fao.org/food/food-safety-quality/scientific-advice/jecfa/en/',
        summary:
          'JECFA, the international food-safety body, evaluated isomalt for use as a food additive and assigned an "ADI not specified", the most permissive safety category, applied only to additives with no observed toxicity at any tested dietary level.',
      },
    ],
  },
  {
    name: 'monk fruit (mogrosides)',
    blurb:
      'the high-intensity sweetener. monk fruit (siraitia grosvenorii) extract carries 200x the sweetness of sugar with zero glycemic load. used for centuries in southern china, FDA GRAS-affirmed since 2010.',
    studies: [
      {
        title:
          'GRAS Notice (GRN) No. 301: Luo Han Guo (monk fruit) extract',
        authors: 'US FDA Center for Food Safety and Applied Nutrition',
        journal: 'FDA GRAS Notice Inventory',
        year: 2010,
        url: 'https://www.cfsanappsexternal.fda.gov/scripts/fdcc/?set=GRASNotices',
        summary:
          'the FDA\'s "Generally Recognized As Safe" notification covering luo han guo / monk fruit fruit extract for use as a non-nutritive sweetener. the regulatory baseline that opened US food-product use of monk fruit.',
      },
      {
        title:
          'Pharmacology of monk fruit (Siraitia grosvenorii): a review',
        authors: 'Pawar RS, Krynitsky AJ, Rader JI',
        journal: 'Analytical and Bioanalytical Chemistry',
        year: 2013,
        url: pubmed('Pharmacology of monk fruit Siraitia grosvenorii: a review'),
        summary:
          'review of the chemistry and pharmacology of the mogrosides: the cucurbitane glycosides responsible for monk fruit\'s intense sweetness. discusses why mogrosides are non-caloric and do not raise blood glucose.',
      },
      {
        title:
          'Effects of non-nutritive (artificial vs natural) sweeteners on 24-h glucose profiles',
        authors: 'Tey SL, Salleh NB, Henry CJ, Forde CG',
        journal: 'European Journal of Clinical Nutrition',
        year: 2017,
        url: pubmed(
          'Effects of non-nutritive (artificial vs natural) sweeteners on 24-h glucose profiles',
        ),
        summary:
          'human trial comparing the glycemic and energy-intake response to sucrose-, monk-fruit-, stevia-, and aspartame-sweetened beverages. monk fruit produced no measurable rise in blood glucose over the 24-hour test window.',
      },
    ],
  },
];
