# kiwi-pop

> *refreshing club lolli.*
> *a little secret in your mouth.*

This repo holds the **kiwi pop** webapp — storefront, admin cockpit, financial model, and inventory in one place — plus the brand reference materials, landing-page demo, and strategy docs that came before it.

---

## What kiwi pop is

A functional lollipop. Low-sugar hard candy (isomalt + xylitol base, **<1g of sugar per pop**), edible mica glitter swirled through the middle, and a real functional payload — theobromine, instant kava, ginseng, magnesium glycinate, taurine, B12, electrolytes, kiwi powder, spirulina. **~35 cal per pop (~9g net digestible carbs).** Sweetened with monk fruit extract and xylitol.

Positioned for the rave / festival / party scene as a "candy that does something" — built to occupy a structural gap in the functional-confectionery market currently dominated by calm, pastel, wellness-coded brands.

---

## What this repo is

**One webapp with two faces:**

1. **The public storefront** (`/`) — drop pages, flavor pages, the experience timeline, founder story, festival events, checkout. The thing customers see.
2. **The admin cockpit** (`/admin`) — orders, inventory (finished pops + raw ingredients), financial model, customer list, drop scheduling, recipes. The thing only Tennyson sees.

Same codebase. Same database. Different routes, different auth.

Plus a `/docs/` folder with the brand strategy work, voice guide, reference research, and the original landing-page demo (`landing-demo/index.html`) the live site is built out from.

### Why one app, not Shopify + spreadsheets + tools

Most brands stitch together Shopify + a separate spreadsheet for finances + a separate inventory tool + a separate email tool. Four logins, four invoices, four sources of truth that drift apart.

Kiwi pop ships small batches as drops. Inventory, orders, and the financial model need to live in the same place because:

- A drop sells out → inventory updates → next drop's break-even shifts → the financial model needs to reflect that today, not next month
- A customer's order data *is* the customer list — same row
- The "what flavors should we drop next" decision is upstream of the storefront and downstream of the financial model — both live in this app

One app means one source of truth.

---

## What's in this folder

```
kiwi-pop/
├── frontend/                    # the website (storefront + admin UI)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── storefront/      # public — what customers see
│   │   │   │   ├── Home.jsx               (the four-floor descent)
│   │   │   │   ├── DropPage.jsx
│   │   │   │   ├── FlavorPage.jsx
│   │   │   │   ├── Cart.jsx
│   │   │   │   └── Checkout.jsx
│   │   │   └── admin/           # private — only Tennyson logs in here
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Orders.jsx
│   │   │       ├── Inventory.jsx
│   │   │       ├── Drops.jsx
│   │   │       ├── Customers.jsx
│   │   │       ├── Financials.jsx
│   │   │       └── Recipes.jsx
│   │   ├── components/          # reusable building blocks
│   │   ├── styles/              # design tokens, the four-floor palette
│   │   └── lib/                 # API client, auth helpers, three.js scene
│   └── public/                  # logo, fonts, mascot art, reference images
│
├── backend/                     # the brain
│   ├── app/
│   │   ├── routes/              # API endpoints
│   │   │   ├── storefront.py    # public endpoints (catalog, checkout)
│   │   │   ├── admin.py         # admin-only endpoints
│   │   │   └── webhooks.py      # Stripe webhooks, etc.
│   │   ├── models/              # database tables defined as Python classes
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── inventory.py
│   │   │   ├── customer.py
│   │   │   ├── drop.py
│   │   │   ├── recipe.py
│   │   │   └── financial.py
│   │   ├── services/            # business logic (margin calc, drop scheduling)
│   │   └── core/                # config, database connection, auth
│   ├── alembic/                 # database migration history
│   └── tests/
│
├── docs/                        # all the markdown reference files
│   ├── kiwi_pop_research.md             # competitive landscape + 3-direction exploration
│   ├── rave_candy_brand_references.md   # 5-brand deep dive on chosen direction
│   ├── shopify_launch_spec.md           # the alternative path, kept for reference
│   ├── kiwi-pop-branding-and-web-design.md   # earlier Atomic Neon brand doc
│   └── voice_guide.md                   # see "Brand voice" section below
│
├── landing-demo/                # the original four-floor static landing page
│   ├── index.html
│   └── images/
│       ├── ref_candy_font.png
│       ├── ref_cyber_anime.png
│       ├── ref_ukiyo_wave.png
│       └── ref_neon_machinery.png
│
├── CLAUDE.md                    # instructions for Claude Code on this project
├── README.md                    # you are here
└── .env.example                 # template for secrets (never commit real .env)
```

To view the original landing-page demo: open `landing-demo/index.html` in any modern browser. No build step, no server. The live storefront is being rebuilt from this demo into the React app under `/frontend`.

