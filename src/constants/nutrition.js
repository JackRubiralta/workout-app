// Most users describe a meal in 2–3 angles tops; more than that adds
// API cost without improving Claude's portion estimates.
export const MAX_PHOTOS = 3;

// Default macro targets seeded for new users. Calorie & macro split tuned
// for an average adult lifter (~150 lb). User can override per-field in
// the GoalsSheet and the new values persist.
export const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 220,
  fat: 65,
  fiber: 30,
};

// Image quality passed to expo-image-picker. 0.6 is roughly visually
// indistinguishable for nutrition analysis but ~3× smaller payload than 1.0.
export const PHOTO_QUALITY = 0.6;

// Source values stored on each food entry. Keep as a const-object so
// call sites read like an enum (FoodSource.PHOTO) and grep-finds find them.
export const FoodSource = Object.freeze({
  PHOTO: 'photo',
  TEXT: 'text',
  MANUAL: 'manual',
});

export const Confidence = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
});
