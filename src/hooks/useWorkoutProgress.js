<<<<<<< HEAD
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DAYS, SETS_PER_EXERCISE } from '../constants/workout';

const STORAGE_KEY = '@workout_progress_v1';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFreshProgress() {
  return DAYS.map(day => ({
    sets: day.exercises.map(() => Array(SETS_PER_EXERCISE).fill(false)),
  }));
}

function isDayComplete(dayProgress) {
  return dayProgress.sets.every(exSets => exSets.every(Boolean));
}

// Returns { e, s } of the first undone set in the given day, or null if done.
function findNextSet(dayProgress, dayIndex) {
  const day = DAYS[dayIndex];
  for (let e = 0; e < day.exercises.length; e++) {
    for (let s = 0; s < SETS_PER_EXERCISE; s++) {
=======
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
>>>>>>> 1f5a396 (s)
      if (!dayProgress.sets[e]?.[s]) return { e, s };
    }
  }
  return null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
export function useWorkoutProgress() {
  const [progress, setProgress] = useState(null); // null while loading
  const [loaded, setLoaded] = useState(false);

  // Load from AsyncStorage on mount
=======
export function useWorkoutProgress(days = DEFAULT_DAYS) {
  const [progress, setProgress] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load once on mount and normalize to current config
>>>>>>> 1f5a396 (s)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
<<<<<<< HEAD
          try {
            setProgress(JSON.parse(raw));
          } catch {
            setProgress(buildFreshProgress());
          }
        } else {
          setProgress(buildFreshProgress());
        }
      })
      .catch(() => setProgress(buildFreshProgress()))
      .finally(() => setLoaded(true));
  }, []);

  // Persist whenever progress changes (skip initial null → fresh build transition)
=======
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
>>>>>>> 1f5a396 (s)
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
<<<<<<< HEAD
            return exSets.map((done, si) => (si === setIndex ? true : done));
=======
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
>>>>>>> 1f5a396 (s)
          }),
        };
      });
    });
  }, []);

  const resetAll = useCallback(() => {
<<<<<<< HEAD
    setProgress(buildFreshProgress());
  }, []);

  // Returns { e, s } for the next undone set on a given day, or null.
  const getNextSet = useCallback(
    (dayIndex) => {
      if (!progress) return null;
      return findNextSet(progress[dayIndex], dayIndex);
    },
    [progress],
  );

  // Derived values
  const doneDays = progress ? progress.map(isDayComplete) : DAYS.map(() => false);
  const allDone = doneDays.every(Boolean);

  return {
    progress,
    loaded,
    doneDays,
    allDone,
    markSetDone,
    resetAll,
    getNextSet,
  };
=======
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
>>>>>>> 1f5a396 (s)
}
