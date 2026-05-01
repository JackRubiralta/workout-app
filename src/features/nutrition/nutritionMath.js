// Pure helpers for nutrition math + formatting. Lives separate from
// `useNutritionLog` so consumers (Screen, FoodLog, ResultsView, etc.)
// don't pay the React-hook overhead just to format a meta line or sum a
// day's totals.

// yyyy-mm-dd in local time. Used as the key into `logsByDate` so the
// "Today" lens doesn't accidentally walk back across the UTC boundary.
export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Compact macro line for food rows: "1 cup · 14P / 14C / 1F / 3Fb".
// Fiber is suppressed when 0 so a stick of butter doesn't end with "/ 0Fb".
export function formatFoodMeta(item) {
  if (!item) return '';
  const head = `${item.quantity} ${item.unit}`;
  const macros = `${item.protein ?? 0}P / ${item.carbs ?? 0}C / ${item.fat ?? 0}F`;
  const fb = item.fiber > 0 ? ` / ${item.fiber}Fb` : '';
  return `${head} · ${macros}${fb}`;
}

// Sum each macro across a day's items. Treats missing fields as zero so
// older entries (pre-fiber) don't NaN the totals.
export function totalsForDay(items) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const item of items ?? []) {
    totals.calories += item.calories ?? 0;
    totals.protein += item.protein ?? 0;
    totals.carbs += item.carbs ?? 0;
    totals.fat += item.fat ?? 0;
    totals.fiber += item.fiber ?? 0;
  }
  return totals;
}
