/**
 * Generate a short, time-ordered, collision-resistant id of the form
 * `${prefix}_${epochMs}_${random}`.
 *
 * Prefixes used in the app:
 *   • `s`  — workout session
 *   • `f`  — food entry
 *   • `bw` — body-weight entry
 */
export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
