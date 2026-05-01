// Round a number to one decimal place, returning a Number (not a string).
// Used everywhere we display gram-based macros (12.3g, 8.7g) — protein,
// carbs, fat, fiber, body weight, dumbbell weights.
export function roundTenths(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

// Whole-number rounding with NaN/null safety. Sometimes called as just
// `Math.round` but the safer wrapper handles bad inputs.
export function roundInt(n) {
  return Math.round(Number(n) || 0);
}

// Compact volume / large-number formatter. 1234 → "1,234"; 12500 → "12.5k".
// Used on session cards, top-set rollups, anywhere a 4–6 digit number
// would feel cluttered.
export function compactNumber(n) {
  const v = Number(n) || 0;
  if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 1000) return v.toLocaleString();
  return String(Math.round(v));
}

// "1h 12m" / "45m" / "<1m" given start + end ISO strings.
export function formatDurationISO(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const mins = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
