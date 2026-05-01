// Domain types for the workouts feature. These describe the shape of the
// editable program (config) and any in-progress exercise.

export type ExerciseTemplate = {
  name: string;
  sets: number;
  warmup: boolean;
  /** Rest after each working set (seconds). */
  restSeconds: number;
  /** Rest between this exercise and the next. `null` → use day default. */
  nextRestSeconds: number | null;
  /** Free-text rep guide (e.g. "6–10 reps"). */
  reps: string;
  /** Rep guide for the warm-up set (only used when `warmup === true`). */
  warmupReps: string;
  /** When false, the SetLogSheet hides the weight picker (bodyweight). */
  tracksWeight: boolean;
  /** When false, hides the reps picker. */
  tracksReps: boolean;
  /** When true, the active set is a countdown timer rather than weight×reps. */
  tracksTime: boolean;
  /** Countdown duration in seconds when `tracksTime === true`. */
  durationSeconds: number;
};

export type DayTemplate = {
  /** 1-based human-readable day number. Re-indexed on add/delete/reorder. */
  day: number;
  title: string;
  focus: string;
  color: string;
  exerciseRestSeconds: number;
  exercises: ExerciseTemplate[];
};

export type WorkoutConfig = {
  days: DayTemplate[];
};

// ─── Sessions / set entries ─────────────────────────────────────────────────

export type WeightUnit = 'lb';

export type SetEntry = {
  exerciseIndex: number;
  setIndex: number;
  exerciseName: string;
  setLabel: string;
  isWarmup: boolean;
  weight: number;
  unit: WeightUnit;
  reps: number;
  toFailure: boolean;
  restSeconds: number | null;
  timestamp: string;
  isPlaceholder: boolean;
  /** Optional countdown elapsed for timed exercises (Plank, Bike Warmup). */
  timeSeconds?: number | null;
  /** Synthesized "skip exercise" entry — counts as done but contains no data. */
  isSkipped?: boolean;
};

export type UndoAction =
  | { type: 'done'; exerciseIndex: number; setIndex: number; restSeconds: number | null }
  | { type: 'skip'; restSeconds: number };

export type WorkoutSession = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
  dayIndex: number;
  dayTitle: string;
  dayFocus: string;
  dayColor: string;
  entries: SetEntry[];
  undoStack: UndoAction[];
  /** Set on sessions reconstructed from the v1 progress map during migration. */
  migrated?: boolean;
};

export type WorkoutSessionsState = {
  sessions: WorkoutSession[];
  activeSessionId: string | null;
};

// ─── Helpers / shared shapes ────────────────────────────────────────────────

export type SetPosition = { e: number; s: number };
