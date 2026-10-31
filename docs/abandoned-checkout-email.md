# Checkout recovery email (proposed, switched OFF)

More than half of storefront checkouts end with the Stripe session expiring
unpaid (83 cancelled with no payment vs 68 paid, all time). This is the one
email those customers would get. **Nothing is sent until Tennyson approves the
copy below and flips the switch.** Recording the abandoned carts is already on,
so the admin can see what was left behind while the email waits.

## What is built

- **Recording (on).** When a Stripe Checkout Session expires unpaid (Stripe's
  default is 24 hours after the customer opened it), the order is marked
  `cancelled` and a row lands in `abandoned_checkouts`: email, first name,
  what was in the cart, totals. This happens from the Stripe webhook
  (`checkout.session.expired`) and from the reconcile pass (the admin
  financials page and the daily cron), so it works even before the webhook is
  set up. Donations are never recorded.
- **Sending (off).** The daily cron (09:00 UTC, which is 3am in Salt Lake
  City) sends the recovery email only when
  `app_settings.abandoned_checkout_emails_enabled` is `true` **and** the
  `MAIL_POSTAL_ADDRESS` environment variable is set.
- **Restore link.** "back to my cart" opens `/checkout/recover?t=...`, which
  puts the same pops back in the cart at today's prices (retired products are
  dropped) and lands on `/cart`. The link carries a random token, never the
  email address.
- **Unsubscribe.** Every email has an unsubscribe link and the
  `List-Unsubscribe` / one-click headers Gmail and Apple Mail look for.
  Unsubscribing marks the address in `email_signups.unsubscribed_at` and
  cancels any welcome or drip emails already queued for it. The email queue
  also checks that column before every marketing send, so nothing queued
  earlier can slip through. Order receipts, wholesale approvals and the sale
  alert still go out (`lib/email-suppression.js` lists which types are
  which).
- **Real abandonment time.** `abandoned_at` is the Stripe session's own
  expiry time, so a session reconcile only notices days later still counts
  as old and is skipped by the 72-hour rule.
- **Recovered sales.** When the same email later pays, the abandoned row gets
  `recovered_order_id` and `recovered_at`. Recovered by the email means
  `recovery_sent_at` is before `recovered_at`.

## Consent rules the code enforces

These are in `lib/abandoned-checkout-rules.js` and covered by
`tests/abandoned-checkout.test.js`.

1. **Only the address the customer typed into our checkout form**, for a cart
   they built themselves. No bought or scraped lists, no addresses from
   anywhere else.
2. **One email per abandoned cart, never a series.** A failed send is not
   retried.
3. **At most one recovery email per address every 30 days**, however many
   carts they abandon. If someone tries checkout three times, only the newest
   cart counts.
4. **Never after they paid** (any paid order from that address since the cart
   was started), and **never after they unsubscribed**.
5. **Nothing older than 72 hours.** Carts that sat while the switch was off
   are skipped, so turning the switch on never emails a backlog.
6. **A physical postal address in every email** (US CAN-SPAM requires it on
   commercial email). The job refuses to send without `MAIL_POSTAL_ADDRESS`.
7. **No discount in the email.** Teaching people to abandon carts for a code
   costs margin on customers who would have bought anyway. If you want one,
   see "Optional: add a code" below.

A recovery email to someone who started a purchase is allowed under CAN-SPAM
without a prior marketing opt-in, as long as rules 6 and the unsubscribe link
are in place. It is still marketing email, which is why it honours the same
unsubscribe as the list.

## The proposed copy

Lowercase, same voice and dark layout as the other kiwi pop emails. `{first
name}` comes from the shipping form; if it is blank the greeting is just
"hey,".

**Subject:** `your cart is still here · kiwi pop`

**Body:**

> hey {first name},
>
> you started a checkout at kiwipop.fun but it timed out before payment went
> through, so **nothing was charged**.
>
> here's what was in your cart:
>
> - 2 × kiwi pop
> - 1 × molly matcha mint
>
> if you still want them, this link puts the same pops back in your cart:
>
> **[back to my cart →]**
>
> if something went wrong at checkout (a card that wouldn't go through, a
> shipping question, anything), just reply to this email. a real person reads
> every reply.

