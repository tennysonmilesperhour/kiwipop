# Kiwipop — Shopify Launch Spec

A concrete handoff document for taking Kiwipop from the design package to a live e-commerce store. This is meant to be readable by a founder doing the launch themselves OR handed to a Shopify Partner / theme developer for scoping.

---

## Why Shopify

Shopify is the right launch platform for Kiwipop because it gives you, out of the box, every back-of-house feature a small CPG brand needs without you having to build any of it: order management, inventory tracking, customer accounts, payment processing, shipping label generation, tax calculation, abandoned cart recovery, refunds, fulfillment workflows, and a built-in admin dashboard.

The earlier conversation considered building a custom admin from scratch. That's the wrong move at this stage — you'd spend months and thousands of dollars rebuilding what Shopify already does well. The right move is to use Shopify's admin as-is and put your design effort into the storefront experience (which is what we've already built).

### Plan recommendation

**Basic Shopify ($39/month at time of writing)** is enough to launch. It includes everything needed for DTC sales: unlimited products, 2 staff accounts, basic reports, abandoned cart recovery, gift cards, and the full theme/admin system. Don't pay for the higher tiers until you actually need their features (advanced reports, more staff seats, lower transaction fees at higher volume).

You'll graduate to **Shopify ($105/month)** once you're doing meaningful volume — the lower payment processing fee alone usually pays for the upgrade past about $5K/month in revenue.

Skip Shopify Plus. That's enterprise tier and not relevant until you're at $1M+/year.

---

## Theme strategy

This is the most important architectural decision in the launch. There are three viable paths.

### Path A — Hire a theme dev to build the existing landing page as a custom Shopify theme

A Shopify Partner or freelance theme developer takes the `index.html` from this package and rebuilds it as a Liquid-based custom theme. The four-floor narrative becomes the homepage. Product pages, collection pages, cart, and checkout are designed as natural extensions of the same visual system.

**Pros:** Keeps the brand identity 100% intact. You get the Three.js 3D candy, the liquid glass, the cyberpunk descent — all of it preserved on a real e-commerce backend. The page we built is the spec; nothing gets lost in translation.

**Cons:** Costs $5,000–$15,000 depending on the developer and how much they extend beyond the homepage. Takes 4–8 weeks. You're dependent on that developer (or a successor) for future changes.

**This is the right path if** you have launch budget, you're committed to the existing visual direction, and you want the brand to feel premium and distinct on day one.

### Path B — Buy a pre-made theme close to your aesthetic, customize heavily

Shopify's Theme Store has paid themes ($150–$400, one-time) and several would get you 60% of the way to the Kiwipop aesthetic. Themes worth looking at: **Impulse**, **Symmetry**, **Motion**, and **Empire** — all support dark backgrounds, bold typography, and rich product imagery. You then heavily customize the theme's CSS and homepage layout to match the design package.

**Pros:** Cheaper ($150–$400 + maybe $1,000–$3,000 in customization). Faster (1–3 weeks). All standard e-commerce sections (collection grids, product detail, cart drawer) are already built and tested.

**Cons:** You lose some of the more distinctive elements — the Three.js candy almost certainly doesn't survive, the liquid glass effect would need to be hand-rebuilt, and the four-floor narrative gets compressed. The brand will feel "Shopify-themed" not "custom-built."

**This is the right path if** you want to launch fast on a tight budget and you're okay with a more conventional storefront layout, treating the design package more as a mood board than a spec.

### Path C — Use Shopify's free Dawn theme + DIY customization

Dawn is Shopify's free reference theme. It's clean, fast, and infinitely customizable. You'd use Shopify's no-code theme editor to swap colors, fonts, and section layouts to match the brand, and bring in custom code blocks for the parts that need it.

**Pros:** Free. Very fast. You can do it yourself if you're comfortable in admin tools.

**Cons:** Will look like a "nice Shopify store," not a Kiwipop site. The brand-distinguishing elements (3D candy, liquid glass, four-floor descent, custom typography animations) won't make it through.

**This is the right path if** you genuinely just want to start selling pops to friends and early customers while figuring out what works, and you're planning to do a custom rebuild later once you have revenue.

### My recommendation

**Path A or B**, depending on launch budget. The brand identity we built is the most differentiated thing about Kiwipop right now. Path C undercuts that. Either invest in a custom theme (Path A) and protect the brand, or save money with Path B and accept some compromise. Don't go the free route unless you genuinely don't have $1,500 to spend on this.

---

