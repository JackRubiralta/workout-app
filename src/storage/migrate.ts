import { KEYS, LEGACY, SCHEMA_VERSION } from './keys';
import { readJson, writeJson } from './asyncStore';
import { migrateExercise } from '@/features/workouts/constants/exerciseDefaults';
import {
  EXERCISE_REST_SECONDS,
} from '@/features/workouts/constants/workoutConstants';
import { DAYS } from '@/features/workouts/constants/workoutPrograms';
import { DEFAULT_GOALS } from '@/features/nutrition/constants/nutritionConstants';
import type {
  DayTemplate,
  WorkoutConfig,
  WorkoutSession,
} from '@/features/workouts/types/workoutTypes';
import type {
  FoodEntry,
  LogsByDate,
  NutritionState,
} from '@/features/nutrition/types/nutritionTypes';
import type { AppMeta } from './types';

function migrateDay(d: Partial<DayTemplate>): DayTemplate {
  return {
    day: d.day ?? 1,
    title: d.title ?? '',
    focus: d.focus ?? '',
    color: d.color ?? '#888888',
    exerciseRestSeconds: d.exerciseRestSeconds ?? EXERCISE_REST_SECONDS,
    exercises: (d.exercises ?? []).map(migrateExercise),
  };
}

export function defaultConfig(): WorkoutConfig {
  return {
    days: DAYS.map(d => migrateDay(d)),
  };
}

function migrateConfigV1(parsed: unknown): WorkoutConfig {
  const p = parsed as { days?: unknown[] } | null;
  if (!p || !Array.isArray(p.days)) return defaultConfig();
  return { days: p.days.map((d: unknown) => migrateDay(d as Partial<DayTemplate>)) };
}

// v1 nutrition could be either old-shape ({breakfast, lunch, …}) or already-flat array.
function migrateNutritionV1(parsed: unknown): NutritionState {
  const p = parsed as { logsByDate?: Record<string, unknown>; goals?: Partial<typeof DEFAULT_GOALS> } | null;
  if (!p) return { logsByDate: {}, goals: { ...DEFAULT_GOALS } };
  const out: LogsByDate = {};
  for (const k of Object.keys(p.logsByDate ?? {})) {
    const day = (p.logsByDate ?? {})[k];
    if (Array.isArray(day)) {
      out[k] = day as FoodEntry[];
    } else if (day && typeof day === 'object') {
      const flat: FoodEntry[] = [];
      for (const sub of Object.keys(day as Record<string, unknown>)) {
        const arr = (day as Record<string, unknown>)[sub];
        if (Array.isArray(arr)) flat.push(...(arr as FoodEntry[]));
      }
      flat.sort((a, b) => (a.addedAt ?? '').localeCompare(b.addedAt ?? ''));
      out[k] = flat;
    } else {
      out[k] = [];
    }
  }
  return {
    logsByDate: out,
    goals: { ...DEFAULT_GOALS, ...(p.goals ?? {}) },
  };
}

type V1Progress = ReadonlyArray<{ sets?: ReadonlyArray<ReadonlyArray<boolean>> }>;

