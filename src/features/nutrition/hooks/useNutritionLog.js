import { useCallback, useEffect, useState } from 'react';
import { KEYS } from '../../../storage/keys';
import { readJson, writeJson } from '../../../storage/asyncStore';
import { ensureMigrated } from '../../../storage/migrate';
import { roundInt, roundTenths } from '../../../utils/format';
import { DEFAULT_GOALS } from '../../../constants/nutrition';

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Normalize the nutrition shape into integer calories + tenths-rounded
// gram macros. Used identically for the top-level entry and each
// component, so it lives once and gets called twice in addFood.
function normalizeFood(it) {
  return {
    name: String(it?.name ?? 'Item'),
    quantity: Number(it?.quantity ?? 1),
    unit: String(it?.unit ?? 'serving'),
    calories: roundInt(it?.calories),
    protein: roundTenths(it?.protein),
    carbs: roundTenths(it?.carbs),
    fat: roundTenths(it?.fat),
    fiber: roundTenths(it?.fiber),
  };
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

/**
 * Reads / writes the user's food log (per-day entries) and macro goals.
 * Lazy-loaded on mount; mutations persist immediately.
 *
 * @returns {{
 *   loaded: boolean,
 *   logsByDate: { [yyyymmdd:string]: Array<object> },
 *   goals: { calories:number, protein:number, carbs:number, fat:number, fiber:number },
 *   addFood: (dateKey:string, item:object, photos?:Array<{uri:string}>) => void,
 *   removeFood: (dateKey:string, itemId:string) => void,
 *   setGoals: (next:object) => void,
 * }}
 */
export function useNutritionLog() {
  const [logsByDate, setLogsByDate] = useState({});
  const [goals, setGoalsState] = useState(DEFAULT_GOALS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureMigrated();
      const stored = await readJson(KEYS.nutrition);
      if (alive && stored) {
        setLogsByDate(stored.logsByDate ?? {});
        setGoalsState({ ...DEFAULT_GOALS, ...(stored.goals ?? {}) });
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loaded) writeJson(KEYS.nutrition, { logsByDate, goals });
  }, [logsByDate, goals, loaded]);

  // photos: array of { uri, mediaType? } from image-picker. URIs may be
  // file:// (native) or blob: (web). Stored as-is — note that file URIs may
  // get garbage-collected over time on iOS; we degrade gracefully in the UI.
  const addFood = useCallback((dateKey, item, photos = []) => {
    const components = Array.isArray(item.components) && item.components.length
      ? item.components.map(normalizeFood)
      : null;
    const entry = {
      ...normalizeFood(item),
      id: generateId(),
      addedAt: new Date().toISOString(),
      photos: Array.isArray(photos) ? photos.slice(0, 3).map(p => ({ uri: p.uri ?? p })) : [],
      source: item.source ?? null, // 'photo' | 'text' | 'manual' | null
      notes: item.notes ?? null,
      confidence: item.confidence ?? null,
      components,
    };
    setLogsByDate(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] ?? []), entry] }));
  }, []);

  const removeFood = useCallback((dateKey, itemId) => {
    setLogsByDate(prev => {
      const day = prev[dateKey];
      if (!day) return prev;
      return { ...prev, [dateKey]: day.filter(it => it.id !== itemId) };
    });
  }, []);

  const setGoals = useCallback((next) => {
    setGoalsState(prev => ({ ...prev, ...next }));
  }, []);

  return { loaded, logsByDate, goals, addFood, removeFood, setGoals };
}
