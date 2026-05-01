import type { ExerciseTemplate } from '../types/workoutTypes';

/** Build a fresh exercise template, filling defaults for omitted fields. */
export function defaultExercise(name = ''): ExerciseTemplate {
  return {
    name: typeof name === 'string' ? name : '',
    sets: 3,
    warmup: false,
    restSeconds: 120,
    nextRestSeconds: null,
    reps: '6–10 reps',
    warmupReps: 'Light weight, 12–15 reps',
    tracksWeight: true,
    tracksReps: true,
    tracksTime: false,
    durationSeconds: 60,
  };
}

/** Migrate old string-format or partial exercise objects to the current shape. */
export function migrateExercise(ex: unknown): ExerciseTemplate {
  if (typeof ex === 'string') return defaultExercise(ex);
  const e = (ex ?? {}) as Partial<ExerciseTemplate>;
  return {
    name: e.name ?? '',
    sets: e.sets ?? 3,
    warmup: e.warmup ?? false,
    restSeconds: e.restSeconds ?? 120,
    nextRestSeconds: e.nextRestSeconds ?? null,
    reps: e.reps ?? '6–10 reps',
    warmupReps: e.warmupReps ?? 'Light weight, 12–15 reps',
    tracksWeight: e.tracksWeight ?? true,
    tracksReps: e.tracksReps ?? true,
    tracksTime: e.tracksTime ?? false,
    durationSeconds: e.durationSeconds ?? 60,
  };
}

/** Total number of sets for an exercise (warm-up counts as 1 extra set). */
export function exerciseTotalSets(ex: ExerciseTemplate): number {
  return (ex.warmup ? 1 : 0) + ex.sets;
}

/** Human-readable set label for a given set index. */
export function getSetLabel(ex: ExerciseTemplate, setIndex: number): string {
  if (ex.warmup && setIndex === 0) return 'Warm-up';
  const num = ex.warmup ? setIndex : setIndex + 1;
  return `Set ${num}`;
}

/** Rep guide string for a given set index. */
export function getRepsGuide(ex: ExerciseTemplate, setIndex: number): string {
  if (ex.warmup && setIndex === 0) return ex.warmupReps || 'Light weight, 12–15 reps';
  return ex.reps || '6–10 reps';
}
