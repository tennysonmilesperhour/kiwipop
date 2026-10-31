import { NextResponse, type NextRequest } from 'next/server';
import { processEmailQueue } from '@/lib/email-queue';
import { processAbandonedCheckoutRecovery } from '@/lib/abandoned-checkout';
import { reconcilePendingOrdersWithStripe } from '@/lib/stripe-reconcile';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { planTargetVolumeFor } from '@/lib/plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Keep app_settings.target_monthly_volume on this month's plan figure while
 * target_volume_follows_plan is on. The admin API already reports the plan
 * figure live; this keeps the stored column honest for anything that reads
 * the table directly.
 */
async function syncTargetVolumeToPlan(): Promise<number | null> {
  const planned = planTargetVolumeFor(new Date());
  if (planned === null) return null;
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .update({ target_monthly_volume: planned, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .eq('target_volume_follows_plan', true)
    .neq('target_monthly_volume', planned)
    .select('target_monthly_volume');
  if (error) throw new Error(error.message);
  return data && data.length > 0 ? planned : null;
}

/**
 * Daily housekeeping (Hobby plan: one cron, once a day):
 *   1. send queued drip emails
 *   2. reconcile the last few days of Stripe checkouts, which also records
 *      abandoned carts when the expiry webhook is not subscribed
 *   3. send checkout recovery emails (only when that switch is on)
 *   4. move target_monthly_volume to this month's plan figure
 * Steps 2 to 4 are isolated: one failing does not stop the others.
 *
 * Original notes for step 1:
 * Cron endpoint to process queued drip emails.
 * Called by Vercel Cron once a day at 09:00 UTC (Hobby plan caps cron
 * frequency at one execution per day). Drip emails are scheduled by
 * date (day-2 / day-3 / day-4 of a series), so batching them once a
 * day still hits the right windows. Order confirmations bypass the
 * queue via sendEmailNow, so transactional latency is unaffected.
 *
 * Security: Vercel Cron sets the Authorization header with CRON_SECRET.
 * For manual testing, pass ?secret=<CRON_SECRET> as a query param.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  // Fail closed in production: this job calls Stripe and can send customer
  // email, so it must not be callable by anyone who knows the URL. Vercel
  // Cron sends the secret automatically once CRON_SECRET is set.
  if (!cronSecret && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 503 }
    );
  }
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const querySecret = request.nextUrl.searchParams.get('secret');
    const token = authHeader?.replace('Bearer ', '') ?? querySecret;

    if (token !== cronSecret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await processEmailQueue();

    const extras: Record<string, unknown> = {};
    try {
      const reconcile = await reconcilePendingOrdersWithStripe({
        lookbackDays: 4,
        maxPages: 5,
      });
      extras.reconcile = {
        marked_paid: reconcile.marked_paid,
        marked_cancelled: reconcile.marked_cancelled,
        errors: reconcile.errors,
      };
    } catch (err) {
      extras.reconcile = { error: err instanceof Error ? err.message : 'failed' };
    }
    try {
      extras.abandonedCheckout = await processAbandonedCheckoutRecovery();
    } catch (err) {
      extras.abandonedCheckout = {
        error: err instanceof Error ? err.message : 'failed',
      };
    }
    try {
      extras.targetVolumeSyncedTo = await syncTargetVolumeToPlan();
    } catch (err) {
      extras.targetVolumeSyncedTo = {
        error: err instanceof Error ? err.message : 'failed',
      };
    }

    console.log('[cron/process-emails]', result, extras);

    return NextResponse.json({
      ok: true,
      ...result,
      ...extras,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/process-emails] failed', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'unknown error',
      },
      { status: 500 }
    );
  }
}
