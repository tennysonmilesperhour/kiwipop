/**
 * Helpers for the raffle entry system. The primary path writes rows to
 * `raffle_entries`, but until migration 010 is applied the API falls back
 * to writing into `email_signups` with the payload encoded into `source`.
 * This module owns the encode/decode contract so every reader stays in
 * sync with the writer.
 */

export const RAFFLE_SOURCE_PREFIX = 'raffle:v1:';

export interface RaffleFallbackPayload {
  slug: string;
  name: string;
  phone?: string;
  social_handle?: string;
  origin: string;
}

const isBrowser = typeof window !== 'undefined';

const toBase64 = (s: string): string =>
  isBrowser ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64');

const fromBase64 = (s: string): string =>
  isBrowser ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, 'base64').toString('utf8');

export function encodeRaffleSource(payload: RaffleFallbackPayload): string {
  const json = JSON.stringify({
    slug: payload.slug,
    name: payload.name,
    phone: payload.phone ?? null,
    social_handle: payload.social_handle ?? null,
    origin: payload.origin,
  });
  return `${RAFFLE_SOURCE_PREFIX}${toBase64(json)}`;
}

export function decodeRaffleSource(source: string | null | undefined): RaffleFallbackPayload | null {
  if (!source || !source.startsWith(RAFFLE_SOURCE_PREFIX)) return null;
  try {
    const body = source.slice(RAFFLE_SOURCE_PREFIX.length);
    const parsed = JSON.parse(fromBase64(body));
    if (typeof parsed?.slug !== 'string' || typeof parsed?.name !== 'string') {
      return null;
    }
    return {
      slug: parsed.slug,
      name: parsed.name,
      phone: parsed.phone ?? undefined,
      social_handle: parsed.social_handle ?? undefined,
      origin: parsed.origin ?? 'landing',
    };
  } catch {
    return null;
  }
}
