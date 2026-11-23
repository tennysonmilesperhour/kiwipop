# kiwi-pop

> *refreshing club lolli.*
> *a little secret in your mouth.*

This repo holds the **kiwi pop** webapp — storefront, admin cockpit, financial model, and inventory in one place — plus the brand reference and the plans and runbooks behind it.

---

## What kiwi pop is

A functional lollipop. Low-sugar hard candy (isomalt + xylitol base, **<1g of sugar per pop**), edible mica glitter swirled through the middle, and a real functional payload. **Shared base in every flavor** — theobromine, magnesium glycinate, taurine, B12, electrolytes — **plus a per-flavor adaptogen** tuned to direction (ginseng + spirulina in Kiwi Pop, ashwagandha in Lemon Ginger, maca + cinnamon in Caramel Apple, L-theanine + chamomile in Mint). **~35 cal per pop (~9g net digestible carbs).** Sweetened with monk fruit extract and xylitol.

Positioned for the rave / festival / party scene as a "candy that does something" — built to occupy a structural gap in the functional-confectionery market currently dominated by calm, pastel, wellness-coded brands.

---

## What this repo is

**One webapp with two faces:**

1. **The public storefront** (`/`) — drop pages, flavor pages, the experience timeline, founder story, festival events, checkout. The thing customers see.
2. **The admin cockpit** (`/admin`) — orders, inventory (finished pops + raw ingredients), financial model, customer list, drop scheduling, recipes. The thing only Tennyson sees.

Same codebase. Same database. Different routes, different auth.

Plus a `docs/` folder with the revenue, sourcing, production and email plans, and the open items list.

### Why one app, not Shopify + spreadsheets + tools

Most brands stitch together Shopify + a separate spreadsheet for finances + a separate inventory tool + a separate email tool. Four logins, four invoices, four sources of truth that drift apart.

Kiwi pop ships small batches as drops. Inventory, orders, and the financial model need to live in the same place because:

- A drop sells out → inventory updates → next drop's break-even shifts → the financial model needs to reflect that today, not next month
- A customer's order data *is* the customer list — same row
- The "what flavors should we drop next" decision is upstream of the storefront and downstream of the financial model — both live in this app

One app means one source of truth.

---

## The code

A Next.js app on Vercel, backed by Supabase (Postgres and Auth), Stripe for payments, Resend for email and ShipStation for USPS labels.

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3 plus global CSS (`app/globals.css`, `app/kp-landing.css`, `app/campaign.css`) |
| Database and auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Payments | Stripe (Checkout, webhooks, reconciliation) |
| Email | Resend, queued in the database and sent by a daily cron |
| Shipping | ShipStation V1 API (USPS labels) |
| Analytics | PostHog, Vercel Analytics and Speed Insights |
| Hosting | Vercel (Hobby plan: crons run at most once a day) |

### Folder map

```
kiwipop/
├── app/
│   ├── (public)/          the storefront: home, products, variety, cart, checkout,
│   │                      order-confirmation, account, auth, about, faq, research,
│   │                      brand, wholesale, merch, campaign, donate, community,
│   │                      find-us, live, labels, legal
│   ├── (admin)/admin/     the cockpit: dashboard, orders, products, inventory,
│   │                      ingredients, manufacturing, financials, logistics, map,
│   │                      wholesale, list, reviews, sheets, team, pitch,
│   │                      campaign, cash-donations
│   ├── api/               route handlers: checkout, webhooks (Stripe), storefront,
│   │                      account, admin/*, cron/process-emails, wholesale, list,
│   │                      reviews, live, locations, order-map, version and more
│   ├── layout.tsx, providers.tsx, error.tsx, not-found.tsx, robots.ts, sitemap.ts
├── components/            shared UI: Navigation, Footer, ProductCard, CartItem,
│                          AdminLayout, plus admin/, campaign/, home/, landing/,
│                          labels/ and map/ groups
├── lib/                   server and shared logic: stripe.ts, stripe-reconcile.ts,
│                          order-paid.ts, commerce.ts, inventory.ts,
│                          production-cost.ts, shipstation.ts, email*.ts,
│                          abandoned-checkout.ts, discounts.ts, rewards.ts,
│                          supabase*.ts, admin-auth.ts, seo.ts and more
├── supabase/migrations/   every schema change, in order (apply through Supabase)
├── tests/                 node:test unit tests for pure lib modules
├── scripts/               one-off helpers (Stripe product feed upload)
├── docs/                  plans and runbooks (see below)
├── public/                images, fonts and static files
├── proxy.ts               request proxy that sends signed-out visitors on /admin to sign-in
└── vercel.json            the daily cron (/api/cron/process-emails at 09:00 UTC)
```

The admin cockpit is styled separately under `.admin-layout`; admin CSS never reaches the storefront.

### Run it locally

