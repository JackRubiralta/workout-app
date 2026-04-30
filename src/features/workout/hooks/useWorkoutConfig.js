import { useCallback, useEffect, useState } from 'react';
import { KEYS } from '../../../storage/keys';
import { readJson, writeJson } from '../../../storage/asyncStore';
import { ensureMigrated, defaultConfig } from '../../../storage/migrate';
import { dayPalette } from '../../../theme';
import { defaultExercise } from '../../../utils/exercise';
import { EXERCISE_REST_SECONDS } from '../../../constants/workout';

export function useWorkoutConfig() {
  const [config, setConfig] = useState(defaultConfig);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureMigrated();
      const stored = await readJson(KEYS.config);
      if (alive && stored) setConfig(stored);
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loaded) writeJson(KEYS.config, config);
  }, [config, loaded]);

  const updateDay = useCallback((dayIndex, updates) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIndex ? { ...d, ...updates } : d)),
    }));
  }, []);

  const addDay = useCallback(() => {
    setConfig(prev => {
      const used = new Set(prev.days.map(d => d.color));
      const color = dayPalette.find(c => !used.has(c)) ?? dayPalette[prev.days.length % dayPalette.length];
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

  const reorderDay = useCallback((from, to) => {
    setConfig(prev => {
      if (from === to) return prev;
      const days = [...prev.days];
      const [moved] = days.splice(from, 1);
      days.splice(to, 0, moved);
      return { ...prev, days: days.map((d, i) => ({ ...d, day: i + 1 })) };
    });
  }, []);

  const resetConfig = useCallback(() => setConfig(defaultConfig()), []);

  return { config, loaded, updateDay, addDay, deleteDay, reorderDay, resetConfig };
}
