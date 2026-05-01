// Single source of truth for unit-system conversions and display.
//
// Storage rule (do not break): every weight on disk is stored in pounds
// (`weight: <lb>, unit: 'lb'`). The user's preferred unit only affects
// DISPLAY and INPUT.

export const UnitSystem = {
  IMPERIAL: 'imperial',
  METRIC: 'metric',
} as const;

export type UnitSystemValue = (typeof UnitSystem)[keyof typeof UnitSystem];

const LB_PER_KG = 2.2046226218;

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function fromLb(lb: number, system: UnitSystemValue): number {
  return system === UnitSystem.METRIC ? lbToKg(lb) : lb;
}

export function toLb(value: number, system: UnitSystemValue): number {
  return system === UnitSystem.METRIC ? kgToLb(value) : value;
}

export function unitLabel(
  system: UnitSystemValue,
  { uppercase = false }: { uppercase?: boolean } = {},
): string {
  const base = system === UnitSystem.METRIC ? 'kg' : 'lb';
  return uppercase ? base.toUpperCase() : base;
}

export type FormatWeightOptions = {
  withUnit?: boolean;
  decimals?: 0 | 1;
};

export function formatWeight(
  lb: number,
  system: UnitSystemValue,
  opts: FormatWeightOptions = {},
): string {
  const { withUnit = true, decimals } = opts;
  const value = fromLb(lb, system);
  const places = decimals != null ? decimals : (system === UnitSystem.METRIC ? 1 : 0);
  const rounded =
    places === 0 ? Math.round(value) : Math.round(value * 10 ** places) / 10 ** places;
  const formatted = places === 0 ? String(rounded) : rounded.toFixed(places);
  return withUnit ? `${formatted} ${unitLabel(system)}` : formatted;
}

export type PickerBounds = { min: number; max: number; step: number };

export const WEIGHT_PICKER: Record<UnitSystemValue, PickerBounds> = {
  imperial: { min: 0, max: 600, step: 2.5 },
  metric: { min: 0, max: 300, step: 1 },
};

export const BODY_WEIGHT_PICKER: Record<UnitSystemValue, PickerBounds> = {
  imperial: { min: 60, max: 400, step: 0.5 },
  metric: { min: 27, max: 180, step: 0.2 },
};