**Footer:**

> you're getting this one email because you started a checkout at kiwipop.fun
> with this address. we won't send another reminder about this cart.
> unsubscribe from kiwi pop marketing email (order receipts still come
> through).
> {MAIL_POSTAL_ADDRESS}

Replies go to the existing reply-to inbox (`thekiwipop@gmail.com` unless
`RESEND_REPLY_TO` is set).

The live wording is in `abandonedCheckoutEmail()` in `lib/email-templates.ts`.
If you change the words, change them in both places.

### Optional: add a code

If you decide a nudge is worth it, the cleanest version is a line under the
cart list such as "`WELCOME10` still works if this is your first order". That
reuses an existing code instead of inventing a new discount. Say the word and
it is a one-line change.

## How to turn it on

Do these in order. Steps 1 to 3 are also needed for every other email the site
sends, which is currently none: **`RESEND_API_KEY` is not set in Vercel**, and
all 33 emails the site has tried to send (welcome series, drips) failed with
"RESEND_API_KEY not set". Order confirmations and sale alerts are affected the
same way.

1. **Resend API key.** Vercel → project `kiwipop` → Settings → Environment
   Variables → add `RESEND_API_KEY` (Production) with the key from
   <https://resend.com/api-keys>. Verify the domain too:
   `docs/EMAIL_DELIVERABILITY.md`, then set `RESEND_FROM_EMAIL` to something
   like `kiwi pop <hello@kiwipop.fun>`.
2. **Postal address.** Same screen → add `MAIL_POSTAL_ADDRESS` (Production)
   with the business mailing address exactly as it should print, on one line,
   for example `kiwi pop, PO Box 123, Salt Lake City, UT 84101`. A PO box or
   registered mail drop is fine; it must be a real address that receives mail.
3. **Cron secret.** Same screen → add `CRON_SECRET` (Production) with any long
   random string (for example the output of `openssl rand -hex 32`). Vercel
   Cron sends it automatically. Without it the daily job now refuses to run
   in production, because it calls Stripe and can send customer email and
   should not be triggerable by anyone who finds the URL.
4. **Redeploy** (Vercel → Deployments → latest → Redeploy) so the new
   variables load.
5. **Approve the copy above**, or send edits.
6. **Flip the switch.** Supabase SQL editor
   (<https://supabase.com/dashboard/project/yibliuftqrnfguctrqca/sql/new>):

   ```sql
   update app_settings set abandoned_checkout_emails_enabled = true where id = 1;
   ```

   To turn it off again, run the same line with `false`.

Optional but recommended: **Stripe webhook.** `STRIPE_WEBHOOK_SECRET` is not
set in Vercel either, so the webhook at `/api/webhooks/stripe` currently
rejects every event and the site relies on reconcile to notice paid and
expired checkouts. In Stripe → Developers → Webhooks → Add endpoint:
`https://www.kiwipop.fun/api/webhooks/stripe`, events
`checkout.session.completed`, `checkout.session.expired`,
`payment_intent.payment_failed`, `charge.refunded`. Copy its signing secret
into Vercel as `STRIPE_WEBHOOK_SECRET` and redeploy.

## Timing

Stripe expires an unpaid session 24 hours after it was opened, and the cron
runs once a day (the Vercel Hobby limit). So the email lands roughly 24 to 48
hours after the customer left. Shortening that means either setting a shorter
`expires_at` on the Checkout Session (minimum 30 minutes, but a customer who
leaves the payment tab open longer would have to start again) or a paid
Vercel plan for a more frequent cron. Neither is needed to start.

## Checking it works

Supabase SQL editor:

```sql
-- what has been recorded and what happened to each
select recovery_status, recovery_skip_reason, count(*)
from abandoned_checkouts group by 1, 2 order by 3 desc;

-- carts that came back after the email
select count(*) from abandoned_checkouts
where recovery_sent_at is not null and recovered_at > recovery_sent_at;
```

The cron's JSON response (Vercel → Logs, path `/api/cron/process-emails`)
includes an `abandonedCheckout` block with `enabled`, `sent`, `skipped`,
`failed`, and a `blocked` reason if something is missing.
