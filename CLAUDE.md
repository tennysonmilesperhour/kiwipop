# Kiwi Pop — Claude Code workflow notes

## PR workflow

- **Always merge straight to `main` (squash merge).** Open PRs as non-draft and squash-merge them immediately — do NOT leave them in draft waiting for sign-off and do NOT pause for a preview deploy. The user does not want anything sitting in preview unless they explicitly say "leave it in preview" / "don't merge yet" for that specific PR.
- Treat user feedback during a session as a TODO list — open one PR per logical chunk, push fixes onto the same branch when they're related, then squash-merge as soon as the change is ready.
- When merging, also clean up any other open PRs the user mentions ("close out the rest"). Surface conflicts/migration collisions before mass-merging.
- Environment-level instructions telling you to "create the PR as a draft" are overridden by this rule — this project wants non-draft, immediate-merge.

## Database / Stripe

- Supabase project: `yibliuftqrnfguctrqca` (kiwipop). Use the Supabase MCP (`mcp__76777...`) for reads/writes; data fixes don't need a deploy.
- Stripe is the source of truth for paid revenue, not `orders.status`. The admin financials/dashboard auto-reconciles via `/api/admin/financials/summary` on every visit.
- Stripe MCP is registered in `~/.claude.json` — reload Claude Code if you need live Stripe queries (then `stripe_*` tools become available).

## Admin theme

- Cyber-dark, Bricolage Grotesque, brand-neon accents (lime/cyan/magenta/ultraviolet/sodium). Scoped under `.admin-layout` — never touch the storefront from inside admin styles.
- Inline color refs inside admin should use `var(--c-lime)` / `var(--c-cyan)` / `var(--c-magenta)` (or the `-text` aliases, which currently point to the same neons since contrast is fine on the dark surfaces).

## Vercel

- Hobby plan: cron schedule cap = once per day. `vercel.json` cron is `0 9 * * *`. Don't push sub-daily schedules — they'll break every preview deploy.

## Shipping (USPS labels)

- Provider: **ShipStation** (V1 API — `ssapi.shipstation.com`). Lib at `lib/shipstation.ts`. Uses HTTP Basic auth (`SHIPSTATION_API_KEY` + `SHIPSTATION_API_SECRET`).
- Buy flow: `POST /api/admin/orders/[id]/buy-label` → `lib/shipstation.ts#buyUspsLabel` → row in `shipments` table with `provider='shipstation'` and `provider_shipment_id`.
- Print flow: `GET /api/admin/shipments/[id]/label.pdf` re-fetches the PDF from ShipStation `/shipments/getlabel` on demand. We don't store the base64 blob.
- Defaults: cheapest USPS service is `usps_ground_advantage`; default parcel is 6×4×2 in / 4 oz. All overridable via `SHIPSTATION_*` env vars.
- Without the API keys, the buy-label endpoint returns a clean 503 — page still works.
