/** Convert a parsed PATCH object into the exact fields sent to persistence. */
export function patchPayload(parsed: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined) continue;
    updates[key] = value === '' ? null : value;
  }
  return updates;
}
