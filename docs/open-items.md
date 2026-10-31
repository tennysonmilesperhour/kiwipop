# Kiwi Pop: open items

Everything still unresolved across the revenue, sourcing, production, and commission
plans, with a recommendation on each. Ordered by what it's worth against what it costs
to do.

**Last updated 2026-10-31** (first written 2026-07-26). Companion to
`revenue-plan-2026.md`, `ingredient-sourcing.md`, `production-staffing-plan.md`,
`sales-commission-plan.md`, and `abandoned-checkout-email.md`.

How to read the status column: **Done** means the code or data change is on `main` and
in production. **Built, OFF** means the code is live but switched off until you decide.
**Open (owner)** means only you can close it (a purchase, a quote, a decision, a
filing); git history can't tell whether it happened, so these stay open until you say
otherwise.

---

## Switches waiting on you

Nothing below is turned on. Each one is a single step. Links and exact values first.

| # | Switch | Where | What to set | Why it waits |
|---|---|---|---|---|
| A | **Email sending at all** | Vercel → project `kiwipop` → Settings → Environment Variables | `RESEND_API_KEY` = key from <https://resend.com/api-keys> (Production), then redeploy | **Not set.** Every email the site has tried to send (33 welcome and drip emails) failed with "RESEND_API_KEY not set". Order confirmations and sale alerts also need it. Then verify the domain: `EMAIL_DELIVERABILITY.md`. |
| B | **Cron secret** | same screen | `CRON_SECRET` = any long random string (`openssl rand -hex 32`), then redeploy | Not set. The daily job now calls Stripe and can send customer email, so in production it refuses to run without the secret. Vercel sends it automatically once set. |
| C | **Postal address for marketing email** | same screen | `MAIL_POSTAL_ADDRESS` = the business mailing address on one line, e.g. `kiwi pop, PO Box 123, Salt Lake City, UT 84101` | Required by CAN-SPAM in every commercial email. The checkout recovery email refuses to send without it. Your real address; nobody else can fill it in. |
| D | **Checkout recovery email** (§6.18) | Supabase SQL editor: <https://supabase.com/dashboard/project/yibliuftqrnfguctrqca/sql/new> | `update app_settings set abandoned_checkout_emails_enabled = true where id = 1;` | Outward-facing. Approve the copy in `abandoned-checkout-email.md` first. Needs A, B, C. |
| E | **Wholesale referral codes** (§6.19) | same SQL editor | `update app_settings set wholesale_referral_codes_enabled = true where id = 1;` | Outward-facing. See §6.19 for what changes when it's on. Needs A for the codes email. |
| F | **Stripe webhook** (optional) | Stripe → Developers → Webhooks → Add endpoint `https://www.kiwipop.fun/api/webhooks/stripe`, events `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`; copy the signing secret to Vercel as `STRIPE_WEBHOOK_SECRET`, redeploy | `STRIPE_WEBHOOK_SECRET` is not set, so the webhook rejects every event today. Reconcile (admin financials page and the daily cron) covers paid and expired checkouts, so this is a speed-up, not a fix. |

To turn D or E off again, run the same line with `false`.

---

## The scoreboard

The plan said December's salary pool sits at **~$6,560 against an $8,000 target, a
$1,440 gap**, and that everything in §1 adds up to **~$3,200/month**. Those figures
are unchanged because none of §1 has been recorded as done.

Where the store actually is (production data, 31 Oct):

- **Storefront:** 68 paid orders (61 completed, 7 shipped) and 83 checkouts that
  expired unpaid. **The last order of any kind was 18 Aug.** Preorder-only mode has
  been on since 22 Aug.
- **Wholesale:** 1 approved account, 1 rejected. 0 discount codes issued (the approved
  account was approved in May, before the codes feature existed).
- **Email list:** 74 addresses, 51 opted in to marketing.

---

## 1. Money on the table: do these first

| # | Item | Worth/month | Effort | Status | Recommendation |
|---|---|---|---|---|---|
| 1 | **Tier-3 materials**: isomalt rung 3, magnesium 25 kg, lemon powder 25 kg | **~$1,790** | 3 purchase orders | Open (owner) | Single biggest lever in the whole plan and it closes the December gap on its own. Do §4 first. |
| 2 | **Throughput equipment**: more 50-cavity moulds, 2nd induction burner, heat sealer | **~$865** | ~$1,200 once | Open (owner) | Before the first hire. Pays back in ~6 weeks. |
| 3 | **Luster dust 1 kg case** | **~$250** | One email to Bakell | Open (owner) | Currently 5¢/pop against a $1.00/g placeholder. A 1 kg tier should land near $0.37/g, about **1.9¢/pop.** |
| 4 | **Labels on a 1,000+ roll** | **~$195** | One order | Open (owner) | 3.9¢ → ~1.5¢. You're buying 200-packs. |
| 5 | **Foil: stop buying the 6-colour pack** | **~$105 to $200** | Change what you order | Open (owner) | See §2. |

