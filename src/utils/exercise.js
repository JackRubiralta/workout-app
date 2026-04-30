// ─── Exercise helpers shared across hooks and screens ─────────────────────────

export function defaultExercise(name = '') {
  return {
    name: typeof name === 'string' ? name : '',
    sets: 3,
    warmup: false,
    restSeconds: 120,
    nextRestSeconds: null, // null → fall back to day.exerciseRestSeconds
    reps: '6–10 reps',
    warmupReps: 'Light weight, 12–15 reps',
    tracksWeight: true,
    tracksReps: true,
    tracksTime: false,
    durationSeconds: 60, // used when tracksTime is true
  };
}

// Migrate old string format → exercise object, fill missing fields with defaults
export function migrateExercise(ex) {
  if (typeof ex === 'string') return defaultExercise(ex);
  return {
    name: ex.name ?? '',
    sets: ex.sets ?? 3,
    warmup: ex.warmup ?? false,
    restSeconds: ex.restSeconds ?? 120,
    nextRestSeconds: ex.nextRestSeconds ?? null,
    reps: ex.reps ?? '6–10 reps',
    warmupReps: ex.warmupReps ?? 'Light weight, 12–15 reps',
    tracksWeight: ex.tracksWeight ?? true,
    tracksReps: ex.tracksReps ?? true,
    tracksTime: ex.tracksTime ?? false,
    durationSeconds: ex.durationSeconds ?? 60,
  };
}

export function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '–:–';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Total number of sets for an exercise (warmup counts as 1 extra set)
export function exerciseTotalSets(ex) {
  return (ex.warmup ? 1 : 0) + ex.sets;
}

// Human-readable set label for a given set index
export function getSetLabel(ex, setIndex) {
  if (ex.warmup && setIndex === 0) return 'Warm-up';
  const num = ex.warmup ? setIndex : setIndex + 1;
  return `Set ${num}`;
}

// Rep guide string for a given set index
export function getRepsGuide(ex, setIndex) {
  if (ex.warmup && setIndex === 0) return ex.warmupReps || 'Light weight, 12–15 reps';
  return ex.reps || '6–10 reps';
}