## What to configure in Shopify admin (concrete checklist)

Work through these in order. Most of this is one-time setup, an hour or two of work.

### Products

- Create one product: **Kiwipop**. Use the four flavor names (Kiwipop / Lucypop / Mollypop / Marypop) as **variants**, not as separate products. This means customers see one product page and pick a flavor — cleaner UX, simpler inventory, and any reviews aggregate to one product.
- For each variant, set: SKU code, weight (for shipping calc), inventory count, and "track quantity" enabled.
- Until the other three flavors launch, keep them as variants but set inventory to 0 and "continue selling when out of stock" disabled. They'll show as "sold out" or you can hide them entirely until launch. Better: create them as a **separate "Coming soon" product** that only collects email signups.
- Product images: invest in real photography. The 3D Three.js candy is great as a hero element on the homepage, but product detail pages need real photos of the actual lollipops, the wrapper, the box, and lifestyle shots.
- Description: pull directly from the existing landing page copy. The "what it's actually like" timeline, the six-things-that-do-something ingredient cards, and the brand voice notes from the design package all translate cleanly into product description content.

### Variants (the four flavors)

- Configure variant images so each flavor's color shows when selected.
- Pricing: same price across variants unless you have a reason to differentiate. Recommended starting point: **$5 per pop, $48 for a 12-pack, $24 for a 6-pack, $12 for a 3-pack starter.** This is a guess based on category positioning (Liquid Death is $20/12-pack on water, GHOST is similar on energy). Validate against your actual cost-of-goods-sold before committing.
- Subscriptions: see Recharge in the apps section below.

### Collections

Two collections to create at launch:

1. **All Pops** — automatic, contains all live products. Used as the default browse view.
2. **Coming Soon** — manual, contains the upcoming flavors (if you set them up as separate products). Drives email collection.

You can add seasonal/festival collections later (e.g. "Coachella Edition") when you do limited-edition drops.

### Inventory

- Track quantity on every variant.
- Set **low stock alerts** (Shopify will email you when a variant drops below a threshold you set; recommended 50 units to start, adjust based on your fulfillment cadence).
- For the Excel/spreadsheet question: see the dedicated section below.

### Shipping

- Set up shipping zones: **Domestic US** (start here), then **Canada** as you grow, then **International** once you've validated demand.
- Recommended starting rates: **flat $5 standard shipping, free over $40**. Free-shipping-threshold doubles average order value reliably.
- For festival-edition drops, consider expedited shipping as an upsell.
- Shopify Shipping (built in) gives you discounted USPS/UPS labels — significantly cheaper than printing your own postage. Turn it on.

### Taxes

- Shopify auto-calculates US sales tax once you tell it where you have nexus. Initially, that's just the state where you operate. Add states as you cross thresholds (most states require collection above $100K in sales OR 200 transactions per year — varies by state).
- Don't overthink this at launch. Start with your home state, file quarterly, expand as you grow.

### Payments

- **Shopify Payments** is the right default. It's built in, lowest fees (2.9% + 30¢ per transaction on Basic plan), and integrates with everything.
- Add **Shop Pay** (one-tap checkout for returning customers — included with Shopify Payments). Increases conversion 1.7x vs. guest checkout per Shopify's data.
- Add **PayPal** as a secondary option. Some customers prefer it.
- Skip Apple Pay / Google Pay configuration — they're auto-enabled when Shopify Payments is on.

### Customer accounts