---

## How to read this package

If you're picking this up cold, read in this order:

1. **`docs/kiwi_pop_research.md`** — competitive landscape, the breakout-brand playbook (Liquid Death etc.), and the three creative directions explored. Two (Trash Wellness, Sweet Riot) were rejected. We went with **Rave Candy**.
2. **`docs/rave_candy_brand_references.md`** — five reference brands sharing DNA with the chosen direction (Cyberdog, GHOST Energy, RYSE Fuel, Liquid Death, Happy Pop) with specific tactics to steal from each. Most actionable single takeaway: GHOST's festival-collab strategy.
3. **`landing-demo/index.html`** — the original landing page that embodies all the strategy in code. Open it and scroll all the way down to feel the four-floor descent.
4. **`docs/shopify_launch_spec.md`** — the alternative path: a Shopify-based launch. Kept for reference. We chose to build custom instead — see "Why one app, not Shopify" above.
5. **The setup instructions further down this file** — when you're ready to actually run the webapp.

---

## The product

Kiwi pop is a **<1g of sugar, vegan, functional lollipop** at ~35 calories per pop. Built from:

- **Isomalt + xylitol base** — the low-sugar hard-candy carrier (sugar alcohols, ~50% absorbed → ~9g net digestible carbs per pop)
- **Monk fruit extract** — the sweetener finish, no insulin spike
- **Edible mica glitter** swirled through the center — the shimmer
- **Kiwi powder** (1g) + a touch of coconut oil for body
- **Functional payload:** theobromine (175mg), instant kava (0.75g), ginseng (150mg), magnesium glycinate (300mg), taurine (250mg), B12 methylcobalamin (1mg), electrolyte blend (250mg), spirulina (125mg), citric acid (200mg)

The functional payload is the thing the category doesn't have. Wellness candy is calm and beige. Energy candy is loud and chemical. Kiwi pop is a small private pleasure with real ingredients doing real things — kava-relaxed, theobromine-lifted, hydrated, glittery.

---

## The landing page (the four floors)

The original demo (`landing-demo/index.html`) is structured as a **vertical descent** from a clean rooftop bar at the top to a cyberpunk afterhours basement at the bottom. Each "floor" has its own content type and its own progressively more chaotic visual treatment:

| Floor | Tag | Content | Visual energy |
|-------|-----|---------|---------------|
| **F1** | Rooftop | Hero, experience timeline, four flavors (Kiwipop live + 3 coming soon), product specs | Clean cyber-pop. Electric blue dominant. Liquid glass at its most composed. |
| **F2** | Main floor | The six functional ingredients, how it's made, three billboard art panels | Saturation up. Magenta pushes in. Glass cards have stronger chromatic edges. |
| **B1** | Basement | Founder story, contact info, brand culture, customer comment pull-quotes | Magenta-hot dominant. Pink scanlines. h2 headlines glitch on hover. |
| **B2** | Underground | Terminal block, festival events, retail locator, social handles, "back to dawn" CTA | Full afterhours. Near-black background, terminal green, double scanlines, glitch-shifted floor number, VT323 monospace font. |

A fixed elevator on the right side of the screen tracks which floor you're on as you scroll, and clicking buttons jumps you between them. The whole structure migrates to the React frontend as one route (`Home.jsx`) with the four floors as section components.

### The lollipop in the hero

Built with Three.js. A translucent aqua sphere with proper physically-based material (clearcoat, transmission, refraction). Rim-lit by a neon blue point light, a cyan point light, and a magenta fill. Inside the sphere, four colored ribbon tubes (blue, magenta, cyan, white) orbit on independent helical paths, plus 80 floating glitter particles drifting in sine/cosine motion.

Auto-rotates by default. **Click and drag to spin it manually** — the page switches into manual control mode on first interaction.

### The liquid glass effect

Every glass surface uses three layered techniques to approximate Apple's liquid glass:

1. **`backdrop-filter: blur(20px) saturate(1.4)`** — frosted base that picks up color from whatever's behind it (saturation boost makes it pick up brand color rather than looking gray).
2. **Inner highlight gradient** — 135° linear gradient from translucent white to nothing creates the specular catch you get on real glass when light hits an edge.
3. **RGB-split shadow on deeper floors** — a 1px magenta shadow on one side and 1px cyan on the other mimics chromatic aberration around the glass edges. Effect intensifies as you descend through the floors.

This is the strongest CSS-only liquid glass possible. To match Apple 1:1 you'd need WebGL shaders. There's an SVG displacement filter at the top of the demo file (`#liquid-glass`) ready to apply to specific elements if you want true content-warping refraction on a hero element later.

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

