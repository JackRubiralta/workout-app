import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DAYS } from '../constants/workout';
import { exerciseTotalSets, migrateExercise } from '../utils/exercise';

const STORAGE_KEY = '@workout_progress_v1';

// Default days with migrated exercises (used as fallback param)
const DEFAULT_DAYS = DAYS.map(d => ({ ...d, exercises: d.exercises.map(migrateExercise) }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFreshProgress(days) {
  return days.map(day => ({
    sets: day.exercises.map(ex => Array(exerciseTotalSets(ex)).fill(false)),
  }));
}

// Resize stored progress arrays to match current exercise configs.
// Preserves completed sets; new slots start as false; extra slots are trimmed.
function normalizeProgress(stored, days) {
  return days.map((day, di) => {
    const dayProg = stored[di] ?? { sets: [] };
    return {
      sets: day.exercises.map((ex, ei) => {
        const total = exerciseTotalSets(ex);
        const existing = dayProg.sets?.[ei] ?? [];
        return Array.from({ length: total }, (_, si) => existing[si] ?? false);
      }),
    };
  });
}

function isDayComplete(dayProgress, day) {
  return dayProgress.sets.every((exSets, ei) => {
    const ex = day.exercises[ei];
    if (!ex) return true; // stale entry — ignore
    const total = exerciseTotalSets(ex);
    return exSets.length >= total && exSets.slice(0, total).every(Boolean);
  });
}

function findNextSet(dayProgress, day) {
  for (let e = 0; e < day.exercises.length; e++) {
    const total = exerciseTotalSets(day.exercises[e]);
    for (let s = 0; s < total; s++) {
      if (!dayProgress.sets[e]?.[s]) return { e, s };
    }
  }
  return null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWorkoutProgress(days = DEFAULT_DAYS) {
  const [progress, setProgress] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load once on mount and normalize to current config
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try { setProgress(normalizeProgress(JSON.parse(raw), days)); }
          catch { setProgress(buildFreshProgress(days)); }
        } else {
          setProgress(buildFreshProgress(days));
        }
      })
      .catch(() => setProgress(buildFreshProgress(days)))
      .finally(() => setLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // Re-normalize when exercise configs change (e.g. user edits sets/warmup)
  const prevDaysRef = useRef(days);
  useEffect(() => {
    if (!loaded || prevDaysRef.current === days) return;
    prevDaysRef.current = days;
    setProgress(prev => (prev !== null ? normalizeProgress(prev, days) : null));
  }, [days, loaded]);

  // Persist every change
  useEffect(() => {
    if (progress !== null) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(console.error);
    }
  }, [progress]);

  const markSetDone = useCallback((dayIndex, exIndex, setIndex) => {
    setProgress(prev => {
      if (!prev) return prev;
      return prev.map((day, di) => {
        if (di !== dayIndex) return day;
        return {
          sets: day.sets.map((exSets, ei) => {
            if (ei !== exIndex) return exSets;
            // Grow array if needed (handles edge cases during config changes)
            const len = Math.max(exSets.length, setIndex + 1);
            return Array.from({ length: len }, (_, si) =>
              si === setIndex ? true : (exSets[si] ?? false)
            );
          }),
        };
      });
    });
  }, []);

  const unmarkSetDone = useCallback((dayIndex, exIndex, setIndex) => {
    setProgress(prev => {
      if (!prev) return prev;
      return prev.map((day, di) => {
        if (di !== dayIndex) return day;
        return {
          sets: day.sets.map((exSets, ei) => {
            if (ei !== exIndex) return exSets;
            return exSets.map((v, si) => (si === setIndex ? false : v));
          }),
        };
      });
    });
  }, []);

  const resetAll = useCallback(() => {
    setProgress(buildFreshProgress(days));
  }, [days]);

  const removeDayProgress = useCallback((dayIndex) => {
    setProgress(prev => (prev ? prev.filter((_, i) => i !== dayIndex) : prev));
  }, []);

  const reorderDayProgress = useCallback((fromIndex, toIndex) => {
    setProgress(prev => {
      if (!prev || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const getNextSet = useCallback(
    (dayIndex) => {
      if (!progress) return null;
      return findNextSet(progress[dayIndex], days[dayIndex]);
    },
    [progress, days],
  );

  const doneDays = progress
    ? progress.map((dp, i) => isDayComplete(dp, days[i]))
    : days.map(() => false);
  const allDone = doneDays.every(Boolean);

  return { progress, loaded, doneDays, allDone, markSetDone, unmarkSetDone, resetAll, removeDayProgress, reorderDayProgress, getNextSet };
}
