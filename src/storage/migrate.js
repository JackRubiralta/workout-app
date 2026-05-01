import { KEYS, LEGACY, SCHEMA_VERSION } from './keys';
import { readJson, writeJson } from './asyncStore';
import { migrateExercise } from '../utils/exercise';
import { EXERCISE_REST_SECONDS, DAYS } from '../constants/workout';
import { DEFAULT_GOALS } from '../constants/nutrition';

function migrateDay(d) {
  return {
    ...d,
    exerciseRestSeconds: d.exerciseRestSeconds ?? EXERCISE_REST_SECONDS,
    exercises: (d.exercises ?? []).map(migrateExercise),
  };
}

function defaultConfig() {
  return {
    days: DAYS.map(d => migrateDay({
      day: d.day,
      title: d.title,
      focus: d.focus,
      color: d.color,
      exerciseRestSeconds: d.exerciseRestSeconds,
      exercises: d.exercises,
    })),
  };
}

function migrateConfigV1(parsed) {
  if (!parsed || !Array.isArray(parsed.days)) return defaultConfig();
  return { days: parsed.days.map(migrateDay) };
}

// v1 nutrition could be either old-shape ({breakfast, lunch, …}) or already-flat array.
function migrateNutritionV1(parsed) {
  if (!parsed) return { logsByDate: {}, goals: { ...DEFAULT_GOALS } };
  const out = {};
  for (const k of Object.keys(parsed.logsByDate ?? {})) {
    const day = parsed.logsByDate[k];
    if (Array.isArray(day)) {
      out[k] = day;
    } else if (day && typeof day === 'object') {
      const flat = [];
      for (const sub of Object.keys(day)) {
        if (Array.isArray(day[sub])) flat.push(...day[sub]);
      }
      flat.sort((a, b) => (a.addedAt ?? '').localeCompare(b.addedAt ?? ''));
      out[k] = flat;
    } else {
      out[k] = [];
    }
  }
  return {
    logsByDate: out,
    goals: { ...DEFAULT_GOALS, ...(parsed.goals ?? {}) },
  };
}

// Synthesize a placeholder session for any day that has progress in v1 but no
// in-progress session in the log. This way we don't silently drop the user's
// in-flight workout. Placeholder entries are flagged so PR/pre-fill skip them.
function synthesizeFromProgress(progressMap, configDays, sessions) {
  if (!Array.isArray(progressMap) || !Array.isArray(configDays)) return sessions;
  const synth = [];
  for (let di = 0; di < progressMap.length; di++) {
    const dp = progressMap[di];
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

    const entries = [];
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

function migrateLogV1(parsed) {
  if (!parsed || !Array.isArray(parsed.sessions)) return [];
  return parsed.sessions.map(s => ({
    id: s.id,
    startedAt: s.startedAt,
    completedAt: s.completedAt ?? null,
    abandonedAt: null,
    dayIndex: s.dayIndex ?? 0,
    dayTitle: s.dayTitle ?? '',
    dayFocus: s.dayFocus ?? '',
    dayColor: s.dayColor ?? '#888888',
    entries: (s.entries ?? []).map(e => ({
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
      timestamp: e.timestamp ?? s.startedAt,
      isPlaceholder: false,
    })),
    undoStack: [],
  }));
}

export async function ensureMigrated() {
  const meta = await readJson(KEYS.meta);
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
  await writeJson(KEYS.meta, { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
  return true;
}

export { defaultConfig };
