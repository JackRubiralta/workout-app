import { useCallback, useEffect, useState } from 'react';
import { KEYS } from '../../../storage/keys';
import { readJson, writeJson } from '../../../storage/asyncStore';
import { ensureMigrated } from '../../../storage/migrate';

// Fiber: aim-for goal (≥30g daily is the typical recommendation).
const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 220, fat: 65, fiber: 30 };

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
      ? item.components.map(c => ({
          name: String(c.name ?? 'Item'),
          quantity: Number(c.quantity ?? 1),
          unit: String(c.unit ?? 'serving'),
          calories: Math.round(Number(c.calories ?? 0)),
          protein: Math.round(Number(c.protein ?? 0) * 10) / 10,
          carbs: Math.round(Number(c.carbs ?? 0) * 10) / 10,
          fat: Math.round(Number(c.fat ?? 0) * 10) / 10,
          fiber: Math.round(Number(c.fiber ?? 0) * 10) / 10,
        }))
      : null;
    const entry = {
      id: generateId(),
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? 'serving',
      calories: Math.round(item.calories ?? 0),
      protein: Math.round((item.protein ?? 0) * 10) / 10,
      carbs: Math.round((item.carbs ?? 0) * 10) / 10,
      fat: Math.round((item.fat ?? 0) * 10) / 10,
      fiber: Math.round((item.fiber ?? 0) * 10) / 10,
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
