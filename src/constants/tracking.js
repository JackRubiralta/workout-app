// Max points to show in the per-exercise progress sparkline. The
// ExerciseHistorySheet uses the full sheet (more room → more points);
// the TopExercises rollup on the Tracking tab uses the smaller value
// because each row is only ~90px wide.
export const MAX_HISTORY_POINTS = 12;
export const TOP_EXERCISES_POINTS = 10;

// How many "top exercises" to show on the Tracking tab. Pulled out so
// we can tune density without grepping the call site.
export const TOP_EXERCISES_COUNT = 4;

// Body-weight scroll-picker bounds. 60–400 lb covers the realistic adult
// range; 0.5 lb steps match every consumer scale.
export const BODY_WEIGHT_MIN_LB = 60;
export const BODY_WEIGHT_MAX_LB = 400;
export const BODY_WEIGHT_STEP_LB = 0.5;

// Sessions list shows the most recent N inline with a "Show all" expander
// for the rest. Tuned to roughly fill one phone screen — long enough to
// be useful at-a-glance, short enough to not require infinite scroll on
// power-users who've logged 100+ workouts.
export const SESSIONS_PREVIEW_COUNT = 12;
