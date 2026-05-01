import { useCallback, useMemo } from 'react';
import { KEYS } from '@/storage/keys';
import { usePersistedState } from '@/storage/usePersistedState';
import { UnitSystem, type UnitSystemValue } from '@/shared/utils/units';
import type { Settings } from '@/shared/types/settingsTypes';

const DEFAULT_SETTINGS: Settings = Object.freeze({
  unitSystem: UnitSystem.IMPERIAL,
});

function hydrate(stored: unknown): Settings {
  const s = (stored ?? {}) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...s };
}

export type UseSettings = {
  loaded: boolean;
  unitSystem: UnitSystemValue;
  setUnitSystem: (next: UnitSystemValue) => void;
};

export function useSettings(): UseSettings {
  const [settings, setSettings, loaded] = usePersistedState<Settings>(
    KEYS.settings,
    DEFAULT_SETTINGS,
    hydrate,
  );

  const setUnitSystem = useCallback(
    (next: UnitSystemValue) => {
      if (next !== UnitSystem.IMPERIAL && next !== UnitSystem.METRIC) return;
      setSettings(prev => ({ ...prev, unitSystem: next }));
    },
    [setSettings],
  );

  return useMemo(
    () => ({ loaded, unitSystem: settings.unitSystem, setUnitSystem }),
    [loaded, settings.unitSystem, setUnitSystem],
  );
}