- Enable **classic customer accounts** (not "new customer accounts" — that's the email-link version, which is better for tech-forward Gen Z but less recognizable to broader audiences). You can switch later.
- Set up an **account page** that includes order history, saved addresses, and subscription management.

### Email & marketing

- Enable **abandoned cart emails**. Default Shopify ones work fine; better ones via Klaviyo.
- Customize the **order confirmation email** to match the brand voice. The default Shopify template is generic; replace it with something that uses the Kiwipop voice ("Your secret is on its way." / "Sweet, tart, clean — and en route.").

### Domains

- Buy `kiwipop.co` (or whatever variant is available — `.co` is fine and on-brand for consumer products). Connect it to Shopify.
- Set up email forwarding for `hello@`, `wholesale@`, `events@`, `press@` (the addresses already used in the basement contact section). Google Workspace at $6/user/month is the standard play.

---

## Apps to install

Shopify's app ecosystem is sprawling. These are the ones worth installing on day one. Everything else can wait.

### Essentials (install before launch)

**Klaviyo** ($45/month at smallest tier, free up to 250 contacts)
The email and SMS platform. Better than Shopify's built-in email tools by a wide margin. Set up: welcome flow for new subscribers, abandoned cart flow, post-purchase flow, win-back flow. Klaviyo's free tier is enough to start.

**Judge.me** ($15/month or free tier)
Customer reviews. Free tier is generous. Hooks reviews directly into product pages and Google search results (rich snippets / star ratings in search). Reviews are critical for CPG conversion.

**Privy or Optimonk** ($15–$30/month)
Email capture pop-ups. Use sparingly — one timed pop-up offering 10% off in exchange for email is fine; more than that erodes the brand.

### Strongly recommended

**Recharge** ($99/month at smallest tier, plus 1.25% transaction fee)
Subscription management. Lets customers sign up for monthly auto-ship at a discount. For a consumable product like Kiwipop with a strong reorder cycle, subscriptions are a major revenue lever — typical CPG brands see 20–40% of revenue from subscriptions once it's running. Worth the cost.

If $99/month feels like too much at launch, **Shopify Subscriptions** is free and built into Shopify but more limited. Start there, graduate to Recharge once subscription revenue justifies it.

**Loox or Okendo** (alternative to Judge.me, $15–$35/month)
Photo/video reviews specifically. For a product where the experience is visual (glittery tongues, lit-up at festivals), photo reviews drive conversion meaningfully more than text reviews.

### Maybe / situational

**Matrixify** ($20/month)
Bulk import/export between Shopify and Excel/CSV. Useful if you want to keep operating out of a spreadsheet during the transition (see Excel section below). If you're going all-in on Shopify, you don't need this.

**Stocky** (free with Shopify POS, $89/month standalone)
Inventory forecasting and purchase order management. Worth it once you're managing multiple SKUs across multiple sales channels. Skip at launch.

**Postscript** ($25/month) or **Attentive** (custom pricing)
SMS marketing. Higher engagement rates than email, but feels invasive if done wrong. Skip until you have enough volume to justify the platform cost.

### Skip these

Don't install: any "boost sales with a wheel of fortune pop-up" app, any "show fake recent purchases" app, any app that adds urgency timers ("Only 3 left! Hurry!"). They cheapen the brand. The Kiwipop voice is sensual and confident — not a spam-store.

---

## Mapping the landing page to Shopify

The current `index.html` is one long scrolling page with four floors. Shopify's architecture is product/collection/cart/checkout. Here's how the existing design translates.

### Homepage (Shopify "Online Store" homepage)

Direct lift from F1 (rooftop) of the current page:
- Hero with 3D candy + headline + CTAs
- Experience timeline (the four moments)
- Flavors section (with Kiwipop as "Add to cart" and others as "Notify me")
- Specs strip

Plus a few additions that didn't exist on the demo:
- A **featured collection** section showing Kiwipop variants visually
- A **reviews** strip pulling from Judge.me
- A **press / as seen in** strip once you have any (early Instagram comments don't count, but they could be repurposed as the "comment band" we built — that section translates beautifully)

### Product detail page (the Kiwipop product)

This is the conversion-critical page. Built from F2 (main floor) content of the demo:
- Product photography gallery
- Variant picker (the four flavor orbs — keep the visual treatment)
- Price + quantity + Add to cart
- "What it's like" timeline (collapsed/scrollable)
- "Six things, doing real work" — the ingredient cards
- "It's a real lollipop" — the how-it's-made section
- Reviews
- FAQ (build this from real customer questions as they come in)

The three billboard panels (cyber-anime, ukiyo-e wave, neon machinery) work great here as a visual break between sections.

### About / Story page

Direct lift from B1 (basement):
- Founder story
- Comment pull-quote band
- Contact list

### Events / Find Us page

Direct lift from B2 (underground):
- Terminal block opener
- Events grid
- Find-us city list
- Social cards
- Newsletter signup

### Cart drawer / Checkout

Use Shopify's defaults but theme them to match. The cart drawer slides in from the right; style it as a glass panel with the brand colors. Checkout pages have less customization available on Basic Shopify (full checkout customization is locked behind Shopify Plus) — accept this and focus your design effort elsewhere.

### What does NOT translate cleanly

- **The four-floor descent narrative** as a single scrolling experience is partially lost when content gets split across multiple pages. The trade-off is that e-commerce architecture requires this — Google can't index "the basement" if it's a div on the homepage; it needs to be a real URL like `kiwipop.co/about`.
- **The elevator floor indicator** doesn't make sense across multi-page navigation. Replace it with conventional nav.
- **The Three.js 3D candy** can survive on the homepage but is heavy on mobile. Consider a static image fallback on mobile or a video loop alternative.

---

## Inventory and the Excel question

The earlier conversation flagged "embed the excel sheet" as a feature. Here's how to think about that with Shopify in the picture.

**Short version: Shopify becomes your inventory source of truth, and the Excel sheet either gets retired or becomes a side reference for things Shopify doesn't track.**

### What Shopify handles natively

- Stock count per variant per location
- Auto-decrement on every sale
- Low-stock alerts via email
- Bulk inventory updates via CSV
- Multi-location inventory if you start fulfilling from multiple warehouses

You don't need to embed anything for these. Shopify's admin dashboard *is* the inventory view, and it's better than a spreadsheet.

### When the Excel sheet is still useful

- **Cost of goods sold tracking** — Shopify tracks revenue, not COGS. If your spreadsheet has per-unit costs, ingredient costs, or supplier pricing, keep it.
- **Production planning** — when you're hand-making batches, the spreadsheet is probably tracking "how many pops did I make this week, from which lot of isomalt." Shopify can't help with that.
- **Festival inventory allocation** — "I have 3,000 pops; allocate 800 to Beyond Wonderland, 1,200 to Coachella, keep 1,000 for online." This kind of pre-allocation logic lives better in a spreadsheet than in Shopify.

### How to integrate

Three options, in order of complexity:

1. **No integration** (recommended). Shopify is the source of truth for sellable inventory. Your spreadsheet is a separate operations document for production and finance. They don't talk to each other; you manually reconcile when you do a production batch (add stock to Shopify when you finish making pops). This is the right answer until you're doing meaningful volume.
2. **Manual export/import via Matrixify**. Once a week or once a month, export Shopify inventory to CSV, reconcile against your spreadsheet, import any adjustments back. Matrixify makes this a few clicks.
3. **Live sync via Google Sheets** (using a tool like Coupler.io or Zapier). Real-time bidirectional sync. Overkill at launch, useful at scale.

### Embedding a spreadsheet inside Shopify admin

Technically possible (you can put an iframe in a custom admin page or use a page template that embeds a published Google Sheet) but **don't bother**. If a team member needs to see the spreadsheet, they open the spreadsheet. Embedding it inside Shopify adds complexity without benefit.

---

## What Shopify gives you that we no longer need to design

Earlier in this project, we discussed building a custom admin dashboard with screens for orders, inventory, embedded spreadsheets, and settings. **Shopify makes all of that unnecessary.** The Shopify admin already includes:

- **Order management** — list view with filters, search, status, fulfillment, payment, refunds, partial refunds, notes, customer messages
- **Customer management** — full customer database, order history per customer, segments, tags, lifetime value
- **Inventory tracking** — per-variant per-location, with audit log
- **Analytics** — revenue, orders, conversion rate, top products, geographic sales breakdown, traffic sources
- **Discounts** — automatic discounts, discount codes, BOGO, free shipping thresholds
- **Reports** — sales over time, by channel, by product, by traffic source
- **Staff accounts** — multiple users with permission levels

You don't need to design or build any of this. Shopify gives it to you. You just need to *use* it. The only customization worth doing is putting your logo and colors on the admin login screen (a Shopify Plus feature, so skip until later).

---

## Launch checklist

Work through this in order. Some items are sequential (you can't test checkout before payments are connected); some can happen in parallel.

### Pre-launch (do these first)

- [ ] Buy domain (`kiwipop.co` or chosen variant)
- [ ] Sign up for Shopify Basic plan, start free trial
- [ ] Set up business entity (LLC), get EIN, open business bank account if not already done
- [ ] Set up Shopify Payments (requires the bank account)
- [ ] Decide theme path (A/B/C) and start that work
- [ ] Get real product photography done (8–12 photos: hero shot, lifestyle, packaging, lollipop close-up, glitter shot, all four flavor variants)

### Setup phase

- [ ] Configure all products and variants per checklist above
- [ ] Configure shipping zones and rates
- [ ] Configure taxes for your home state
- [ ] Customize order confirmation email
- [ ] Set up Klaviyo, build welcome flow + abandoned cart flow
- [ ] Install Judge.me, configure review request emails
- [ ] Connect domain
- [ ] Set up Google Workspace email forwarding
- [ ] Add legal pages: Privacy Policy, Terms of Service, Shipping Policy, Refund Policy. Shopify generates templates; replace generic language with brand voice.

### Pre-launch testing

- [ ] Run test orders end-to-end (Shopify has a test gateway). Test: domestic US, with discount code, with shipping calc. Make sure receipt emails fire correctly.
- [ ] Test on mobile (most traffic will be mobile). Pay attention to load time on the 3D candy hero specifically — if it slows mobile down, fall back to image.
- [ ] Test checkout with a real card (refund yourself afterward).
- [ ] QA all product copy for typos.
- [ ] Set up basic Google Analytics 4 + Meta Pixel for ad attribution later.

### Launch

- [ ] Disable password protection on the storefront.
- [ ] Send launch email to whatever list exists (founder's contacts, friends and family, anyone who said "let me know when it launches").
- [ ] Post on Instagram, TikTok, Discord with the launch announcement.
- [ ] Submit to Shopify's "new store" indexing.
- [ ] Watch the analytics dashboard like a hawk for 48 hours. First-day issues are usually around shipping rates being wrong, payments failing, or mobile rendering breaking.

### Post-launch (week 1–4)

- [ ] Reply to every order with a personal note for the first 50 customers. Builds word-of-mouth.
- [ ] Capture feedback obsessively. What confused people? What did they ask about? Most of this becomes FAQ content.
- [ ] Set up the first email campaign in Klaviyo (a "thanks for being early" email to first customers).
- [ ] Start collecting reviews via Judge.me's automated request flow.
- [ ] Begin photographing customers using the product (with permission) for social proof.

---

## Rough cost estimate

What this is going to cost, roughly, over the first year:

| Item | Setup cost (one-time) | Monthly |
|------|----------------------|---------|
| Shopify Basic plan | $0 | $39 |
| Domain (`.co`) | $25 | — |
| Theme — Path A (custom) | $5,000–$15,000 | — |
| Theme — Path B (premium + customization) | $1,200–$3,400 | — |
| Theme — Path C (Dawn + DIY) | $0 | — |
| Product photography | $1,500–$5,000 | — |
| Klaviyo (free tier to start) | $0 | $0 → $45 once you have >250 contacts |
| Judge.me | $0 | $0–$15 |
| Recharge subscriptions | $0 | $99 (skip until needed) |
| Google Workspace | $0 | $6 per email |
| Apps & misc | — | $30–$100 |
| Payment processing | — | 2.9% + 30¢ per transaction |

**Realistic year-one cost: $3,000–$20,000** depending on theme path, plus revenue-dependent payment fees. The biggest variable is whether you go custom theme (Path A) or pre-made (Path B). Path C is essentially free but limits the brand.

---

## What I'd do if I were you

1. **Pick Path B (premium theme + customization).** It's the right balance of cost, speed, and brand fidelity for a launch. You can graduate to Path A later when you have revenue.
2. **Buy `kiwipop.co` today.** Domains get squatted; lock yours in. $25 is nothing.
3. **Start the Shopify free trial today** so you can poke at the admin while you're working on theme decisions.
4. **Get product photography scheduled** — this is the long-pole item. Find a photographer who shoots food/CPG, brief them with the existing landing page as visual reference, schedule for 2–3 weeks out. Don't launch with placeholder images.
5. **Hold off on Recharge subscriptions** until you've validated regular reorder behavior. Add it in month 2 or 3 if customers are clearly reordering.
6. **Treat the existing landing page as your North Star spec.** Every Shopify decision should answer: "does this match or extend what we built, or does it dilute it?" When in doubt, protect the brand.

---

## What this spec does not cover

For completeness, things that are out of scope here but you'll need to figure out separately:

- **Manufacturing / production scale-up.** When you outgrow your kitchen, you'll need a co-packer. That's a separate operational track.
- **Wholesale and retail distribution.** Whole Foods, Sprouts, Erewhon, festival vendor relationships — these are direct sales conversations, not Shopify configuration.
- **Paid acquisition strategy.** Meta ads, TikTok ads, influencer marketing — these are post-launch revenue work, not setup.
- **Legal and regulatory.** FDA labeling requirements for functional ingredients, supplement facts vs. nutrition facts panels, kava-specific disclosures (some states regulate kava-containing products differently). Worth a one-hour consult with a food/CPG lawyer before launch.
- **Insurance.** Product liability insurance is non-optional for consumables. Get a quote from someone like Hiscox or Next Insurance.

These are all things you'll address in parallel with the Shopify launch but they aren't part of the storefront build itself.
