import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { readJson, writeJson } from './asyncStore';
import { ensureMigrated } from './migrate';

/**
 * Single source of truth for "load from AsyncStorage, hydrate React state,
 * persist on every mutation." Every domain hook (`useWorkoutConfig`,
 * `useWorkoutSession`, `useNutritionLog`, `useBodyWeight`) used to roll
 * the same ~30-line load/persist dance inline; this collapses it.
 *
 * Behaviour:
 *   • On mount: awaits the v1→v2 migration, then reads `key`. If the
 *     stored value is non-null, `hydrate(stored)` is called and the
 *     return value becomes initial state.
 *   • Once `loaded` flips true, every subsequent setState write-throughs
 *     to AsyncStorage. Pre-load writes are no-ops, which guarantees we
 *     never overwrite the user's persisted data with a placeholder.
 */
export function usePersistedState<T>(
  key: string,
  initial: T | (() => T),
  hydrate?: (stored: unknown) => T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const hydrateRef = useRef(hydrate);
  hydrateRef.current = hydrate;

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureMigrated();
      const stored = await readJson<unknown>(key);
      if (alive && stored != null) {
        const next = hydrateRef.current ? hydrateRef.current(stored) : (stored as T);
        if (alive) setState(next);
      }
      if (alive) setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  useEffect(() => {
    if (loaded) writeJson(key, state);
  }, [key, state, loaded]);

  return [state, setState, loaded];
}
