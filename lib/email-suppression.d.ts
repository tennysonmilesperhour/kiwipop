export const TRANSACTIONAL_EMAIL_TYPES: readonly string[];
export const MARKETING_EMAIL_TYPES: readonly string[];
export function isMarketingEmailType(emailType: string): boolean;
export function shouldSuppressEmail(
  emailType: string,
  signup: { unsubscribed_at?: string | null } | null | undefined
): boolean;