// Synthesize a placeholder session for any day that has progress in v1 but no
// in-progress session in the log.
function synthesizeFromProgress(
  progressMap: V1Progress | unknown,
  configDays: DayTemplate[],
  sessions: WorkoutSession[],
): WorkoutSession[] {
  if (!Array.isArray(progressMap) || !Array.isArray(configDays)) return sessions;
  const synth: WorkoutSession[] = [];
  for (let di = 0; di < progressMap.length; di++) {
    const dp = progressMap[di] as { sets?: ReadonlyArray<ReadonlyArray<boolean>> } | undefined;
    if (!dp || !Array.isArray(dp.sets)) continue;
    const day = configDays[di];
    if (!day) continue;

    const hasAny = dp.sets.some(arr => Array.isArray(arr) && arr.some(Boolean));
    const allDone = dp.sets.every((arr, ei) => {
      const ex = day.exercises[ei];
      if (!ex) return true;
      const total = (ex.warmup ? 1 : 0) + (ex.sets ?? 3);
      return Array.isArray(arr) && arr.length >= total && arr.slice(0, total).every(Boolean);
    });
    if (!hasAny || allDone) continue;

    const hasInProgress = sessions.some(s =>
      s.dayIndex === di && !s.completedAt && !s.abandonedAt,
    );
    if (hasInProgress) continue;

    const entries: WorkoutSession['entries'] = [];
    dp.sets.forEach((arr, ei) => {
      const ex = day.exercises[ei];
      if (!ex || !Array.isArray(arr)) return;
      arr.forEach((done, si) => {
        if (!done) return;
        const isWarmup = ex.warmup && si === 0;
        entries.push({
          exerciseIndex: ei,
          setIndex: si,
          exerciseName: ex.name,
          setLabel: isWarmup ? 'Warm-up' : `Set ${ex.warmup ? si : si + 1}`,
          isWarmup,
          weight: 0,
          unit: 'lb',
          reps: 0,
          toFailure: false,
          restSeconds: ex.restSeconds ?? 90,
          timestamp: new Date().toISOString(),
          isPlaceholder: true,
        });
      });
    });

    synth.push({
      id: `migrated_${di}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      startedAt: new Date().toISOString(),
      completedAt: null,
      abandonedAt: null,
      dayIndex: di,
      dayTitle: day.title,
      dayFocus: day.focus ?? '',
      dayColor: day.color,
      entries,
      undoStack: [],
      migrated: true,
    });
  }
  return [...synth, ...sessions];
}

type V1Entry = Partial<WorkoutSession['entries'][number]>;
type V1Session = Partial<Omit<WorkoutSession, 'entries'>> & {
  entries?: ReadonlyArray<V1Entry>;
};

function migrateLogV1(parsed: unknown): WorkoutSession[] {
  const p = parsed as { sessions?: ReadonlyArray<V1Session> } | null;
  if (!p || !Array.isArray(p.sessions)) return [];
  return p.sessions.map((s): WorkoutSession => {
    const rawEntries: ReadonlyArray<V1Entry> = s.entries ?? [];
    return {
      id: s.id ?? '',
      startedAt: s.startedAt ?? new Date().toISOString(),
      completedAt: s.completedAt ?? null,
      abandonedAt: null,
      dayIndex: s.dayIndex ?? 0,
      dayTitle: s.dayTitle ?? '',
      dayFocus: s.dayFocus ?? '',
      dayColor: s.dayColor ?? '#888888',
      entries: rawEntries.map((e: V1Entry) => ({
        exerciseIndex: e.exerciseIndex ?? 0,
        setIndex: e.setIndex ?? 0,
        exerciseName: e.exerciseName ?? '',
        setLabel: e.setLabel ?? '',
        isWarmup: !!e.isWarmup,
        weight: e.weight ?? 0,
        unit: e.unit ?? 'lb',
        reps: e.reps ?? 0,
        toFailure: !!e.toFailure,
        restSeconds: e.restSeconds ?? null,
        timestamp: e.timestamp ?? s.startedAt ?? new Date().toISOString(),
        isPlaceholder: false,
      })),
      undoStack: [],
    };
  });
}

export async function ensureMigrated(): Promise<boolean> {
  const meta = await readJson<AppMeta>(KEYS.meta);
  if (meta && meta.schemaVersion >= SCHEMA_VERSION) return false;

  const [v1Config, v1Log, v1Progress, v1Nutrition] = await Promise.all([
    readJson(LEGACY.config),
    readJson(LEGACY.log),
    readJson(LEGACY.progress),
    readJson(LEGACY.nutrition),
  ]);

  const config = v1Config ? migrateConfigV1(v1Config) : defaultConfig();
  const sessionsFromLog = v1Log ? migrateLogV1(v1Log) : [];
  const sessions = synthesizeFromProgress(v1Progress, config.days, sessionsFromLog);
  const nutrition = migrateNutritionV1(v1Nutrition);

  await Promise.all([
    writeJson(KEYS.config, config),
    writeJson(KEYS.sessions, { sessions, activeSessionId: null }),
    writeJson(KEYS.nutrition, nutrition),
  ]);
  await writeJson(KEYS.meta, {
    schemaVersion: SCHEMA_VERSION,
    migratedAt: new Date().toISOString(),
  } satisfies AppMeta);
  return true;
}
