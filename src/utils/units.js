// Single source of truth for unit-system conversions and display.
//
// **Storage rule (do not break):** every weight on disk is stored in
// pounds (`weight: <lb>, unit: 'lb'`). The user's preferred unit only
// affects DISPLAY and INPUT. This way the math (sessionVolume, PR
// detection, e1RM) doesn't need to know about the user's preference,
// and switching from imperial → metric is a free render-time flip with
// zero data migration.
//
// To go the other direction at INPUT (e.g. ScrollPicker shows kg → user
// picks 80 kg → we save 176.4 lb), call `toLb(value, system)` before
// passing to the store. To go the other direction at DISPLAY, use
// `formatWeight(lbValue, system, opts)`.

export const UnitSystem = Object.freeze({
  IMPERIAL: 'imperial',
  METRIC: 'metric',
});

const LB_PER_KG = 2.2046226218;

export function lbToKg(lb) {
  return lb / LB_PER_KG;
}
export function kgToLb(kg) {
  return kg * LB_PER_KG;
}

/**
 * Convert a stored-pounds value into the user's preferred unit.
 * @param {number} lb
 * @param {'imperial'|'metric'} system
 * @returns {number}
 */
export function fromLb(lb, system) {
  return system === UnitSystem.METRIC ? lbToKg(lb) : lb;
}

/**
 * Convert a user-input value (in their preferred unit) back to pounds
 * for storage.
 * @param {number} value
 * @param {'imperial'|'metric'} system
 * @returns {number}
 */
export function toLb(value, system) {
  return system === UnitSystem.METRIC ? kgToLb(value) : value;
}

/**
 * Returns the unit suffix string for the given system. Lowercase by
 * default — pass `{ uppercase: true }` for label use.
 */
export function unitLabel(system, { uppercase = false } = {}) {
  const base = system === UnitSystem.METRIC ? 'kg' : 'lb';
  return uppercase ? base.toUpperCase() : base;
}

/**
 * Format a stored-pounds value for display in the user's preferred unit.
 *
 * @param {number} lb - Value in pounds (storage unit).
 * @param {'imperial'|'metric'} system - Display unit.
 * @param {object} [opts]
 * @param {boolean} [opts.withUnit=true] - Append " lb" / " kg".
 * @param {0|1} [opts.decimals] - Override decimal places. Defaults: 0 for imperial, 1 for metric.
 * @returns {string}
 */
export function formatWeight(lb, system, opts = {}) {
  const { withUnit = true, decimals } = opts;
  const value = fromLb(lb, system);
  const places = decimals != null ? decimals : (system === UnitSystem.METRIC ? 1 : 0);
  const rounded = places === 0 ? Math.round(value) : Math.round(value * 10 ** places) / 10 ** places;
  const text = places === 0 ? String(rounded) : rounded.toFixed(places);
  return withUnit ? `${text} ${unitLabel(system)}` : text;
}

// ─── Picker bounds ──────────────────────────────────────────────────────────
// Bounds are unit-native — the picker shows kg values when metric, lb when
// imperial. `step` matches what the user expects in the gym (2.5 lb plates,
// 1 kg plates). Body-weight uses finer steps to match consumer scales.

export const WEIGHT_PICKER = {
  imperial: { min: 0, max: 600, step: 2.5 },
  metric:   { min: 0, max: 300, step: 1 },
};

export const BODY_WEIGHT_PICKER = {
  imperial: { min: 60, max: 400, step: 0.5 },
  metric:   { min: 27, max: 180, step: 0.2 },
};
