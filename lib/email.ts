import 'server-only';

/**
 * Lightweight transactional-email helper.
 *
 * Uses the Resend REST API directly (no SDK dependency). Configure with
 * env vars in Vercel:
 *
 *   RESEND_API_KEY        — your Resend API key (re_…)
 *   RESEND_FROM_EMAIL     — verified sender, e.g. "kiwi pop <hello@kiwipop.co>"
 *
 * If RESEND_API_KEY is unset (e.g. local dev without secrets), `sendEmail`
 * resolves with `{ ok: false, skipped: true }` so callers can fall back to
 * persisting the inquiry without crashing.
 */

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }

  const from =
    params.from ??
    process.env.RESEND_FROM_EMAIL ??
    'kiwi pop <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        text: params.text,
        reply_to: params.replyTo,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return {
        ok: false,
        error: `resend ${response.status}: ${detail.slice(0, 240)}`,
      };
    }

    const json = (await response.json()) as { id?: string };
    return { ok: true, id: json.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown email error',
    };
  }
}