Floor 3 (basement) features real-style comment pull-quotes. The featured one is **"kava in a lollipop. GENIUS."** — a position statement someone wrote for free in the comments. Replace these with real attributed comments as they come in.

The international demand callout on Floor 4 references actual interest from Austria, Australia, and the UK. Update with real specifics as they firm up.

---

## The webapp (build plan)

### Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend framework | **React + Vite** | Fast dev, huge ecosystem, easy for AI tools and contractors |
| Styling | **Tailwind CSS** | Fast to write the four-floor design language without fighting CSS files |
| 3D candy | **Three.js** | Already proven in the landing demo |
| Backend framework | **Python + FastAPI** | Same stack as Tennyson's other projects (Geck Inspect, Utah Forage Map) — one mental model |
| Database | **PostgreSQL** | Free on Railway, handles everything kiwi pop will ever need |
| ORM | **SQLAlchemy + Alembic** | Standard Python pattern for managing the database |
| Auth | **Auth0** | Same auth Tennyson already runs elsewhere; admin gate is one config flag |
| Payments | **Stripe** | Industry standard, low fees, great API |
| Email | **Resend** or **Postmark** | Drop announcements, order confirmations, the list |
| Frontend hosting | **Vercel** | Free tier, deploys on every git push |
| Backend + DB hosting | **Railway** | $5/mo, runs the API and Postgres in one place |
| AI dev assistant | **Claude Code** | The build partner — see `CLAUDE.md` |

Total monthly cost while small: **$0–$25/month.**

### Features

**Storefront (public):**
- The four-floor home page (rooftop → main → basement → underground)
- Flavor pages — one per flavor, each in its own color story
- Drop archive — past drops, sold-out badges
- Cart & Stripe checkout — guest checkout supported
- Account area — order history, saved addresses, "you're on the list" status
- Email list capture — drop alerts
- Three.js 3D candy hero, liquid glass system, glitch transitions

**Admin cockpit (private):**
- Dashboard — today's orders, current inventory, this drop's burn rate, cash position
- Orders — every order, status, fulfillment, refunds
- Inventory — finished pops *and* raw ingredients (isomalt, xylitol, monk fruit extract, coconut oil, kiwi powder, theobromine, instant kava, ginseng, magnesium glycinate, taurine, B12 methylcobalamin, electrolyte blend, spirulina, citric acid, mica, wrappers, sticks)
- Drops — schedule a drop, set quantity caps, set go-live date, write copy, set color story
- Customers — full list with order count, lifetime value, last order date
- Financials — live P&L, cost-per-pop, margin per flavor, break-even quantities, runway
- Recipes — formulation per flavor, what each ingredient costs, where it's sourced (the spreadsheet, but as a database table the financial model reads from)

**The connections that matter:**
- A drop sells → inventory drops in real time
- Inventory hits threshold → storefront flips to "sold out" automatically
- Recipe ingredient cost changes in admin → financial model recalculates margin → if margin drops below threshold, dashboard flags it

### Setup (when you're ready to start coding)

You won't do this alone — Claude Code will walk you through each step. The rough order:

```bash
# 1. Clone the repo
git clone https://github.com/<your-handle>/kiwi-pop.git
cd kiwi-pop

# 2. Frontend setup
cd frontend
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # storefront at http://localhost:5173

# 3. Backend setup (in a second terminal)
cd backend
python -m venv .venv
source .venv/bin/activate       # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then fill in the values
alembic upgrade head            # creates the database tables
uvicorn app.main:app --reload   # API at http://localhost:8000
```

Each command is explained in `docs/setup.md` — every flag, every file, every thing-you-just-typed.

### Environment variables

API keys and database passwords don't go in the code (anyone with repo access would see them). They go in a `.env` file that stays on your machine and on the hosting platform.

`.env.example` lists every variable. Fill in your own values in a real `.env`. **Never commit `.env`.**

```bash
# Database
DATABASE_URL=postgresql://...

# Auth0
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Email
RESEND_API_KEY=...

# Admin gate — only this email gets admin access
ADMIN_EMAIL=tennysontaggart@gmail.com
```

### Deploying

- **Frontend → Vercel.** Push to `main`, auto-deploys to the live domain.
- **Backend + database → Railway.** One project, two services (API + Postgres). Deploys on push.
- **Custom domain** managed in Vercel. SSL automatic.

First deployment is the only fiddly one. After that, every change is live within ~90 seconds of pushing to GitHub.

---

## What's still placeholder

The landing demo's code structure is production-quality but several content fields are placeholders. Search the file for `[placeholder` (literal text marker) to find them all. The big ones:

