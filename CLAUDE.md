# Kiwi Pop — Claude Code workflow notes

## PR workflow

- **Default: merge every PR you open straight to `main`** (squash merge) unless the user explicitly says otherwise when the PR is created. No need to ask before merging your own work — assume it's authorized.
- Treat user feedback during a session as a TODO list — open one PR per logical chunk, push fixes onto the same branch when they're related, and merge when the user gives the nod (or proactively, if scope is small and obvious).
- When merging, also clean up any other open PRs the user mentions ("close out the rest"). Surface conflicts/migration collisions before mass-merging.

## Database / Stripe

- Supabase project: `yibliuftqrnfguctrqca` (kiwipop). Use the Supabase MCP (`mcp__76777...`) for reads/writes; data fixes don't need a deploy.
- Stripe is the source of truth for paid revenue, not `orders.status`. The admin financials/dashboard auto-reconciles via `/api/admin/financials/summary` on every visit.
- Stripe MCP is registered in `~/.claude.json` — reload Claude Code if you need live Stripe queries (then `stripe_*` tools become available).

## Admin theme

- Cyber-dark, Bricolage Grotesque, brand-neon accents (lime/cyan/magenta/ultraviolet/sodium). Scoped under `.admin-layout` — never touch the storefront from inside admin styles.
- Inline color refs inside admin should use `var(--c-lime)` / `var(--c-cyan)` / `var(--c-magenta)` (or the `-text` aliases, which currently point to the same neons since contrast is fine on the dark surfaces).

## Vercel

- Hobby plan: cron schedule cap = once per day. `vercel.json` cron is `0 9 * * *`. Don't push sub-daily schedules — they'll break every preview deploy.
