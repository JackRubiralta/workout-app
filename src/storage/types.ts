// Typed payloads for everything the app persists to AsyncStorage.
// One file so a future migration can reference every shape without
// reaching across feature boundaries.

import type { WorkoutConfig, WorkoutSessionsState } from '@/features/workouts/types/workoutTypes';
import type { NutritionState } from '@/features/nutrition/types/nutritionTypes';
import type { BodyWeightState } from '@/features/tracking/types/trackingTypes';
import type { Settings } from '@/shared/types/settingsTypes';

export type AppMeta = {
  schemaVersion: number;
  migratedAt: string;
};

// Map of storage-key → payload shape.
export type StoragePayloads = {
  '@workout_config_v2': WorkoutConfig;
  '@workout_sessions_v2': WorkoutSessionsState;
  '@nutrition_log_v2': NutritionState;
  '@bodyweight_log_v2': BodyWeightState;
  '@settings_v2': Settings;
  '@app_meta_v2': AppMeta;
};
