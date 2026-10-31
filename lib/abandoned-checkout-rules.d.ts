export const RECOVERY_MIN_AGE_HOURS: 1;
export const RECOVERY_MAX_AGE_HOURS: 72;
export const RECOVERY_COOLDOWN_DAYS: 30;

export type RecoveryDecision =
  | { action: 'send' }
  | { action: 'wait' }
  | { action: 'skip'; reason: string };

export function decideRecovery(
  row: { abandoned_at: string; email: string | null; items: unknown },
  ctx: {
    now: Date;
    hasPaidSince: boolean;
    unsubscribed: boolean;
    emailedRecently: boolean;
  }
): RecoveryDecision;

export function latestPerEmail<
  T extends { id: string; email: string; abandoned_at: string },
>(rows: ReadonlyArray<T>): { keep: T[]; duplicates: T[] };

export function abandonedAtFromSession(
  expiresAtSeconds: number | null | undefined,
  now: Date
): string;
