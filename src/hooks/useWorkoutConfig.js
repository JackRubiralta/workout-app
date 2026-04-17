import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DAYS, EXERCISE_REST_SECONDS } from '../constants/workout';
import { defaultExercise, migrateExercise } from '../utils/exercise';

const STORAGE_KEY = '@workout_config_v1';

// Colors cycled for new days
const PALETTE = ['#FF4757', '#3742FA', '#2ED573', '#FFA502', '#A55EEA', '#00B894', '#FF7675', '#74B9FF'];

function migrateDay(d) {
  return {
    ...d,
    exerciseRestSeconds: d.exerciseRestSeconds ?? EXERCISE_REST_SECONDS,
    exercises: (d.exercises ?? []).map(migrateExercise),
  };
}

function buildDefaultConfig() {
  return {
    days: DAYS.map(d => migrateDay({
      day: d.day,
      title: d.title,
      focus: d.focus,
      color: d.color,
      exerciseRestSeconds: d.exerciseRestSeconds,
      exercises: d.exercises,
    })),
  };
}

function migrateConfig(raw) {
  const parsed = JSON.parse(raw);
  return {
    ...parsed,
    days: (parsed.days ?? []).map(migrateDay),
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkoutConfig() {
  const [config, setConfig] = useState(buildDefaultConfig);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try { setConfig(migrateConfig(raw)); }
          catch { /* keep defaults */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config)).catch(console.error);
    }
  }, [config, loaded]);

  const updateDay = useCallback((dayIndex, updates) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIndex ? { ...d, ...updates } : d)),
    }));
  }, []);

  const addDay = useCallback(() => {
    setConfig(prev => {
      const usedColors = new Set(prev.days.map(d => d.color));
      const color = PALETTE.find(c => !usedColors.has(c)) ?? PALETTE[prev.days.length % PALETTE.length];
      return {
        ...prev,
        days: [
          ...prev.days,
          {
            day: prev.days.length + 1,
            title: 'DAY',
            focus: '',
            color,
            exerciseRestSeconds: EXERCISE_REST_SECONDS,
            exercises: [
              defaultExercise('Exercise 1'),
              defaultExercise('Exercise 2'),
              defaultExercise('Exercise 3'),
            ],
          },
        ],
      };
    });
  }, []);

  const deleteDay = useCallback((dayIndex) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days
        .filter((_, i) => i !== dayIndex)
        .map((d, i) => ({ ...d, day: i + 1 })),
    }));
  }, []);

  const reorderDay = useCallback((fromIndex, toIndex) => {
    setConfig(prev => {
      if (fromIndex === toIndex) return prev;
      const days = [...prev.days];
      const [removed] = days.splice(fromIndex, 1);
      days.splice(toIndex, 0, removed);
      return {
        ...prev,
        days: days.map((d, i) => ({ ...d, day: i + 1 })),
      };
    });
  }, []);

  const resetConfig = useCallback(() => setConfig(buildDefaultConfig()), []);

  return { config, loaded, updateDay, addDay, deleteDay, reorderDay, resetConfig };
}
