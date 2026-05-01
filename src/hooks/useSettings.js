import { useCallback, useMemo } from 'react';
import { KEYS } from '../storage/keys';
import { usePersistedState } from '../storage/usePersistedState';
import { UnitSystem } from '../utils/units';

const DEFAULT_SETTINGS = Object.freeze({
  unitSystem: UnitSystem.IMPERIAL,
});

// New settings fields are added to DEFAULT_SETTINGS; the hydrator merges
// stored blobs against the current defaults so users on older blobs don't
// crash when a newly-introduced field is undefined.
function hydrate(stored) {
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

/**
 * App-wide user preferences (currently just unit system; pattern lets us
 * grow this without spinning a new hook per field).
 *
 * @returns {{
 *   loaded: boolean,
 *   unitSystem: 'imperial'|'metric',
 *   setUnitSystem: (next:'imperial'|'metric') => void,
 * }}
 */
export function useSettings() {
  const [settings, setSettings, loaded] = usePersistedState(KEYS.settings, DEFAULT_SETTINGS, hydrate);

  const setUnitSystem = useCallback((next) => {
    if (next !== UnitSystem.IMPERIAL && next !== UnitSystem.METRIC) return;
    setSettings(prev => ({ ...prev, unitSystem: next }));
  }, [setSettings]);

  return useMemo(
    () => ({ loaded, unitSystem: settings.unitSystem, setUnitSystem }),
    [loaded, settings.unitSystem, setUnitSystem],
  );
}
