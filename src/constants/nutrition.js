// Most users describe a meal in 2–3 angles tops; more than that adds
// API cost without improving Claude's portion estimates.
export const MAX_PHOTOS = 3;

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
