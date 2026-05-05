import { NextResponse, type NextRequest } from 'next/server';
import { processEmailQueue } from '@/lib/email-queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
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

    console.log('[cron/process-emails]', result);

    return NextResponse.json({
      ok: true,
      ...result,
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
