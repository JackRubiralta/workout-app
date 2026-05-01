import { useCallback, useMemo } from 'react';
import { KEYS } from '../../../storage/keys';
import { usePersistedState } from '../../../storage/usePersistedState';
import { roundInt, roundTenths } from '../../../utils/format';
import { DEFAULT_GOALS } from '../../../constants/nutrition';
import { makeId } from '../../../utils/ids';

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
// Bucket both halves of the nutrition state under one storage key so
// usePersistedState owns the whole load/persist cycle. Hydrator merges
// any missing macro into DEFAULT_GOALS so users on older blobs don't
// crash when a newly-added goal field (e.g. fiber) is undefined.
const INITIAL = { logsByDate: {}, goals: DEFAULT_GOALS };
function hydrate(stored) {
  return {
    logsByDate: stored.logsByDate ?? {},
    goals: { ...DEFAULT_GOALS, ...(stored.goals ?? {}) },
  };
}

export function useNutritionLog() {
  const [state, setState, loaded] = usePersistedState(KEYS.nutrition, INITIAL, hydrate);
  const { logsByDate, goals } = state;

  // photos: array of { uri, mediaType? } from image-picker. URIs may be
  // file:// (native) or blob: (web). Stored as-is — note that file URIs may
  // get garbage-collected over time on iOS; we degrade gracefully in the UI.
  const addFood = useCallback((dateKey, item, photos = []) => {
    const components = Array.isArray(item.components) && item.components.length
      ? item.components.map(normalizeFood)
      : null;
    const entry = {
      ...normalizeFood(item),
      id: makeId('f'),
      addedAt: new Date().toISOString(),
      photos: Array.isArray(photos) ? photos.slice(0, 3).map(p => ({ uri: p.uri ?? p })) : [],
      source: item.source ?? null, // 'photo' | 'text' | 'manual' | null
      notes: item.notes ?? null,
      confidence: item.confidence ?? null,
      components,
    };
    setState(prev => ({
      ...prev,
      logsByDate: { ...prev.logsByDate, [dateKey]: [...(prev.logsByDate[dateKey] ?? []), entry] },
    }));
  }, [setState]);

  const removeFood = useCallback((dateKey, itemId) => {
    setState(prev => {
      const day = prev.logsByDate[dateKey];
      if (!day) return prev;
      return {
        ...prev,
        logsByDate: { ...prev.logsByDate, [dateKey]: day.filter(it => it.id !== itemId) },
      };
    });
  }, [setState]);

  const setGoals = useCallback((next) => {
    setState(prev => ({ ...prev, goals: { ...prev.goals, ...next } }));
  }, [setState]);

  return useMemo(
    () => ({ loaded, logsByDate, goals, addFood, removeFood, setGoals }),
    [loaded, logsByDate, goals, addFood, removeFood, setGoals],
  );
}
