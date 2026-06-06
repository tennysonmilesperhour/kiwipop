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
    a: 'The first lick brings a bright, electric tingle on the tongue and lips. That is jambu, the small flowering plant from Brazil also called the buzz button. Behind the tingle, the rest of the formula is doing quieter work: theobromine for a clean lift, magnesium and taurine to soften the edges, electrolytes and B12 for that "you ate something real" feeling. Most people describe it as alert, social, and a little playful.',
  },
  {
    q: 'How long until I feel the tingle, and how long does it last?',
    a: 'Instantly. The jambu sensation kicks in on the first lick and stays roughly as long as the pop does, a few minutes of light, fizzy mouth-tingle. The other functional ingredients (theobromine, magnesium, B12, electrolytes) take about 15–30 minutes to settle in.',
  },
  {
    q: 'How many should I have?',
    a: 'Start with one. The tingle is genuinely novel and the supplement payload is a real one, so most people find a single pop is plenty for an evening. We do not recommend more than three in a day.',
  },
  {
    q: 'Can I drive after eating one?',
    a: 'Yes. Nothing in the formula is sedating or impairing. Sugar alcohols (isomalt, xylitol) can be GI-disruptive in larger quantities, so do not stack a handful in one sitting.',
  },
  {
    q: 'How is Kiwi Pop different from alcohol?',
    a: 'No ethanol, no hangover, less than 1 gram of sugar. It is a sensory, social experience. The tingle is a conversation starter and the rest of the formula keeps you clear. A sober-curious option, not a buzz substitute.',
  },
  {
    q: 'What is jambu, and is it safe?',
    a: 'Jambu (Acmella oleracea), also called paracress, electric daisy, or the buzz button, is a small yellow-and-red flower native to South America. The active compound, spilanthol, produces the distinctive electric, salivating tingle. Jambu has a long culinary history in Brazilian, Indian, and East African cuisine and is widely used as a flavor in cocktails, chewing gum, and oral-care products. Reported uses include oral cooling, palate stimulation, and increased saliva flow. It is generally regarded as safe in food amounts and is used in Kiwi Pop in food-flavor quantities, not as a supplement dose. It is not psychoactive and does not interact with alcohol. The studies behind every ingredient in the formula are listed on our /research page.',
  },
  {
    q: 'When do people typically have a Kiwi Pop?',
    a: 'Festivals, house parties, dinner with friends, post-work decompress, sober-curious nights out, the ride home, the green room. Anywhere the conversation could use a little electricity.',
  },
  {
    q: 'Can I mix Kiwi Pop with alcohol or coffee?',
    a: 'Sure, there is nothing in the formula that conflicts with normal social use. That said, the supplement payload (theobromine, taurine, B12, magnesium) does real work, so do not stack five of them on top of three espressos.',
  },
  {
    q: 'Who should not eat Kiwi Pop?',
    a: 'Anyone under 18, anyone pregnant or nursing (precautionary), anyone on prescription medication that warrants checking new dietary supplements with a doctor, and anyone with a sugar-alcohol sensitivity that causes GI distress. If you have a known plant allergy (especially to the daisy / Asteraceae family) talk to your doctor before trying jambu. Full advisory on our /legal/fda-disclaimer page.',
  },
  {
    q: 'My dog got into one, what do I do?',
    a: 'Call your veterinarian or the Pet Poison Helpline immediately. Xylitol is highly toxic to dogs even in tiny amounts. Keep Kiwi Pop out of reach of pets.',
  },
  {
    q: 'Where do you ship and how fast?',
    a: 'Domestic United States only right now. We ship within 1–3 business days via USPS or UPS. Free shipping over $40, flat $4.99 under that. Canada and international are on the waitlist.',
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
