import 'server-only';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendNotificationEmail } from '@/lib/email';
import {
  welcomeEmail,
  ingredientDeepDiveEmail,
  firstPurchasePushEmail,
  orderConfirmationEmail,
  reviewRequestEmail,
  wholesaleApprovedEmail,
  adminSaleAlertEmail,
} from '@/lib/email-templates';
import type { AdminSaleAlertParams } from '@/lib/email-templates';

/* =========================================================
   EMAIL QUEUE — simple drip email system
   =========================================================
   Uses a `email_queue` table in Supabase to schedule and
   track drip emails. Immediate emails are sent directly;
   delayed emails are queued and processed by the cron.
   ========================================================= */

export type EmailType =
  | 'welcome'
  | 'ingredient_deep_dive'
  | 'first_purchase_push'
  | 'order_confirmation'
  | 'review_request'
  | 'wholesale_approved'
  | 'admin_sale_alert';

interface QueueEmailParams {
  to: string;
  emailType: EmailType;
  /** When to send. Omit or set to now for immediate. */
  sendAt?: Date;
  /** JSON metadata (e.g. orderId, items for order confirmation) */
  metadata?: Record<string, unknown>;
}

/**
 * Queue an email for sending. If `sendAt` is in the past or omitted,
 * the email will be picked up on the next cron run (within minutes).
 */
export async function queueEmail(params: QueueEmailParams): Promise<void> {
  const { error } = await supabaseAdmin.from('email_queue').insert({
    to_email: params.to,
    email_type: params.emailType,
    send_at: (params.sendAt ?? new Date()).toISOString(),
    metadata: params.metadata ?? {},
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[email-queue] failed to queue email', {
      to: params.to,
      type: params.emailType,
      error,
    });
  }
}

/**
 * Send an email immediately (bypasses the queue).
 * Used for time-sensitive transactional emails like order confirmations.
 */
export async function sendEmailNow(
  to: string,
  emailType: EmailType,
  metadata?: Record<string, unknown>
): Promise<{ ok: boolean; reason?: string }> {
  const template = buildTemplate(emailType, to, metadata);
  if (!template) {
    return { ok: false, reason: `Unknown email type: ${emailType}` };
  }

  const result = await sendNotificationEmail({
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });

  // Log the send
  await supabaseAdmin.from('email_queue').insert({
    to_email: to,
    email_type: emailType,
    send_at: new Date().toISOString(),
    metadata: metadata ?? {},
    status: result.ok ? 'sent' : 'failed',
    sent_at: result.ok ? new Date().toISOString() : null,
    error_message: result.reason ?? null,
    created_at: new Date().toISOString(),
  });

  return result;
}

/**
 * Process all pending emails that are due. Called by the cron endpoint.
 * Returns the number of emails processed.
 */
export async function processEmailQueue(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const now = new Date().toISOString();

  // Fetch pending emails that are due
  const { data: pendingEmails, error: fetchError } = await supabaseAdmin
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('send_at', now)
    .order('send_at', { ascending: true })
    .limit(50); // Process max 50 per run to stay within Vercel limits

  if (fetchError) {
    console.error('[email-queue] failed to fetch pending emails', fetchError);
    return { processed: 0, failed: 0, errors: [fetchError.message] };
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of pendingEmails) {
    const template = buildTemplate(
      row.email_type as EmailType,
      row.to_email,
      row.metadata as Record<string, unknown> | undefined
    );

    if (!template) {
      // Mark as failed
      await supabaseAdmin
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: `Unknown email type: ${row.email_type}`,
        })
        .eq('id', row.id);
      failed++;
      errors.push(`Unknown type ${row.email_type} for ${row.to_email}`);
      continue;
    }

    const result = await sendNotificationEmail({
      to: row.to_email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    if (result.ok) {
      await supabaseAdmin
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      processed++;
    } else {
      await supabaseAdmin
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: result.reason ?? 'Unknown error',
        })
        .eq('id', row.id);
      failed++;
      errors.push(`Failed to send ${row.email_type} to ${row.to_email}: ${result.reason}`);
    }
  }

  return { processed, failed, errors };
}

/**
 * Queue the full welcome drip series for a new subscriber.
 */
export async function queueWelcomeSeries(email: string): Promise<void> {
  const now = new Date();

  // Email 1: Welcome (immediate)
  await sendEmailNow(email, 'welcome');

  // Email 2: Ingredient deep dive (2 days later)
  const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  await queueEmail({
    to: email,
    emailType: 'ingredient_deep_dive',
    sendAt: day2,
  });

  // Email 3: First purchase push (4 days later)
  const day4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  await queueEmail({
    to: email,
    emailType: 'first_purchase_push',
    sendAt: day4,
  });
}

