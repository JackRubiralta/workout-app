import { useCallback, useEffect, useState } from 'react';
import { KEYS } from '../../../storage/keys';
import { readJson, writeJson } from '../../../storage/asyncStore';
import { ensureMigrated } from '../../../storage/migrate';
import { roundTenths } from '../../../utils/format';

function generateId() {
  return `bw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureMigrated();
      const stored = await readJson(KEYS.bodyweight);
      if (alive && stored && Array.isArray(stored.entries)) {
        setEntries(stored.entries);
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loaded) writeJson(KEYS.bodyweight, { entries });
  }, [entries, loaded]);

  const addEntry = useCallback((weight, unit = 'lb') => {
    const w = Number(weight);
    if (!isFinite(w) || w <= 0) return;
    const entry = {
      id: generateId(),
      weight: roundTenths(w),
      unit,
      recordedAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, entry].sort(
      (a, b) => (a.recordedAt ?? '').localeCompare(b.recordedAt ?? ''),
    ));
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearAll = useCallback(() => setEntries([]), []);

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;

  return { loaded, entries, latest, addEntry, removeEntry, clearAll };
}