**If you pull items 1 and 2 only, December clears $8,000.**

---

## 2. Foil: you are throwing away a third of every pack

Status: **Open (owner).**

The 600-piece pack is six colours at 100 each; you use four. **400 usable wrappers per
pack**, so the real cost is pack ÷ 400, not ÷ 600. The two dead colours add **50% to
every wrapper you actually use.** At ~$15.99/pack that's **4.0¢/pop**, as big as the
label sticker.

Three fixes, best last:

1. **Four single-colour packs** instead of one six-colour: waste to zero, ~2.7¢/pop.
2. **A bulk single-colour count** (1,000-sheet packs run ~$0.015 to $0.020/sheet):
   ~1.5 to 2.0¢.
3. **One foil colour for all four flavours**, with the label carrying flavour identity
   (it already does). Unlocks #2 at full scale: **4.0¢ → ~1.5¢, ~$200/month.**

**Recommendation: #3.** If you want to keep colour-coding, take #1. It's free and
immediate. Either way, keep the two unused colours for event samples, seasonal runs and
display units.

---

## 3. Numbers the plan rests on that nobody has verified

Each one is load-bearing and still an estimate. Status for all: **Open (owner).**

| # | Number | Why it matters | How to close it |
|---|---|---|---|
| 6 | **Isomalt at $218.10 / 45 lb** | The whole `diy_tier2` → tier-3 path is built on it. Isomalt is 45% of the BOM. | Open the Bakers Authority page in a browser. Five minutes. |
| 7 | **Throughput at 75 pops/person-hour** | Sets the whole staffing plan. At 50, December needs 162 person-hours and 3 × 10 hrs/week doesn't cover it. | Measure it on the first three real sessions, then correct `THROUGHPUT_POPS_PER_LABOUR_HOUR` in `lib/production-cost.ts`. |
| 8 | **Foil pack at ~$15.99** | 4¢/pop rides on it. | Read your order confirmation. |
| 9 | **Ashwagandha 3.0¢, caramel 3.8¢, apple powder 2.7¢** | The only three ingredient estimates big enough to matter. | Check when you next reorder. |
| 10 | **Workers' comp class rate** | The 13% payroll burden assumption depends on it. | One insurance quote, needed before the first hire anyway. |

---

## 4. The ~35¢/pop gap

Status: **Open (owner).**

The complete BOM is **$0.53 to $0.57/pop**. `diy_tier2` says **$0.90**. ~33 to 42¢ is
still unexplained, and every margin in the admin inherits it. Candidates: yield loss
(15 to 25% scrap is normal, ~$0.10 of it), a buffer baked in when the tier was seeded,
or something else missing from the BOM.

**Recommendation: measure scrap on the first three sessions** (weigh isomalt in, count
sellable pops out), alongside throughput. Then correct `diy_tier2` or find what's
missing. **Do this before the tier-3 purchase orders.**

---

## 5. Compliance

Nothing here makes money. All of it can stop you selling.

| # | Item | Status | Recommendation |
|---|---|---|---|
| 11 | **FDA food facility registration** | Open (owner) | A nootropic-positioned confection sold wholesale across state lines is not cottage-food territory. |
| 12 | **Supplement Facts vs Nutrition Facts panel** | Open (owner) | Decide before label artwork; artwork has lead time. |
| 13 | **Xylitol-toxic-to-dogs warning on the physical label** | Open (owner) | It's in the ingredient panel on the site. It must make it onto the printed label. |
| 14 | **Product liability COI** | Open (owner) | Doors and the commissary will ask. ~$1,500 to $2,400/yr, already budgeted. |
| 15 | **Chilcuague COA** | Open (owner) | eBay listing, no COA, no lot traceability. Ask the seller first; if nothing, Sierra Gorda co-ops or a US botanical importer. |
| 16 | **W-2 setup**: EIN, Utah withholding + SUTA, workers' comp, payroll service, food handler permits | Open (owner) | All before the first shift. Misclassifying production staff as 1099 is the one item here that can genuinely hurt you. |
| 17 | **Lot coding from day one** | Open (owner) | If you ever have to recall, "which batch" is the only question that matters. |

