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
kiwi pop is a candy built around a mouth tingle. jambu is the
sensory hook on the first lick, the same flower used in some
cocktails and oral-care flavors. chilcuague, the mexican golden
root, carries the same alkamide (affinin) and holds that tingle
warmer and longer. theobromine, b12, taurine, magnesium, and
electrolytes are in the formula. xylitol, isomalt, and monk fruit
are the sweeteners. none of that is a claim about mood, focus,
energy, immunity, sleep, muscles, teeth, or blood sugar.

every flavor shares that same base. what changes is one ingredient
per flavor: ginseng + spirulina in kiwi, ashwagandha in lemon ginger,
maca + cinnamon in caramel apple, l-theanine + chamomile in mint.
those are flavor pairings, not effect directions.

the papers below are background reading on ingredients. they are not
evidence that a kiwi pop will produce any effect those papers
examined. doses in published trials are often far above a food-flavor
amount, and kiwi pop is not a clinical product.

click any study title to read a plain-english note on what the paper
looked at. published titles are left as printed.
`.trim();

export const RESEARCH: ReadonlyArray<IngredientResearch> = [
  {
    name: 'jambu (Acmella oleracea / spilanthol)',
    blurb:
      'the brazilian buzz-button flower, used in brazilian, indian, and east african cooking and in some cocktail and oral-care flavors. in kiwi pop it is there for the electric mouth tingle, at a food-flavor amount. EFSA lists some spilanthol-bearing extracts in a flavouring database. that listing is not a statement that the pop is safe for everyone.',
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
          'review of the chemistry and traditional food use of acmella oleracea, including the tingling mouth sensation behind the english name "buzz button." kiwi pop does not claim a saliva-flow or oral-health effect.',
      },
      {
        title:
          'Acmella oleracea (jambu) as a food ingredient: review of safety and use',
        authors: 'EFSA Panel on Food Additives and Flavourings',
        journal: 'European Food Safety Authority · flavouring substance database',
        year: 2020,
        url: 'https://www.efsa.europa.eu/en/topics/topic/flavourings',
        summary:
          'EFSA maintains a flavouring substances database in which some spilanthol-bearing acmella extracts are listed. that listing is background on food-flavour use. it is not a statement that kiwi pop is safe for everyone or free of interactions.',
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
      'the mexican golden root, native to the sierra gorda highlands of guanajuato, querétaro, and san luis potosí. a traditional condiment in salsas, stews, and mezcal. its alkamide, affinin, is the same molecule as jambu\'s spilanthol, and in the pop the tingle reads warmer and longer. kiwi pop does not claim a pain, numbing, or medical use. like jambu, chilcuague is not an authorised novel food in the EU, so both appear in the US formula only.',
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
          'an animal study of affinin extracted from chilcuague root. cited for chemical background only. kiwi pop uses a food-flavor amount and does not claim a numbing or pain-related effect.',
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
      'an alkaloid in cocoa, distinct from caffeine. included in the formula. kiwi pop does not claim an effect on heart rate, mood, or energy.',
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
          'a review comparing theobromine with caffeine in the cocoa literature. background reading only. kiwi pop does not claim a cardiovascular, mood, or nervous-system effect.',
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
          'a controlled crossover trial that compared theobromine and caffeine. background reading only. kiwi pop does not claim a mood or performance effect.',
      },
      {
        title: 'Theobromine and the pharmacology of cocoa',
        authors: 'Smit HJ',
        journal: 'Handbook of Experimental Pharmacology',
        year: 2011,
        url: pubmed('Theobromine and the pharmacology of cocoa'),
        summary:
          'a review of theobromine pharmacology at dietary intake levels. background reading only. kiwi pop does not claim a cardiovascular, respiratory, or nervous-system effect.',
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
          'a human trial that measured blood pressure, heart rate, and subjective mood after isolated theobromine doses. background reading only. kiwi pop does not claim a blood-pressure, heart-rate, or mood effect.',
      },
    ],
  },
  {
    name: 'panax ginseng',
    blurb:
      'a root with a long history in food and traditional practice, included in the kiwi flavor. papers below have examined cognition, fatigue, and immune markers. kiwi pop does not claim a cognitive, fatigue, or immune effect.',
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
          'a placebo-controlled trial that examined ginseng and working-memory tasks. background reading only. kiwi pop does not claim a memory, calmness, or cognitive effect.',
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
          'a systematic review of randomized trials that looked at panax ginseng and quality-of-life measures. background reading only. kiwi pop does not claim a fatigue or physical-function effect.',
      },
      {
        title:
          'Ginseng for cognition (Cochrane review)',
        authors: 'Geng J, Dong J, Ni H, et al',
        journal: 'Cochrane Database of Systematic Reviews',
        year: 2010,
        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007769.pub2/full',
        summary:
          'a Cochrane review that evaluated published trials of ginseng and cognitive measures. background reading only. kiwi pop does not claim a cognitive or mood effect.',
      },
    ],
  },
  {
    name: 'vitamin b12 (methylcobalamin)',
    blurb:
      'methylcobalamin, a form of vitamin B12 included in the formula. kiwi pop does not claim an effect on energy metabolism, nerves, or deficiency.',
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
          'a clinical-practice review of B12 deficiency. background reading only. kiwi pop does not claim to treat or prevent deficiency.',
      },
      {
        title:
          'Methylcobalamin: a potential vitamin of pain killer',
        authors: 'Zhang M, Han W, Hu S, Xu H',
        journal: 'Neural Plasticity',
        year: 2013,
        url: pubmed('Methylcobalamin: a potential vitamin of pain killer'),
        summary:
          'a review of methylcobalamin as a form of B12. background reading only. kiwi pop does not claim a neurological or pain-related effect.',
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
          'a placebo-controlled trial of B vitamins in older adults. background reading only. kiwi pop does not claim an effect on brain atrophy or cognition.',
      },
    ],
  },
  {
    name: 'magnesium glycinate',
    blurb:
      'magnesium glycinate, included in the formula. papers below discuss magnesium intake. kiwi pop does not claim an effect on muscles, sleep, stress, mood, or deficiency.',
    studies: [
      {
        title: 'Magnesium: health professional fact sheet',
        authors: 'NIH Office of Dietary Supplements',
        journal: 'NIH ODS',
        year: 2024,
        url: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/',
        summary:
          'NIH reference on magnesium intake, food sources, and status. background reading only. kiwi pop does not claim to correct a deficiency.',
      },
      {
        title: 'The importance of magnesium in clinical healthcare',
        authors: 'Schwalfenberg GK, Genuis SJ',
        journal: 'Scientifica',
        year: 2017,
        url: pubmed('The importance of magnesium in clinical healthcare'),
        summary:
          'a clinical-practice review of magnesium in the medical literature. background reading only. kiwi pop does not claim a cardiovascular, muscle, or metabolic effect.',
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
          'a randomized trial of oral magnesium in adults with insomnia. background reading only. kiwi pop does not claim a sleep effect.',
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
          'a systematic review of trials that evaluated magnesium and self-reported anxiety. background reading only. kiwi pop does not claim an anxiety or stress effect.',
      },
    ],
  },
  {
    name: 'taurine',
    blurb:
      'an amino acid included in the formula. papers below are background reading. kiwi pop does not claim a cardiovascular, exercise, or antioxidant effect.',
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
          'a review of published taurine supplementation literature. background reading only. kiwi pop does not claim a therapeutic, cardiovascular, or metabolic effect.',
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
          'a controlled study of task performance that included taurine and caffeine. background reading only. kiwi pop does not claim a cognitive, motor, or energy-drink effect.',
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
      'sodium and potassium, included in the formula. kiwi pop does not claim a hydration, performance, or "feeling sharp" effect.',
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
          'WHO background on oral rehydration solution formulas. cited as electrolyte context only. kiwi pop is not an oral rehydration solution and does not claim a hydration effect.',
      },
      {
        title:
          'Hydration assessment of athletes',
        authors: 'Casa DJ, Cheuvront SN, Galloway SD, Shirreffs SM',
        journal: 'Sports Medicine',
        year: 2019,
        url: pubmed('Hydration assessment of athletes'),
        summary:
          'a review of hydration-status indicators in athletes. background reading only. kiwi pop does not claim a hydration effect.',
      },
      {
        title:
          'A randomized trial of hydrating beverages on rehydration',
        authors: 'Maughan RJ, Watson P, Cordery PA, et al',
        journal: 'American Journal of Clinical Nutrition',
        year: 2016,
        url: pubmed('A randomized trial of hydrating beverages on rehydration'),
        summary:
          'a trial that compared rehydration from common beverages. background reading only. kiwi pop does not claim a rehydration effect.',
      },
    ],
  },
  {
    name: 'blue spirulina (phycocyanin)',
    blurb:
      'the color in the kiwi flavor. blue spirulina is phycocyanin, the subject of an FDA GRAS notice for use as a food color. kiwi pop does not claim an antioxidant, anti-inflammatory, or neuroprotective effect.',
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
          'a review of phycocyanin biochemistry. background reading only. kiwi pop uses spirulina as a color and does not claim an antioxidant or anti-inflammatory effect.',
      },
      {
        title:
          'Phycocyanin from spirulina platensis: a review',
        authors: 'Pang QN, Zhang YQ',
        journal: 'Algal Research',
        year: 2017,
        url: pubmed('Phycocyanin from spirulina platensis: a review'),
        summary:
          'a review of phycocyanin structure and extraction, plus later laboratory literature. background reading only. kiwi pop does not claim an antioxidant or anti-inflammatory effect.',
      },
    ],
  },
  {
    name: 'xylitol',
    blurb:
      'a sugar alcohol used as a sweetener in place of most of the sugar. papers below discuss dental and glycemic research. kiwi pop does not claim to prevent cavities, starve bacteria, or change blood sugar or insulin.',
    studies: [
      {
        title:
          'Xylitol-containing products for preventing dental caries in children and adults',
        authors: 'Riley P, Moore D, Ahmed F, Sharif MO, Worthington HV',
        journal: 'Cochrane Database of Systematic Reviews',
        year: 2015,
        url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD010743.pub2/full',
        summary:
          'a Cochrane review of trials on xylitol and dental caries. background reading only. kiwi pop does not claim to prevent cavities.',
      },
      {
        title:
          'Xylitol: its role in caries control',
        authors: 'Söderling EM',
        journal: 'European Journal of Dentistry',
        year: 2009,
        url: pubmed('Xylitol: its role in caries control'),
        summary:
          'a review of proposed mechanisms for xylitol and dental caries. background reading only. kiwi pop does not claim a dental or antibacterial effect.',
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
          'a paper that measured blood glucose and insulin after xylitol-containing foods. background reading only. kiwi pop does not claim a blood-sugar, insulin, or diabetes-related effect.',
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
      'the sugar alcohol that gives kiwi pop its hard-candy structure. it is an approved food additive in the US and EU. kiwi pop does not claim a dental, metabolic, or blood-glucose effect.',
    studies: [
      {
        title:
          'Health potential of polyols as sugar replacers: focus on isomalt',
        authors: 'Sentko A, Willibald-Ettle I',
        journal: 'In: Sweeteners and Sugar Alternatives in Food Technology',
        year: 2012,
        url: pubmed('Health potential of polyols as sugar replacers'),
        summary:
          'a review of isomalt and other polyols as sucrose replacers, including gastrointestinal tolerance. background reading only. kiwi pop does not claim a dental or blood-glucose effect. sugar alcohols can upset your stomach in larger amounts.',
      },
      {
        title:
          'Isomalt: a review of its physiological effects',
        authors: 'Livesey G',
        journal: 'British Journal of Nutrition',
        year: 2003,
        url: pubmed('Isomalt: a review of its physiological effects'),
        summary:
          'a review of how isomalt is absorbed and fermented. background reading only. kiwi pop does not claim a blood-glucose effect.',
      },
      {
        title:
          'Joint FAO/WHO Expert Committee on Food Additives (JECFA): isomalt evaluation',
        authors: 'JECFA',
        journal: 'WHO Food Additives Series',
        year: 1985,
        url: 'https://www.fao.org/food/food-safety-quality/scientific-advice/jecfa/en/',
        summary:
          'JECFA evaluated isomalt for use as a food additive. that evaluation is regulatory background. it is not a statement that kiwi pop is safe for everyone.',
      },
    ],
  },
  {
    name: 'monk fruit (mogrosides)',
    blurb:
      'a high-intensity sweetener from monk fruit (siraitia grosvenorii), used in southern chinese food practice, with an FDA GRAS notice from 2010 for use as a sweetener. kiwi pop does not claim an effect on blood glucose.',
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
          'a review of mogroside chemistry and sweetness. background reading only. kiwi pop does not claim a blood-glucose effect.',
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
          'a human trial that compared sweeteners and 24-hour glucose profiles. background reading only. kiwi pop does not claim a blood-glucose effect.',
      },
    ],
  },
];
