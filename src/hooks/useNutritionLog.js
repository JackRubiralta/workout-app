import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nutrition_log_v1';

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 220, fat: 65 };

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Old shape: { breakfast: [...], lunch: [...], dinner: [...], snacks: [...] }
// New shape: [item, item, ...] sorted by addedAt
function migrateDay(day) {
  if (Array.isArray(day)) return day;
  if (!day || typeof day !== 'object') return [];
  const flat = [];
  for (const key of Object.keys(day)) {
    if (Array.isArray(day[key])) flat.push(...day[key]);
  }
  flat.sort((a, b) => (a.addedAt ?? '').localeCompare(b.addedAt ?? ''));
  return flat;
}

function migrateLogs(logsByDate) {
  const out = {};
  for (const k of Object.keys(logsByDate ?? {})) {
    out[k] = migrateDay(logsByDate[k]);
  }
  return out;
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

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useNutritionLog() {
  const [logsByDate, setLogsByDate] = useState({});
  const [goals, setGoalsState] = useState(DEFAULT_GOALS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setLogsByDate(migrateLogs(parsed.logsByDate));
            setGoalsState({ ...DEFAULT_GOALS, ...(parsed.goals ?? {}) });
          } catch { /* keep defaults */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ logsByDate, goals })).catch(() => {});
    }
  }, [logsByDate, goals, loaded]);

  const addFood = useCallback((dateKey, item) => {
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
    };
    setLogsByDate(prev => {
      const day = prev[dateKey] ?? [];
      return { ...prev, [dateKey]: [...day, entry] };
    });
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

  return {
    loaded,
    logsByDate,
    goals,
    addFood,
    removeFood,
    setGoals,
  };
}
