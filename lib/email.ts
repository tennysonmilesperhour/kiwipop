import 'server-only';

import { Resend } from 'resend';

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

/**
 * Resend's shared sandbox sender. It works with no DNS setup at all, but it
 * can't be DKIM-signed for kiwipop.fun and the domain isn't ours, so mail
 * sent from it routinely lands in spam. Verify kiwipop.fun in Resend and set
 * RESEND_FROM_EMAIL — see docs/EMAIL_DELIVERABILITY.md.
 */
const SANDBOX_FROM = 'onboarding@resend.dev';

/**
 * Where customer replies land. Resend only sends — nothing receives mail at
 * kiwipop.fun — so replies have to point at a real inbox. The review-request
 * email tells people "just reply to this email", so this needs to work.
 */
const DEFAULT_REPLY_TO = 'thekiwipop@gmail.com';

let warnedAboutSandbox = false;

function getFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;

  if (!warnedAboutSandbox) {
    warnedAboutSandbox = true;
    console.warn(
      '[email] RESEND_FROM_EMAIL is unset — sending from the Resend sandbox ' +
        'address. Expect spam-foldering until kiwipop.fun is verified in ' +
        'Resend. See docs/EMAIL_DELIVERABILITY.md.'
    );
  }
  return SANDBOX_FROM;
}

function getReplyTo(explicit?: string): string {
  return explicit ?? process.env.RESEND_REPLY_TO?.trim() ?? DEFAULT_REPLY_TO;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  /** Optional HTML body. When provided, Resend sends a multipart email. */
  html?: string;
  /** Overrides the default reply-to inbox. */
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

  try {
    const { error } = await client.emails.send({
      from: getFromAddress(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
      replyTo: getReplyTo(params.replyTo),
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
