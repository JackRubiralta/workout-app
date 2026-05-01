// Round a number to one decimal place. Used for gram-based macros and
// dumbbell weights.
export function roundTenths(n: number | string | null | undefined): number {
  return Math.round((Number(n) || 0) * 10) / 10;
}

// Whole-number rounding with NaN/null safety.
export function roundInt(n: number | string | null | undefined): number {
  return Math.round(Number(n) || 0);
}

// Compact volume / large-number formatter. 1234 → "1,234"; 12500 → "12.5k".
export function compactNumber(n: number | string | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 1000) return v.toLocaleString();
  return String(Math.round(v));
}

// "1h 12m" / "45m" / "<1m" given start + end ISO strings.
export function formatDurationISO(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string | null {
  if (!startIso || !endIso) return null;
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// "1:30" — minute:seconds for set timers.
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return '–:–';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
