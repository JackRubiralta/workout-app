// Pre-fill + PR + e1RM helpers.
// "Working" entries = non-warmup, non-placeholder, weight or reps > 0.

import type { SetEntry, WorkoutSession } from '../types/workoutTypes';

export type WorkingSet = { entry: SetEntry; session: WorkoutSession };

function isWorking(entry: SetEntry): boolean {
  return !entry.isWarmup && !entry.isPlaceholder && (entry.weight > 0 || entry.reps > 0);
}

export function mostRecentWorkingSet(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
  excludeSessionId: string | null = null,
): WorkingSet | null {
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    if (!s.completedAt) continue;
    for (let i = s.entries.length - 1; i >= 0; i--) {
      const e = s.entries[i];
      if (e.exerciseName === exerciseName && isWorking(e)) return { entry: e, session: s };
    }
  }
  return null;
}

export function lastTwoWorkingSets(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
  excludeSessionId: string | null = null,
): WorkingSet[] {
  const out: WorkingSet[] = [];
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    if (!s.completedAt) continue;
    const lastInSession = [...s.entries]
      .reverse()
      .find(e => e.exerciseName === exerciseName && isWorking(e));
    if (lastInSession) out.push({ entry: lastInSession, session: s });
    if (out.length >= 2) break;
  }
  return out;
}

export type AverageOfLast = { weight: number; reps: number; count: number };

export function averageOfLastN(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
  n = 5,
  excludeSessionId: string | null = null,
): AverageOfLast | null {
  const collected: SetEntry[] = [];
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    for (let i = s.entries.length - 1; i >= 0; i--) {
      const e = s.entries[i];
      if (e.exerciseName === exerciseName && isWorking(e)) {
        collected.push(e);
        if (collected.length >= n) break;
      }
    }
    if (collected.length >= n) break;
  }
  if (collected.length === 0) return null;
  const avgWeight = collected.reduce((a, b) => a + b.weight, 0) / collected.length;
  const avgReps = collected.reduce((a, b) => a + b.reps, 0) / collected.length;
  return {
    weight: roundWeight(avgWeight),
    reps: Math.round(avgReps),
    count: collected.length,
  };
}

export function epley(weight: number, reps: number): number {
  if (!weight || !reps || reps < 1) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function allWorkingSets(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
): WorkingSet[] {
  const out: WorkingSet[] = [];
  for (const s of sessions) {
    for (const e of s.entries) {
      if (e.exerciseName === exerciseName && isWorking(e)) out.push({ entry: e, session: s });
    }
  }
  return out;
}

export function topSetPerSession(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
): WorkingSet[] {
  const out: WorkingSet[] = [];
  for (const s of sessions) {
    let top: SetEntry | null = null;
    for (const e of s.entries) {
      if (e.exerciseName !== exerciseName || !isWorking(e)) continue;
      if (!top || e.weight > top.weight || (e.weight === top.weight && e.reps > top.reps)) {
        top = e;
      }
    }
    if (top) out.push({ entry: top, session: s });
  }
  return out;
}

export type PersonalRecords = {
  bestWeight: SetEntry | null;
  bestE1RM: SetEntry | null;
};

export function personalRecords(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
  excludeSessionId: string | null = null,
): PersonalRecords {
  let bestWeight: SetEntry | null = null;
  let bestE1RM: SetEntry | null = null;
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    for (const e of s.entries) {
      if (e.exerciseName !== exerciseName || !isWorking(e)) continue;
      if (
        !bestWeight ||
        e.weight > bestWeight.weight ||
        (e.weight === bestWeight.weight && e.reps > bestWeight.reps)
      ) {
        bestWeight = e;
      }
      const er = epley(e.weight, e.reps);
      const erBest = bestE1RM ? epley(bestE1RM.weight, bestE1RM.reps) : 0;
      if (er > erBest) bestE1RM = e;
    }
  }
  return { bestWeight, bestE1RM };
}

export type PRWin =
  | { kind: 'weight'; prev: SetEntry | null }
  | { kind: 'e1rm'; prev: SetEntry | null; prevE1RM: number; newE1RM: number };

export function detectPR(
  sessions: ReadonlyArray<WorkoutSession>,
  exerciseName: string,
  newEntry: SetEntry,
  sessionId: string,
): PRWin[] | null {
  if (!isWorking(newEntry)) return null;
  const prior = personalRecords(sessions, exerciseName, sessionId);
  const wins: PRWin[] = [];
  if (
    !prior.bestWeight ||
    newEntry.weight > prior.bestWeight.weight ||
    (newEntry.weight === prior.bestWeight.weight && newEntry.reps > prior.bestWeight.reps)
  ) {
    wins.push({ kind: 'weight', prev: prior.bestWeight });
  }
  const newE1RM = epley(newEntry.weight, newEntry.reps);
  const prevE1RM = prior.bestE1RM ? epley(prior.bestE1RM.weight, prior.bestE1RM.reps) : 0;
  if (newE1RM > prevE1RM && newE1RM > 0) {
    wins.push({ kind: 'e1rm', prev: prior.bestE1RM, prevE1RM, newE1RM });
  }
  return wins.length > 0 ? wins : null;
}

export function roundWeight(w: number): number {
  return Math.round(w / 2.5) * 2.5;
}

export type TopExercise = { name: string; sessionCount: number };

export function topExercises(
  sessions: ReadonlyArray<WorkoutSession>,
  n = 4,
): TopExercise[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.abandonedAt) continue;
    if (!s.completedAt && !s.entries.some(e => !e.isPlaceholder)) continue;
    const seen = new Set<string>();
    for (const e of s.entries) {
      if (!isWorking(e) || e.isWarmup) continue;
      if (e.weight <= 0) continue;
      if (seen.has(e.exerciseName)) continue;
      seen.add(e.exerciseName);
      counts.set(e.exerciseName, (counts.get(e.exerciseName) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, sessionCount]) => ({ name, sessionCount }));
}
