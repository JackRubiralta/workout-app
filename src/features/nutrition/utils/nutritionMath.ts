// Pure helpers for nutrition math + formatting. Lives separate from
// the persistence hook so consumers don't pay React-hook overhead just
// to format a meta line or sum a day's totals.

import type { FoodComponent, FoodEntry, MacroSet } from '../types/nutritionTypes';

// Compact macro line for food rows: "1 cup · 14P / 14C / 1F / 3Fb".
// Fiber is suppressed when 0 so a stick of butter doesn't end with "/ 0Fb".
export function formatFoodMeta(item: FoodComponent | FoodEntry | null | undefined): string {
  if (!item) return '';
  const head = `${item.quantity} ${item.unit}`;
  const macros = `${item.protein ?? 0}P / ${item.carbs ?? 0}C / ${item.fat ?? 0}F`;
  const fb = item.fiber > 0 ? ` / ${item.fiber}Fb` : '';
  return `${head} · ${macros}${fb}`;
}

// Sum each macro across a day's items. Treats missing fields as zero.
export function totalsForDay(items: ReadonlyArray<FoodComponent | FoodEntry> | null | undefined): MacroSet {
  const totals: MacroSet = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const item of items ?? []) {
    totals.calories += item.calories ?? 0;
    totals.protein += item.protein ?? 0;
    totals.carbs += item.carbs ?? 0;
    totals.fat += item.fat ?? 0;
    totals.fiber += item.fiber ?? 0;
  }
  return totals;
}
