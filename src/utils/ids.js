/**
 * Generate a short, time-ordered, collision-resistant id of the form
 * `${prefix}_${epochMs}_${random}`. Random suffix is base-36 so it stays
 * URL/storage-key safe.
 *
 * Prefixes used in the app:
 *   • `s`  — workout session
 *   • `f`  — food entry
 *   • `bw` — body-weight entry
 *
 * @param {string} prefix - Short type tag, e.g. 's', 'f', 'bw'.
 * @returns {string}
 */
export function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
