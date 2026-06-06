/**
 * Pride month gating.
 *
 * The June rainbow takeover (see the `.kp-pride` block in app/kp-landing.css)
 * is switched on automatically for the whole month of June and switches itself
 * back off on July 1 — no manual revert needed. `getMonth()` is 0-indexed, so
 * June === 5.
 */
export function isPrideMonth(now: Date = new Date()): boolean {
  return now.getMonth() === 5;
}
