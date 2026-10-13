/**
 * Shared FAQ data — surfaced on the landing page (zone above the footer)
 * and the dedicated /faq page. Same payload powers both, plus FAQPage
 * JSON-LD for AI / search crawlers.
 *
 * Questions are phrased the way a real person would search — that's what
 * AI search engines extract. Answers stay clean of medical claims and
 * defer to /legal/fda-disclaimer for safety detail.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    q: 'What does Kiwi Pop feel like?',
    a: 'The first lick brings a bright, electric tingle on the tongue and lips. That is jambu, the small flowering plant from Brazil also called the buzz button, backed by chilcuague, the Mexican golden root that holds the sensation open a little longer and turns it warmer. The pop also includes theobromine, magnesium, taurine, electrolytes, and B12. What people describe is the tingle: fizzy, warm, and a little playful. Kiwi Pop is candy. It is not a mood, focus, or energy product.',
  },
  {
    q: 'How long until I feel the tingle, and how long does it last?',
    a: 'The jambu sensation starts on the first lick and stays roughly as long as the pop does, a few minutes of light, fizzy mouth-tingle. Chilcuague arrives a beat later and carries it as a warmer spread rather than a fizz. We do not claim a later effect from the other ingredients. Follow the label serving size.',
  },
  {
    q: 'How many should I have?',
    a: 'Start with one and follow the label serving size. The tingle is genuinely novel, and one pop is the intended serving. We do not recommend more than three in a day.',
  },
  {
    q: 'How is Kiwi Pop different from alcohol?',
    a: 'It contains no ethanol and less than 1 gram of sugar. It is a sensory candy: the tingle is a conversation starter. It is not a substitute for alcohol, and it is not meant to keep you clear, alert, or free of a hangover.',
  },
  {
    q: 'What is jambu, and is it safe?',
    a: 'Jambu (Acmella oleracea), also called paracress, electric daisy, or the buzz button, is a small yellow-and-red flower native to South America. It has a long culinary history in Brazilian, Indian, and East African cuisine and is used as a flavor in some cocktails, chewing gum, and oral-care products. In Kiwi Pop it is there for the electric mouth tingle, at a food-flavor amount. That history is not a statement that it is safe for everyone, or that it has no interaction with alcohol or medication. If you have a plant allergy (especially the daisy / Asteraceae family), are pregnant or nursing, or take prescription medication, talk to a doctor first. See /legal/fda-disclaimer. Background reading is on /research.',
  },
  {
    q: 'What is chilcuague, and why is it in there next to jambu?',
    a: 'Chilcuague (Heliopsis longipes), also called chilcuán, Aztec root, or golden root, is a plant native to the Sierra Gorda highlands of central Mexico — Guanajuato, Querétaro, and San Luis Potosí. The root is the part used, and its alkamide, affinin, is the same molecule as the spilanthol in jambu. It is a traditional Mexican condiment, added to salsas, stews, and mezcal. In Kiwi Pop, jambu is the fast, fizzy spark on the first lick, and chilcuague holds that sensation open and warmer for the rest of the pop. Both are used at food-flavor amounts. We do not make a psychoactivity, pain, or drug-interaction claim about either plant. One caveat for European readers: neither jambu nor chilcuague is an authorised novel food in the EU, so a European Kiwi Pop cannot currently carry the tingle at all — see /wholesale for where that stands.',
  },
  {
    q: 'When do people typically have a Kiwi Pop?',
    a: 'Festivals, house parties, dinner with friends, a night in, sober-curious nights out, the green room. Anywhere the conversation could use a little electricity.',
  },
  {
    q: 'Can I mix Kiwi Pop with alcohol or coffee?',
    a: 'Kiwi Pop is candy. We do not claim it is safe to combine with alcohol, coffee, or medication. If you drink or take medicine, check with a doctor, follow the label serving size, and do not stack several pops on top of several espressos.',
  },
  {
    q: 'Who should not eat Kiwi Pop?',
    a: 'Anyone under 18, anyone pregnant or nursing (precautionary), anyone on prescription medication that warrants checking new dietary supplements with a doctor, and anyone with a sugar-alcohol sensitivity that causes GI distress. Every flavor is made on a coconut oil base, and the FDA classifies coconut as a tree nut, so do not eat Kiwi Pop if you have a coconut or tree-nut allergy. If you have a known plant allergy (especially to the daisy / Asteraceae family) talk to your doctor first — both jambu and chilcuague are Asteraceae. Full advisory on our /legal/fda-disclaimer page.',
  },
  {
    q: 'My dog got into one, what do I do?',
    a: 'Call your veterinarian or the Pet Poison Helpline immediately. Xylitol is highly toxic to dogs even in tiny amounts. Keep Kiwi Pop out of reach of pets.',
  },
  {
    q: 'Where do you ship and how fast?',
    a: 'Domestic United States only right now. In-stock items ship within 1–3 business days via USPS or UPS. Preorders ship when the batch is ready, and we email you then. Free shipping over $40, flat $4.99 under that. Canada and international are on the waitlist.',
  },
  {
    q: 'What if my order arrives damaged or missing pops?',
    a: 'Email thekiwipop@gmail.com with your order number and a photo if relevant. We will replace it or refund it. Full details on the /legal/refund page.',
  },
  {
    q: 'How should I store them, and how long do they keep?',
    a: 'Cool, dry, and out of direct sun. Isomalt-based pops can soften in heat and humidity. Best within 12 months of the batch date printed on the wrapper.',
  },
  {
    q: 'How much does Kiwi Pop cost?',
    a: 'A single Kiwi Pop is $5.00. A 6-pack is $25.00 and a 20-pack party pack is $60.00. Free shipping on orders over $40.',
  },
];

export const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};
