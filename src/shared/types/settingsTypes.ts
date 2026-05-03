import type { UnitSystemValue } from '@/shared/utils/units';

// User-supplied profile facts the coach uses to tailor recommendations.
// Both fields are nullable because they're populated lazily — `null` means
// "not yet asked / not yet provided." Storage layer is metric-of-record:
// height is always cm, weight (when needed) is read from the body-weight
// log in lb. UI converts at display time.
export type UserProfile = {
  name: string | null;
  heightCm: number | null;
};

export type Settings = {
  unitSystem: UnitSystemValue;
  profile: UserProfile;
};