/**
 * Queue the post-purchase email series for a completed order.
 */
export async function queuePostPurchaseSeries(params: {
  email: string;
  orderId: string;
  totalCents: number;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
}): Promise<void> {
  const now = new Date();

  // Email 1: Order confirmation (immediate)
  await sendEmailNow(params.email, 'order_confirmation', {
    orderId: params.orderId,
    totalCents: params.totalCents,
    items: params.items,
  });

  // Email 2: Review request (~1 week after estimated arrival).
  // No estimated_arrival_at field exists yet; assume ~7 days door-to-door,
  // so 14 days from purchase ≈ 7 days post-arrival.
  const reviewSendAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  await queueEmail({
    to: params.email,
    emailType: 'review_request',
    sendAt: reviewSendAt,
    metadata: { orderId: params.orderId },
  });
}

/**
 * Default recipient for sale alerts. Overridable with SALE_NOTIFY_EMAIL
 * (comma-separated for more than one inbox).
 */
const DEFAULT_SALE_NOTIFY_EMAIL = 'tennysontaggart@gmail.com';

export function getSaleNotifyRecipients(): string[] {
  const raw = process.env.SALE_NOTIFY_EMAIL ?? DEFAULT_SALE_NOTIFY_EMAIL;
  return raw
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
}

/**
 * Email the shop owner as soon as an order is paid.
 *
 * Deduped per (recipient, order) against the email_queue log so Stripe
 * webhook retries — or a replayed event — don't fire a second alert for a
 * sale that was already announced. Never throws: a notification failure must
 * not take down the webhook, since Stripe would then retry the whole handler
 * and re-run the inventory/points side effects.
 */
export async function notifyAdminOfSale(
  params: AdminSaleAlertParams
): Promise<void> {
  const recipients = getSaleNotifyRecipients();
  if (recipients.length === 0) return;

  for (const to of recipients) {
    try {
      const { data: existing, error: dedupeError } = await supabaseAdmin
        .from('email_queue')
        .select('id')
        .eq('to_email', to)
        .eq('email_type', 'admin_sale_alert')
        .eq('status', 'sent')
        .eq('metadata->>orderId', params.orderId)
        .limit(1);

      if (dedupeError) {
        // Log and send anyway — a duplicate alert beats a missed sale.
        console.error('[email-queue] sale alert dedupe check failed', {
          orderId: params.orderId,
          dedupeError,
        });
      } else if (existing && existing.length > 0) {
        continue;
      }

      const result = await sendEmailNow(
        to,
        'admin_sale_alert',
        params as unknown as Record<string, unknown>
      );

      if (!result.ok) {
        console.error('[email-queue] failed to send sale alert', {
          orderId: params.orderId,
          to,
          reason: result.reason,
        });
      }
    } catch (err) {
      console.error('[email-queue] sale alert threw', {
        orderId: params.orderId,
        to,
        err,
      });
    }
  }
}

// ---- internal ----

function buildTemplate(
  emailType: EmailType,
  to: string,
  metadata?: Record<string, unknown>
): { subject: string; html: string; text: string } | null {
  switch (emailType) {
    case 'welcome':
      return welcomeEmail(to);
    case 'ingredient_deep_dive':
      return ingredientDeepDiveEmail();
    case 'first_purchase_push':
      return firstPurchasePushEmail();
    case 'order_confirmation':
      if (!metadata?.orderId) return null;
      return orderConfirmationEmail({
        orderId: metadata.orderId as string,
        email: to,
        totalCents: (metadata.totalCents as number) ?? 0,
        items: (metadata.items as Array<{ name: string; quantity: number; priceCents: number }>) ?? [],
      });
    case 'review_request':
      return reviewRequestEmail({
        orderId: (metadata?.orderId as string) ?? '',
      });
    case 'wholesale_approved':
      if (!metadata?.codes) return null;
      return wholesaleApprovedEmail({
        businessName: (metadata.businessName as string) ?? 'there',
        codes:
          (metadata.codes as Array<{
            code: string;
            kind: 'first_order' | 'referral';
          }>) ?? [],
        percentOff: (metadata.percentOff as number) ?? 25,
      });
    case 'admin_sale_alert':
      if (!metadata?.orderId) return null;
      return adminSaleAlertEmail(metadata as unknown as AdminSaleAlertParams);
    default:
      return null;
  }
}