Shipped on the site side since July (from git history): public copy softened to
remove health and driving claims (#188, #190);
tax-inclusive pricing with Stripe automatic tax and the Candy tax code (#186, #187);
security fixes to database functions and profile updates (#171, #196); dependency
patches (#194).

---

## 6. Revenue plumbing

| # | Item | Status | What's there now |
|---|---|---|---|
| 18 | **Checkout abandonment at 55%** (83 expired unpaid vs 68 paid) | **Built, OFF** (recording on, email off) | Every storefront checkout that expires unpaid is now recorded in `abandoned_checkouts` (from the Stripe webhook and from reconcile). One recovery email per cart, with unsubscribe, no discount, never after a purchase, at most one per address per 30 days, nothing older than 72 hours. **Copy and turn-on steps: `abandoned-checkout-email.md`. Switches A to D above.** |
| 19 | **Wholesale referral codes** | **Built, OFF** | See below. |
| 20 | **`rep_id` on `wholesale_accounts`** | **Done** | New `sales_reps` table plus `wholesale_accounts.rep_id` and `rep_assigned_at` (the start of the 12-month ownership clock). Blank = house account. Pick the rep in Admin → Wholesale → account details. To add a rep before they start, use the Supabase table editor on `sales_reps` (name, email, `started_on`). |
| 21 | **`app_settings.target_monthly_volume`** | **Done** | It now follows the plan month (`lib/plan.ts`: 4,710 Oct, 6,480 Nov, 8,120 Dec). It was set to 10,000 by hand, which made overhead per pop look about half of what the plan implies. The admin reads the plan figure live and the daily cron writes it back. Typing a number into Admin → Wholesale → "Assumed monthly volume" overrides it; the "Follow the plan" link next to it switches back. |
| 22 | **Email list at 74 (51 opted in)** | Open (owner) | Needs ~1,000 by December for the Q4 DTC push. Every event, door and order should feed it. Nothing reaches the list until switch A is set. The drip emails also still need an unsubscribe link (`EMAIL_DELIVERABILITY.md`, last section); the recovery email has one. |

### 19. Wholesale referral codes: what the switch does

With the switch **off** (now): an approved account gets one 25%-off code for its own
first order. Referral codes are not minted, and any that exist are refused at checkout.

With the switch **on**: approving an account mints its first-order code plus **3
referral codes** to hand to other shops, emails them all, and shows them on the
account's wholesale page. For accounts approved earlier, open the account in Admin →
Wholesale and press **Issue & email codes**; it tops the account up to 3 referral codes
without touching codes it already has. Each code is single-use and recorded against
the order that used it, so `wholesale_discount_codes.redeemed_order_id` shows which
door a referral came from.

To turn it on: switch E above (and A, or nobody receives the codes). Per
`sales-commission-plan.md`, these codes are the only discount a rep can offer, so
switch them on when the first rep starts or when you sign the first six doors,
whichever comes first.

---

## 7. Decisions still open

| # | Question | Status | Recommendation |
|---|---|---|---|
| 23 | **Spilanthes grade**: Barlowe's 10:1 (switched to), NaturMed CO2, or Mountain Rose dried herb? | Open (owner) | Start with Barlowe's; get a NaturMed CO2 quote in parallel. **Bench-test before changing grade.** 0.005 g is right for a 10:1 extract and badly wrong for dried herb. |
| 24 | **Isomalt 15 g → 12 g per pop** | Open (owner) | ~3¢/pop and 17% less shipping weight. A taste decision, not a finance one. |
| 25 | **Salesperson: fourth person, or one of the three?** | Open (owner) | Decide before writing the offer. Attribution (`rep_id`) is ready either way. |
| 26 | **Co-packer for 2027** | Open (owner) | Get three real quotes. The $0.75/pop figure has never been tested. |
| 27 | **International shipping** (`codex/international-shipping` branch) | Open (owner) | Not merged. Your call whether it ships. |
| 28 | **Brand sheet blanks** (`/brand`: MOQ, case pack, wholesale price, SRP, margin, lead time, certifications, wholesale contact emails) | Open (owner) | These are still `TODO` on the page. They need your real numbers; nobody should guess them. |

---

## If you only do five things in November

1. **Set switch A (Resend key)**. Without it no customer gets any email, including
   order confirmations, and none of the list-building work counts.
2. **Approve the recovery email copy and flip switches B, C, D.** It's the
   highest-return engineering item and it's now one SQL line away.
3. **Place the tier-3 material orders** (§1.1) after the scrap measurement (§4).
4. **Buy the throughput equipment** (§1.2). ~$1,200, pays back in six weeks.
5. **Start or finish the regulatory work** (§5.11 to §5.14). It gates wholesale doors.
