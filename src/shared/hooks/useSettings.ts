import { useCallback, useMemo } from 'react';
import { KEYS } from '@/storage/keys';
import { usePersistedState } from '@/storage/usePersistedState';
import { UnitSystem, type UnitSystemValue } from '@/shared/utils/units';
import type { Gender, Settings, UserProfile } from '@/shared/types/settingsTypes';

const DEFAULT_PROFILE: UserProfile = Object.freeze({
  name: null,
  heightCm: null,
  gender: null,
});

const DEFAULT_SETTINGS: Settings = Object.freeze({
  unitSystem: UnitSystem.IMPERIAL,
  profile: DEFAULT_PROFILE,
});

const VALID_GENDERS: ReadonlyArray<Gender> = ['male', 'female', 'other'];

function hydrateProfile(raw: unknown): UserProfile {
  const p = (raw ?? {}) as Partial<UserProfile>;
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 40) : null;
  const heightCm =
    typeof p.heightCm === 'number' && isFinite(p.heightCm) && p.heightCm > 0
      ? Math.round(p.heightCm * 10) / 10
      : null;
  const gender =
    typeof p.gender === 'string' && (VALID_GENDERS as ReadonlyArray<string>).includes(p.gender)
      ? (p.gender as Gender)
      : null;
  return { name, heightCm, gender };
}

function hydrate(stored: unknown): Settings {
  const s = (stored ?? {}) as Partial<Settings>;
  return {
    unitSystem: s.unitSystem ?? DEFAULT_SETTINGS.unitSystem,
    profile: hydrateProfile(s.profile),
  };
}

export type UseSettings = {
  loaded: boolean;
  unitSystem: UnitSystemValue;
  setUnitSystem: (next: UnitSystemValue) => void;
  profile: UserProfile;
  /**
   * Merge-patch the profile. Pass `null` for a field to clear it.
   * Pass `undefined` or omit the field to leave it unchanged.
   */
  updateProfile: (patch: Partial<UserProfile>) => void;
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

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setSettings(prev => {
        const merged: UserProfile = {
          name: patch.name === undefined ? prev.profile.name : patch.name,
          heightCm: patch.heightCm === undefined ? prev.profile.heightCm : patch.heightCm,
          gender: patch.gender === undefined ? prev.profile.gender : patch.gender,
        };
        return { ...prev, profile: hydrateProfile(merged) };
      });
    },
    [setSettings],
  );

  return useMemo(
    () => ({
      loaded,
      unitSystem: settings.unitSystem,
      setUnitSystem,
      profile: settings.profile,
      updateProfile,
    }),
    [loaded, settings.unitSystem, settings.profile, setUnitSystem, updateProfile],
  );
}
