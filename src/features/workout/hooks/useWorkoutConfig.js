import { useCallback } from 'react';
import { KEYS } from '../../../storage/keys';
import { usePersistedState } from '../../../storage/usePersistedState';
import { defaultConfig } from '../../../storage/migrate';
import { dayPalette } from '../../../theme';
import { defaultExercise } from '../logic/exercise';
import { EXERCISE_REST_SECONDS } from '../../../constants/workout';

/**
 * Reads / writes the user's workout-program config (the editable list of
 * day templates). Lazy-loaded from AsyncStorage on mount; every mutation
 * persists.
 *
 * @returns {{
 *   config: { days: Array<{ day:number, title:string, focus:string, color:string, exerciseRestSeconds:number, exercises:Array<object> }> },
 *   loaded: boolean,
 *   updateDay: (dayIndex:number, updates:object) => void,
 *   addDay: () => void,
 *   deleteDay: (dayIndex:number) => void,
 *   reorderDay: (from:number, to:number) => void,
 *   resetConfig: () => void,
 * }}
 */
export function useWorkoutConfig() {
  const [config, setConfig, loaded] = usePersistedState(KEYS.config, defaultConfig);

  const updateDay = useCallback((dayIndex, updates) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIndex ? { ...d, ...updates } : d)),
    }));
  }, [setConfig]);

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
  }, [setConfig]);

  const deleteDay = useCallback((dayIndex) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days
        .filter((_, i) => i !== dayIndex)
        .map((d, i) => ({ ...d, day: i + 1 })),
    }));
  }, [setConfig]);

  const reorderDay = useCallback((from, to) => {
    setConfig(prev => {
      if (from === to) return prev;
      const days = [...prev.days];
      const [moved] = days.splice(from, 1);
      days.splice(to, 0, moved);
      return { ...prev, days: days.map((d, i) => ({ ...d, day: i + 1 })) };
    });
  }, [setConfig]);

  const resetConfig = useCallback(() => setConfig(defaultConfig()), [setConfig]);

  return { config, loaded, updateDay, addDay, deleteDay, reorderDay, resetConfig };
}
