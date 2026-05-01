import { useEffect, useRef, useState } from 'react';
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
 *
 * `hydrate` lets the caller validate / reshape the stored blob (the
 * sessions hook for example clears a stale `activeSessionId` whose
 * session no longer exists). It is run inside the loader effect, NOT in
 * a render, so it can be as expensive as it needs to be.
 *
 * @template T
 * @param {string} key - AsyncStorage key (use the registry in `storage/keys.js`).
 * @param {T | () => T} initial - Initial state before storage loads. Lazy-evaluated if a function.
 * @param {(stored: any) => T} [hydrate] - Optional reshape/validate of the raw stored value.
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>, boolean]} `[state, setState, loaded]`
 */
export function usePersistedState(key, initial, hydrate) {
  const [state, setState] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const hydrateRef = useRef(hydrate);
  hydrateRef.current = hydrate;

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureMigrated();
      const stored = await readJson(key);
      if (alive && stored != null) {
        const next = hydrateRef.current ? hydrateRef.current(stored) : stored;
        if (alive) setState(next);
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, [key]);

  useEffect(() => {
    if (loaded) writeJson(key, state);
  }, [key, state, loaded]);

  return [state, setState, loaded];
}
