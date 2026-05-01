// AsyncStorage keys — preserve EXACT values so user data is not orphaned
// across upgrades. Bump SCHEMA_VERSION + add a migrate handler in
// `migrate.ts` if a payload shape changes incompatibly.

export const KEYS = {
  config: '@workout_config_v2',
  sessions: '@workout_sessions_v2',
  nutrition: '@nutrition_log_v2',
  bodyweight: '@bodyweight_log_v2',
  settings: '@settings_v2',
  meta: '@app_meta_v2',
} as const;

export const LEGACY = {
  config: '@workout_config_v1',
  log: '@workout_log_v1',
  progress: '@workout_progress_v1',
  nutrition: '@nutrition_log_v1',
  undoPrefix: '@workout_undo_v1_day',
} as const;

export const SCHEMA_VERSION = 2 as const;
