import type { UnitSystemValue } from '@/shared/utils/units';

// User-supplied profile facts the coach uses to tailor recommendations.
// Each field is nullable because they're populated lazily — `null` means
// "not yet asked / not yet provided." Storage layer is metric-of-record:
// height is always cm, weight (when needed) is read from the body-weight
// log in lb. UI converts at display time.
//
// `gender` exists because protein and maintenance-calorie defaults differ
// non-trivially between men and women; the coach reads it to pick a
// sensible starting point. `'other'` is supported for users who'd rather
// not specify — the coach falls back to neutral averages in that case.
export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  name: string | null;
  heightCm: number | null;
  gender: Gender | null;
};

export type Settings = {
  unitSystem: UnitSystemValue;
  profile: UserProfile;
};
