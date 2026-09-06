# Email deliverability — verifying kiwipop.fun in Resend

All outbound mail (welcome drip, order confirmations, review requests,
wholesale approvals, sale alerts) goes through Resend via `lib/email.ts`.

Until `kiwipop.fun` is verified, Resend sends from its shared sandbox address
`onboarding@resend.dev`. That address works with zero setup, but the sending
domain isn't ours and can't be DKIM-signed for us — so mail gets spam-foldered
regularly. Verifying the domain is what fixes it.

## 1. Add the domain in Resend

<https://resend.com/domains> → **Add Domain** → `kiwipop.fun`, region
**us-east-1** (closest to the US customer base).

Verify the **root domain**, not a `send.` subdomain. A subdomain isolates
sending reputation, which matters at scale, but it forces a
`hello@send.kiwipop.fun` from-address that reads as spammy to humans. At this
volume the root domain is the better trade.

## 2. Add the DNS records

The domain's DNS is wherever `kiwipop.fun`'s nameservers point (the domain is
attached to the Vercel project `kiwipop`; if it's on Vercel nameservers the
records go in Vercel → Domains → `kiwipop.fun` → DNS, otherwise at the
registrar).

Resend shows three records after step 1. **Copy the values from that screen** —
the DKIM key is unique to the domain and the MX host varies by region. They
look like this:

| Type | Name | Value | Notes |
|------|------|-------|-------|
| `MX` | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority `10`) | Bounce/complaint feedback |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | SPF |
| `TXT` | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQ…` | DKIM — unique, copy exactly |

Two things that bite here:

- **Don't paste the full hostname into the Name field.** Most DNS UIs append
  the domain automatically, so it's `send`, not `send.kiwipop.fun` — otherwise
  the record lands on `send.kiwipop.fun.kiwipop.fun`.
- **If an SPF record already exists on the root domain, merge it**, don't add a
  second one. A domain with two SPF TXT records fails SPF outright. The `send`
  subdomain record above is separate and safe either way.

Then hit **Verify** in Resend. Propagation is usually a few minutes.

## 3. Add DMARC

Resend does not create this one, and Gmail and Yahoo require it of bulk
senders. Add it manually:

| Type | Name | Value |
|------|------|-------|
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:thekiwipop@gmail.com; pct=100` |

`p=none` is monitor-only: it reports failures without affecting delivery. Run
it that way for a couple of weeks, confirm the reports look clean, then tighten
to `p=quarantine`. Skipping straight to `p=quarantine` or `p=reject` before the
reports are clean will silently drop real mail.

## 4. Point the app at the verified domain

Set these in Vercel → Project `kiwipop` → Settings → Environment Variables
(Production **and** Preview), then redeploy:

```
RESEND_FROM_EMAIL=kiwi pop <hello@kiwipop.fun>
RESEND_REPLY_TO=thekiwipop@gmail.com
```

`RESEND_FROM_EMAIL` only has to be on a verified domain — there's no mailbox
behind `hello@kiwipop.fun`, and it doesn't need one. Resend is send-only, so
`RESEND_REPLY_TO` is what makes replies reachable; it defaults to
`thekiwipop@gmail.com` in code if unset. This matters because the review
request email says "just reply to this email" in so many words.

Order matters: set `RESEND_FROM_EMAIL` only **after** Resend reports the domain
verified. Sending from an unverified domain is rejected outright, whereas the
sandbox fallback keeps working in the meantime.

## 5. Confirm it worked

Place a $1 test order (or re-run any wholesale approval) and check the received
message in Gmail → ⋮ → **Show original**. All three should read `PASS`:

```
SPF:   PASS   with domain kiwipop.fun
DKIM:  PASS   with domain kiwipop.fun
DMARC: PASS
```

If DKIM passes but SPF fails, the `send` TXT record is usually the culprit —
check it didn't get double-suffixed.

## Still outstanding: unsubscribe headers

The marketing drip (`welcome`, `ingredient_deep_dive`, `first_purchase_push`,
`review_request`) has no unsubscribe link and sends no `List-Unsubscribe`
header. Gmail's bulk sender rules expect one-click unsubscribe, and its absence
pushes mail toward spam independently of domain auth. Transactional mail (order
confirmations, sale alerts) is exempt.

Closing that gap needs an unsubscribe token + endpoint and a footer link, so
it's a separate change from domain verification.
