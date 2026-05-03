// Pure builders that turn the persisted app state into a compact text
// block the coach can reason over. Lives outside the service so unit
// tests (or the prompt-tuning REPL) can exercise the digest logic
// without going through fetch.
//
// Sizing principles:
//   • Cap session history — newest N completed sessions, summarised to
//     top working set per exercise. A heavy lifter's full set log is
//     ~1k tokens / session; the digest is ~150.
//   • Cap nutrition history — the last 7 days, daily totals only.
//     Per-meal detail is rarely useful for coaching and explodes the
//     token budget.
//   • Skip empty sections so the prompt isn't cluttered with "(none)"
//     for users who haven't logged that data yet.

import type { LogsByDate, MacroGoals } from '@/features/nutrition/types/nutritionTypes';
import type { BodyWeightEntry } from '@/features/tracking/types/trackingTypes';
import type {
  WorkoutConfig,
  WorkoutSession,
} from '@/features/workouts/types/workoutTypes';
import { sessionVolume } from '@/features/workouts/utils/volumeUtils';
import { totalsForDay } from '@/features/nutrition/utils/nutritionMath';
import type { UserProfile } from '@/shared/types/settingsTypes';
import { fromLb, type UnitSystemValue, UnitSystem } from '@/shared/utils/units';

const MAX_RECENT_SESSIONS = 4;
const MAX_NUTRITION_DAYS = 7;
const MAX_WEIGHT_POINTS = 8;

// ── Profile / metrics ──────────────────────────────────────────────────────

function formatHeight(cm: number, system: UnitSystemValue): string {
  if (system === UnitSystem.METRIC) return `${Math.round(cm)} cm`;
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}′${inch}″ (${Math.round(cm)} cm)`;
}

function formatWeight(lb: number, system: UnitSystemValue): string {
  if (system === UnitSystem.METRIC) {
    const kg = fromLb(lb, system);
    return `${kg.toFixed(1)} kg`;
  }
  return `${Math.round(lb * 10) / 10} lb`;
}

function genderLabel(g: NonNullable<UserProfile['gender']>): string {
  return g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other / unspecified';
}

export function describeProfile(
  profile: UserProfile,
  latestWeight: BodyWeightEntry | null,
  unitSystem: UnitSystemValue,
): string {
  const lines: string[] = [];
  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.gender) lines.push(`Gender: ${genderLabel(profile.gender)}`);
  if (profile.heightCm != null) lines.push(`Height: ${formatHeight(profile.heightCm, unitSystem)}`);
  if (latestWeight) {
    const stamp = latestWeight.recordedAt.slice(0, 10);
    lines.push(`Body weight: ${formatWeight(latestWeight.weight, unitSystem)} (logged ${stamp})`);
  }
  return lines.length ? lines.join('\n') : '(profile not set)';
}

export function describeWeightTrend(
  entries: ReadonlyArray<BodyWeightEntry>,
  unitSystem: UnitSystemValue,
): string {
  if (entries.length <= 1) return '';
  const tail = entries.slice(-MAX_WEIGHT_POINTS);
  const lines = tail.map(e => `  ${e.recordedAt.slice(0, 10)}: ${formatWeight(e.weight, unitSystem)}`);
  return `Weight trend (most recent last):\n${lines.join('\n')}`;
}

// ── Workout program ────────────────────────────────────────────────────────

export function describeProgram(config: WorkoutConfig): string {
  if (!config.days.length) return '(empty — user has no days yet)';
  return config.days
    .map((d, i) => {
      const exs = d.exercises
        .map(ex => {
          const tags: string[] = [];
          if (ex.warmup) tags.push('warm-up');
          if (ex.tracksTime) tags.push(`${ex.durationSeconds}s timed`);
          if (!ex.tracksWeight) tags.push('bodyweight');
          const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
          return `    - ${ex.name}: ${ex.sets} × "${ex.reps}", rest ${ex.restSeconds}s${tagStr}`;
        })
        .join('\n');
      return `Day ${i + 1} — ${d.title}${d.focus ? ` (${d.focus})` : ''}, between-exercise rest ${d.exerciseRestSeconds}s\n${exs}`;
    })
    .join('\n\n');
}

type ExerciseDigest = {
  topWeight: number;
  topReps: number;
  setCount: number;
  toFailure: boolean;
};

function digestSessionByExercise(session: WorkoutSession): Map<string, ExerciseDigest> {
  const out = new Map<string, ExerciseDigest>();
  for (const e of session.entries) {
    if (e.isPlaceholder || e.isWarmup || e.isSkipped) continue;
    let d = out.get(e.exerciseName);
    if (!d) {
      d = { topWeight: 0, topReps: 0, setCount: 0, toFailure: false };
      out.set(e.exerciseName, d);
    }
    d.setCount += 1;
    if (e.toFailure) d.toFailure = true;
    const score = e.weight * Math.max(e.reps, 1);
    const topScore = d.topWeight * Math.max(d.topReps, 1);
    if (score > topScore) {
      d.topWeight = e.weight;
      d.topReps = e.reps;
    }
  }
  return out;
}

export function describeRecentSessions(sessions: ReadonlyArray<WorkoutSession>): string {
  const completed = sessions
    .filter(s => s.completedAt && !s.abandonedAt)
    .slice(-MAX_RECENT_SESSIONS)
    .reverse();
  if (!completed.length) return '(no completed sessions yet)';

  return completed
    .map(s => {
      const date = (s.completedAt ?? s.startedAt).slice(0, 10);
      const digest = digestSessionByExercise(s);
      const totalSets = [...digest.values()].reduce((acc, d) => acc + d.setCount, 0);
      const vol = Math.round(sessionVolume(s));
      const header = `${date} — ${s.dayTitle}${s.dayFocus ? ` (${s.dayFocus})` : ''} · vol ${vol} (lb·reps), ${totalSets} working sets`;
      if (digest.size === 0) return `${header}\n  (no working-set data captured)`;
      const lines = [...digest.entries()].map(([name, d]) => {
        const setSuffix = d.setCount > 1 ? ` × ${d.setCount} sets` : '';
        const failureSuffix = d.toFailure ? ' (one to failure)' : '';
        return `  ${name}: top ${d.topWeight}lb × ${d.topReps}${setSuffix}${failureSuffix}`;
      });
      return `${header}\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

// ── Nutrition ──────────────────────────────────────────────────────────────

export function describeMacroGoals(goals: MacroGoals): string {
  return `${goals.calories} kcal · ${goals.protein} P / ${goals.carbs} C / ${goals.fat} F / ${goals.fiber} Fb (g)`;
}

export function describeRecentNutrition(logsByDate: LogsByDate): string {
  // Newest-first slice of dated entries; we summarise to daily totals
  // because per-meal detail is rarely actionable for coaching.
  const sortedKeys = Object.keys(logsByDate).filter(k => (logsByDate[k] ?? []).length > 0).sort();
  if (sortedKeys.length === 0) return '(no nutrition logged yet)';

  const tail = sortedKeys.slice(-MAX_NUTRITION_DAYS);
  return tail
    .map(k => {
      const items = logsByDate[k] ?? [];
      const t = totalsForDay(items);
      return `  ${k}: ${Math.round(t.calories)} kcal · ${Math.round(t.protein)}P / ${Math.round(t.carbs)}C / ${Math.round(t.fat)}F / ${Math.round(t.fiber)}Fb · ${items.length} item${items.length === 1 ? '' : 's'}`;
    })
    .join('\n');
}
