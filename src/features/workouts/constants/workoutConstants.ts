// Tunables for the workouts feature — set counts, timer defaults,
// retention bounds. Day templates and exercise-defaults live in
// `workoutPrograms.ts` to keep this file scannable.

export const REST_SECONDS = 90;
export const SETS_PER_EXERCISE = 3;

// SetLogSheet weight/rep picker bounds — gym dumbbells in 2.5 lb increments
// up to 600 lb covers every realistic setup; 100 reps is a hard cap for the
// rep ScrollPicker (anything higher rolls into AMRAP territory anyway).
export const WEIGHT_STEP_LB = 2.5;
export const WEIGHT_MAX_LB = 600;
export const REPS_MAX = 100;

// Newest-N session retention — older sessions get evicted from storage.
// 200 ≈ 6 months at 2 sessions/day, plenty for trend math.
export const MAX_SESSIONS = 200;

// Three working sets, with the warm-up set rendered separately when
// `exercise.warmup === true`.
export const SET_LABELS = ['Warm-up', 'Set 1', 'Set 2'] as const;
export const SET_REPS = ['Light weight, 12–15 reps', '6–10 reps', '6–10 reps'] as const;

// Default rest after finishing all sets of an exercise.
export const EXERCISE_REST_SECONDS = 150;
