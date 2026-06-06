/**
 * Pride rainbow toggle.
 *
 * The rainbow takeover (see the `.kp-pride` block in app/kp-landing.css) is
 * kept on year-round by request. Flip `PRIDE_MODE` to `false` to turn it off,
 * or set it to `isPrideMonth()` to gate it back to June only.
 */
export const PRIDE_MODE = true;

/** True during June (month is 0-indexed, so June === 5). */
export function isPrideMonth(now: Date = new Date()): boolean {
  return now.getMonth() === 5;
}