```bash
npx --yes npm@12.2.1 ci --ignore-scripts
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (`node --test tests/*.test.js`) |

CI (`.github/workflows/ci.yml`) runs install, lint, tests and the build on every pull request and push to `main`.

`.env.example` lists every variable. The groups are Supabase (URL, anon key, service role key), Stripe (publishable key, secret key, webhook secret), PostHog, the site URL, Resend (API key, from and reply-to addresses, notification emails) and ShipStation (API key and secret, carrier, service, package, ship-from address and parcel size). Without the ShipStation keys the buy-label endpoint returns a 503 and the rest of the site works. Never commit a real `.env`.

### Data and money

- **Stripe is the source of truth for paid revenue**, not `orders.status`. The admin financials page and the daily cron reconcile against Stripe.
- Schema changes go in `supabase/migrations/` and are applied to the Supabase project through Supabase.
- Shipping labels are bought through ShipStation and the label PDF is stored on the `shipments` row, because the V1 API cannot fetch it again later.

### Further reading

- `CLAUDE.md`: the working rules (PR flow, admin theme, Vercel cron limit, shipping)
- `QUICKSTART.md` and `docs/DEPLOY.md`: setup and deployment
- `SYSTEM_OVERVIEW.md`: how the pieces connect
- `docs/open-items.md`: what is unresolved, with the switches waiting on you
- `docs/revenue-plan-2026.md`, `docs/ingredient-sourcing.md`, `docs/production-staffing-plan.md`, `docs/sales-commission-plan.md`, `docs/EMAIL_DELIVERABILITY.md`, `docs/abandoned-checkout-email.md`

---

## The product

Kiwi pop is a **<1g of sugar, vegan, functional lollipop** at ~35 calories per pop. Built from:

- **Isomalt + xylitol base** — the low-sugar hard-candy carrier (sugar alcohols, ~50% absorbed → ~9g net digestible carbs per pop). Xylitol is the headline sweetener: tooth-friendly (cavity-causing bacteria can't metabolize it), low-glycemic, no insulin spike. **Toxic to dogs — keep away from pets.**
- **Monk fruit extract** — the high-intensity sweetener finish, rounds the xylitol
- **Edible mica glitter** swirled through the center — the shimmer
- **Kiwi powder** (1g) + a touch of coconut oil for body
- **Functional payload:** theobromine (175mg), ginseng (150mg), magnesium glycinate (300mg), taurine (250mg), B12 methylcobalamin (1mg), electrolyte blend (250mg), spirulina (125mg), citric acid (200mg)

The functional payload is the thing the category doesn't have. Wellness candy is calm and beige. Energy candy is loud and chemical. Kiwi pop is a small private pleasure with real ingredients doing real things — theobromine-lifted, ginseng-steady, hydrated, glittery.

---


## Design origins (the four floors)

The original landing-page demo, which came before this app and is no longer in the repo, was structured as a **vertical descent** from a clean rooftop bar at the top to a cyberpunk afterhours basement at the bottom. Each "floor" has its own content type and its own progressively more chaotic visual treatment:

| Floor | Tag | Content | Visual energy |
|-------|-----|---------|---------------|
| **F1** | Rooftop | Hero, experience timeline, four flavors (Kiwipop live + 3 coming soon), product specs | Clean cyber-pop. Electric blue dominant. Liquid glass at its most composed. |
| **F2** | Main floor | The six functional ingredients, how it's made, three billboard art panels | Saturation up. Magenta pushes in. Glass cards have stronger chromatic edges. |
| **B1** | Basement | Founder story, contact info, brand culture, customer comment pull-quotes | Magenta-hot dominant. Pink scanlines. h2 headlines glitch on hover. |
| **B2** | Underground | Terminal block, festival events, retail locator, social handles, "back to dawn" CTA | Full afterhours. Near-black background, terminal green, double scanlines, glitch-shifted floor number, VT323 monospace font. |

A fixed elevator on the right side of the screen tracks which floor you're on as you scroll, and clicking buttons jumps you between them.

### The lollipop in the hero

Built with Three.js. A translucent aqua sphere with proper physically-based material (clearcoat, transmission, refraction). Rim-lit by a neon blue point light, a cyan point light, and a magenta fill. Inside the sphere, four colored ribbon tubes (blue, magenta, cyan, white) orbit on independent helical paths, plus 80 floating glitter particles drifting in sine/cosine motion.

Auto-rotates by default. **Click and drag to spin it manually** — the page switches into manual control mode on first interaction.

### The liquid glass effect

Every glass surface uses three layered techniques to approximate Apple's liquid glass:

1. **`backdrop-filter: blur(20px) saturate(1.4)`** — frosted base that picks up color from whatever's behind it (saturation boost makes it pick up brand color rather than looking gray).
2. **Inner highlight gradient** — 135° linear gradient from translucent white to nothing creates the specular catch you get on real glass when light hits an edge.
3. **RGB-split shadow on deeper floors** — a 1px magenta shadow on one side and 1px cyan on the other mimics chromatic aberration around the glass edges. Effect intensifies as you descend through the floors.

This is the strongest CSS-only liquid glass possible. To match Apple 1:1 you'd need WebGL shaders.

### Color palette

```
--blue:        #00b8ff   (electric neon, primary accent, F1 dominant)
--blue-deep:   #0080d4   (the candy color)
--magenta:     #ff2bb8   (pink, secondary accent, F2-F3 dominant)
--magenta-hot: #ff0080   (hotter pink, F4 dominant)
--cyan:        #00f0ff   (highlights, accent text)
--aqua:        #3ad3ff   (the candy color again, lighter)
--violet:      #9d4dff   (subtle accent on B1)
--terminal:    #00ff88   (only on B2 — the cyberpunk floor)
--chrome:      #e8e9f0   (body text)
--dim:         #7a7c88   (muted text, captions)
--bg:          #04060c   (F1 base background)
--bg-soft:     #0a0d18   (F2)
--bg-deeper:   #08050f   (B1)
--bg-deepest:  #04020a   (B2)
```

All colors are CSS variables at the top of the `<style>` block / Tailwind config. Change them in one place to retune the palette.

### Typography

Two typefaces, both Google Fonts (no licensing issue):

- **Chakra Petch** — geometric, futuristic sans for headlines and most body. Mid-weight default, italic for accents. Cyberpunk-UI, not chunky display.
- **Geist Mono** — modern monospace for labels, captions, technical metadata.
- **VT323** — old terminal monospace, *only on Floor B2* for the cyberpunk afterhours feel.

---


## Brand voice

Built directly from the founder's own language. **Sensual, playful, unfussy.** Treats the lollipop as a small private pleasure rather than a feature-listed wellness product.

### What this voice sounds like

The phrases that carry the brand:

- *"Refreshing club lolli"* — the tagline. Used in the hero tag, ticker, and footer.
- *"A little secret in your mouth"* — the headline. The product description in nine words.
- *"Sweet, tart, clean"* — the three-word flavor descriptor. Rhythmic, repeatable.
- *"Gum and mints just don't hit the way they used to"* — the origin story compressed into one sentence. Used as the lede on Floor 2.
- *"Make it shimmer. Make it hydrating."* — instruction-mode copy. Used in the founder story.
- *"Too edible"* — the self-aware complaint that doubles as a brand chip.
- *"That was the birth of the Kiwi Pop."* — the moment in the founder's voice. Used as the climactic line in the basement story.
- *"We're launching soooon."* — kept the extra o's. That's the voice.

### What this voice avoids

- Manifesto-style declarations ("Low-sugar candy is for moms" / "Wellness doesn't have to be polite") — earlier drafts had these. Felt performed. Cut.
- Edgy provocation ("Lick fast, rave harder") — same problem. The brand is sensual, not aggressive.
- Wellness-speak ("clinically-backed nootropic blend", "synergistic adaptogens") — the brand sounds like a person, not a supplement label.
- Anything that strains for cool. The brand IS cool because it's specific and confident, not because it's trying.

### Where each kind of voice lives

- **Hero / headlines** — most distilled phrases. *"A little secret in your mouth."* Short and sensory.
- **Ledes** — first-person plural, conversational. Sets up the section like you're describing it to a friend.
- **Card descriptions** (timeline moments, ingredient cards) — specific, sensory, low jargon. Describe what happens in your mouth and what the ingredient does in plain language.
- **Floor 1 (rooftop)** — softer, sensual, inviting.
- **Floor 2 (main floor)** — practical and specific. Six ingredients, how it's made, billboards.
- **Floor 3 (basement)** — first-person founder voice. The most personal. Story lives here, not on the hero.
- **Floor 4 (underground)** — terse, technical, scene-coded. Terminal blocks, retailer lists, social handles. Less voice, more signal.

### Voice for social (NOT for the website)

Great in voice memos, belong on Instagram Stories and TikTok captions, not on the landing page:

- *"Thank you Kito for being born"*
- *"I have a lollipop!"*
- *"Something in my mouth that makes me feel sexy and confident"*

The direct sensual register works in casual social formats. On the website it gets quieter — sensuality is described through experience copy (the shimmer, the cleanness, the secret), not announced.

### Customer voices

Floor 3 (basement) features real-style comment pull-quotes. Replace these with real attributed comments as they come in.

The international demand callout on Floor 4 references actual interest from Austria, Australia, and the UK. Update with real specifics as they firm up.

---


## Working with Claude Code

1. Open this repo in Claude Code (terminal, desktop or web).
2. It reads `CLAUDE.md` automatically: the PR flow, the admin theme, the Vercel cron limit and the shipping setup.
3. Describe what you want in plain English. Claude Code makes the change, opens a pull request, and merges it to `main`; Vercel deploys.

`CLAUDE.md` is the single most important file for keeping work consistent. Don't let it drift.

---


## Baseline checklist

[ ] private repo + main protected + CI   [x] dependabot + lockfile
[ ] advisors clean (or exceptions noted)  [ ] backups/PITR confirmed
[x] PostHog + exceptions on               [ ] uptime incl. checkout URL
[x] privacy / terms / contact (+refund/shipping/disclaimers if selling)
[ ] support@ email works                  [ ] domain auto-renew on
[ ] revenue lands in business account     [ ] sales tax configured (physical goods)

## License

Private. © Kiwi Pop / Tennyson Taggart, 2026.
Do not redistribute the brand, copy, or product story without permission.

---

*refreshing club lolli.*
*we're launching soooon.*
