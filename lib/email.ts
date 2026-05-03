import 'server-only';

import { Resend } from 'resend';

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const client = getClient();
  if (!client) {
    return { ok: false, reason: 'RESEND_API_KEY not set' };
  }

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  try {
    const { error } = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      replyTo: params.replyTo,
    });
    if (error) {
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'unknown error',
    };
  }
}
