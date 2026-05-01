import type { MacroGoals } from '../types/nutritionTypes';

// Most users describe a meal in 2–3 angles tops; more than that adds
// API cost without improving Claude's portion estimates.
export const MAX_PHOTOS = 3;

// Default macro targets seeded for new users. Tuned for an active adult
// lifter at ~3000 kcal/day with gut-health-forward macros:
//   • Protein 150 g  → 600 kcal (20%) — supports recovery
//   • Carbs   375 g  → 1500 kcal (50%) — fuel for training
//   • Fat     100 g  → 900 kcal (30%) — hormone & absorption support
//   • Fiber    40 g  — top of the AHA / gut-health range (~14 g per 1000 kcal)
// User can override per-field in the GoalsSheet and the new values persist.
export const DEFAULT_GOALS: MacroGoals = {
  calories: 3000,
  protein: 150,
  carbs: 375,
  fat: 100,
  fiber: 40,
};

// Image quality passed to expo-image-picker. 0.6 is roughly visually
// indistinguishable for nutrition analysis but ~3× smaller payload than 1.0.
export const PHOTO_QUALITY = 0.6;

export const FoodSource = {
  PHOTO: 'photo',
  TEXT: 'text',
  MANUAL: 'manual',
} as const;

export const Confidence = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
