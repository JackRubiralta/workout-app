import { useCallback, useMemo } from 'react';
import { KEYS } from '../../../storage/keys';
import { usePersistedState } from '../../../storage/usePersistedState';
import { roundTenths } from '../../../utils/format';
import { makeId } from '../../../utils/ids';

const INITIAL = { entries: [] };
function hydrate(stored) {
  return { entries: Array.isArray(stored.entries) ? stored.entries : [] };
}

/**
 * Body-weight log: an array of `{ id, weight, unit, recordedAt }` sorted
 * oldest → newest. Used by the Tracking tab to plot weight over time.
 *
 * @returns {{
 *   loaded: boolean,
 *   entries: Array<{ id:string, weight:number, unit:string, recordedAt:string }>,
 *   latest: { id:string, weight:number, unit:string, recordedAt:string }|null,
 *   addEntry: (weight:number, unit?:string) => void,
 *   removeEntry: (id:string) => void,
 *   clearAll: () => void,
 * }}
 */
export function useBodyWeight() {
  const [state, setState, loaded] = usePersistedState(KEYS.bodyweight, INITIAL, hydrate);
  const entries = state.entries;

  const addEntry = useCallback((weight, unit = 'lb') => {
    const w = Number(weight);
    if (!isFinite(w) || w <= 0) return;
    const entry = {
      id: makeId('bw'),
      weight: roundTenths(w),
      unit,
      recordedAt: new Date().toISOString(),
    };
    setState(prev => ({
      entries: [...prev.entries, entry].sort(
        (a, b) => (a.recordedAt ?? '').localeCompare(b.recordedAt ?? ''),
      ),
    }));
  }, [setState]);

  const removeEntry = useCallback((id) => {
    setState(prev => ({ entries: prev.entries.filter(e => e.id !== id) }));
  }, [setState]);

  const clearAll = useCallback(() => setState({ entries: [] }), [setState]);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  return useMemo(
    () => ({ loaded, entries, latest, addEntry, removeEntry, clearAll }),
    [loaded, entries, latest, addEntry, removeEntry, clearAll],
  );
}
