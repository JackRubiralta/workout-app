import { useCallback, useMemo } from 'react';
import { KEYS } from '@/storage/keys';
import { usePersistedState } from '@/storage/usePersistedState';
import { roundTenths } from '@/shared/utils/format';
import { makeId } from '@/shared/utils/ids';
import type {
  BodyWeightEntry,
  BodyWeightState,
  BodyWeightUnit,
} from '../types/trackingTypes';

const INITIAL: BodyWeightState = { entries: [] };

function hydrate(stored: unknown): BodyWeightState {
  const s = (stored ?? {}) as Partial<BodyWeightState>;
  return { entries: Array.isArray(s.entries) ? s.entries : [] };
}

export type UseBodyWeight = {
  loaded: boolean;
  entries: BodyWeightEntry[];
  latest: BodyWeightEntry | null;
  addEntry: (weight: number, unit?: BodyWeightUnit) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
};

/**
 * Body-weight log: an array of `{ id, weight, unit, recordedAt }` sorted
 * oldest → newest. Used by the Tracking tab to plot weight over time.
 */
export function useBodyWeight(): UseBodyWeight {
  const [state, setState, loaded] = usePersistedState<BodyWeightState>(
    KEYS.bodyweight,
    INITIAL,
    hydrate,
  );
  const entries = state.entries;

  const addEntry = useCallback(
    (weight: number, unit: BodyWeightUnit = 'lb') => {
      const w = Number(weight);
      if (!isFinite(w) || w <= 0) return;
      const entry: BodyWeightEntry = {
        id: makeId('bw'),
        weight: roundTenths(w),
        unit,
        recordedAt: new Date().toISOString(),
      };
      setState(prev => ({
        entries: [...prev.entries, entry].sort((a, b) =>
          (a.recordedAt ?? '').localeCompare(b.recordedAt ?? ''),
        ),
      }));
    },
    [setState],
  );

  const removeEntry = useCallback(
    (id: string) => {
      setState(prev => ({ entries: prev.entries.filter(e => e.id !== id) }));
    },
    [setState],
  );

  const clearAll = useCallback(() => setState({ entries: [] }), [setState]);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  return useMemo(
    () => ({ loaded, entries, latest, addEntry, removeEntry, clearAll }),
    [loaded, entries, latest, addEntry, removeEntry, clearAll],
  );
}
