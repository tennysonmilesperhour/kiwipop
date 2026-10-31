export const TRANSACTIONAL_EMAIL_TYPES: readonly string[];
export const MARKETING_EMAIL_TYPES: readonly string[];
export function isMarketingEmailType(emailType: string): boolean;
export function shouldSuppressEmail(
  emailType: string,
  signup: { unsubscribed_at?: string | null } | null | undefined
): boolean;

export function suppressionDecision(
  emailType: string,
  lookup:
    | { error: true }
    | { error?: false; signup: { unsubscribed_at?: string | null } | null }
): 'send' | 'suppress' | 'defer';