- **Founder story paragraph** on B1. Currently a generic "started in a kitchen" narrative.
- **Contact emails** (hello@kiwipop.co, wholesale@kiwipop.co, etc.) — invented but plausible.
- **Festival event dates and statuses** on B2. Currently aspirational ("in negotiation", "tba").
- **Retailer city list** ("[retailer placeholder]" entries) on B2.
- **Social handles** (@kiwipop on IG/TikTok/Discord/Newsletter) on B2.
- **Studio location** on the contact list ("[city, state]").

Replace these strings with real content as it firms up. The design holds.

---

## Roadmap

### Phase 1 — Storefront MVP (weeks 1–3)
- Migrate the four-floor demo into the React frontend
- Single drop page (one flavor: kiwipop)
- Stripe checkout end to end
- Email signup
- Admin: orders list, manual inventory adjustment

### Phase 2 — Admin cockpit (weeks 4–6)
- Full inventory (finished + raw)
- Recipes table with cost-per-pop calculation
- Financial dashboard (P&L, margin per flavor, break-even)
- Drop scheduler

### Phase 3 — Full brand (weeks 7–10)
- All four flavors live, each with its own color story (RYSE Fuel-style flavor worlds)
- Real product photography of the actual lollipop, not just the Three.js render
- Drop archive
- Festival collab calendar (one limited drop tied to one major festival per year — GHOST playbook)

### Phase 4 — Once shipping is real
- Subscriptions (every drop, auto-shipped)
- Wholesale portal (festivals, clubs, bodegas)
- Loyalty / referral system

**The trap to avoid:** spending Phase 1 polishing the design system before a single pop ships. Phase 1 ends when **a stranger can buy a real lollipop on the site and you can fulfill it.** Everything else is downstream.

---

## What I'd do next, in priority order

1. **Replace the placeholders** with real founder story, real emails, real social handles, real retail cities. Without those, the basement and underground floors feel hollow.
2. **Lock in the four flavor identities.** Three flavors are still "coming soon." Each wants its own color story, its own functional pairing, and its own personality — modeled on how RYSE Fuel treats each flavor as a distinct visual world.
3. **Plan the festival collab calendar.** GHOST playbook (covered in `docs/rave_candy_brand_references.md`): one limited-edition flavor drop tied to one major festival per year, with custom packaging that becomes a collectible. The events section on B2 is the structural hook.
4. **Get real product photography** of the actual lollipop. The Three.js 3D candy is great as a brand element, but a product page eventually needs real photos of the packaging and the candy itself.
5. **Start the webapp build.** The landing demo proves the design works. The next step is rebuilding it inside `/frontend` connected to a real backend so the storefront and admin cockpit can come online together.

---

## Working with Claude Code

1. Open this repo in Claude Code (terminal or VS Code extension)
2. It reads `CLAUDE.md` automatically — that file tells it the conventions, the design language, and the priority order
3. Describe what you want in plain English ("add a flavor page for the second flavor"), Claude Code makes the changes, you review, you commit, you push, Vercel deploys

`CLAUDE.md` is the single most important file in this repo for keeping work consistent. Don't let it drift.

---

## Technical notes for whoever picks this up

### The landing demo (`landing-demo/index.html`)

- Single self-contained HTML file. No build, no framework.
- Three.js loads from cdnjs, fonts from Google Fonts CDN.
- Reference images load from `landing-demo/images/`.
- The 3D scene is GPU-accelerated and should hit 60fps on modern laptops/phones. On older devices, the ribbon-tube count and particle count are the first things to dial down (in the JavaScript at the bottom of the file).
- All major sections (`#floor-1` through `#floor-4`) are self-contained and can be reordered or removed without breaking each other.
- Mobile layout is in media queries at the bottom of the `<style>` block. Floor indicator hides below 900px.
- Accessibility: heading hierarchy is correct (one h1, h2s for major sections, h3s for subsections), all images have alt text. The Three.js canvas has no fallback content currently — if accessibility is a priority, add a static product image as a `<noscript>` or `<canvas>` fallback child.

### The webapp (`/frontend` and `/backend`)

- Frontend and backend in the same repo (a "monorepo") so changes that touch both — like adding a new field to inventory and showing it in the admin UI — happen in one commit.
- The frontend's design system inherits the CSS variables from the demo. To retune the palette, change them in one place.
- Backend follows the same FastAPI + SQLAlchemy + Alembic pattern as Tennyson's other projects. RLS-style authorization on admin routes — only the ADMIN_EMAIL identity passes the gate.
- Stripe webhooks are the source of truth for order status. Never trust frontend-reported payment state.

---

## License

Private. © Kiwi Pop / Tennyson Taggart, 2026.
Do not redistribute the brand, copy, or product story without permission.

---

*refreshing club lolli.*
*we're launching soooon.*
