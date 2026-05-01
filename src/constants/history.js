// Max points to show in the per-exercise progress sparkline. The
// ExerciseHistorySheet uses the full sheet (more room → more points);
// the TopExercises rollup on the Tracking tab uses the smaller value
// because each row is only ~90px wide.
export const MAX_HISTORY_POINTS = 12;
export const TOP_EXERCISES_POINTS = 10;

// How many "top exercises" to show on the Tracking tab. Pulled out so
// we can tune density without grepping the call site.
export const TOP_EXERCISES_COUNT = 4;
