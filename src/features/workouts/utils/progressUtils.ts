// Pure helpers for "where in the day are we?" math — set completion,
// rest duration, dayProgress totals.

import { exerciseTotalSets } from '../constants/exerciseDefaults';
import type {
  DayTemplate,
  ExerciseTemplate,
  SetEntry,
  SetPosition,
  WorkoutSession,
} from '../types/workoutTypes';

export function restDurationFor(
  day: DayTemplate,
  exercise: ExerciseTemplate,
  exIndex: number,
  setIndex: number,
): number {
  const isLastSet = setIndex === exerciseTotalSets(exercise) - 1;
  const isLastEx = exIndex === day.exercises.length - 1;
  if (isLastSet && !isLastEx) {
    return exercise.nextRestSeconds ?? day.exerciseRestSeconds ?? 180;
  }
  return exercise.restSeconds;
}

export function isSetDone(
  session: WorkoutSession | null,
  exIndex: number,
  setIndex: number,
): boolean {
  if (!session) return false;
  return session.entries.some(e => e.exerciseIndex === exIndex && e.setIndex === setIndex);
}

export function entryFor(
  session: WorkoutSession | null,
  exIndex: number,
  setIndex: number,
): SetEntry | null {
  if (!session) return null;
  return session.entries.find(e => e.exerciseIndex === exIndex && e.setIndex === setIndex) ?? null;
}

export function doneSetCount(
  session: WorkoutSession | null,
  day: DayTemplate,
): number {
  if (!session) return 0;
  let count = 0;
  for (const e of session.entries) {
    const ex = day.exercises[e.exerciseIndex];
    if (!ex) continue;
    const total = exerciseTotalSets(ex);
    if (e.setIndex < total) count++;
  }
  return count;
}

export function totalSetCount(day: DayTemplate): number {
  return day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
}

export function isDayComplete(
  session: WorkoutSession | null,
  day: DayTemplate | null | undefined,
): boolean {
  if (!session || !day) return false;
  for (let ei = 0; ei < day.exercises.length; ei++) {
    const total = exerciseTotalSets(day.exercises[ei]);
    for (let si = 0; si < total; si++) {
      if (!isSetDone(session, ei, si)) return false;
    }
  }
  return true;
}

export function findNextSet(
  session: WorkoutSession | null,
  day: DayTemplate | null | undefined,
): SetPosition | null {
  if (!day) return null;
  for (let e = 0; e < day.exercises.length; e++) {
    const total = exerciseTotalSets(day.exercises[e]);
    for (let s = 0; s < total; s++) {
      if (!isSetDone(session, e, s)) return { e, s };
    }
  }
  return null;
}

export function dayProgress(
  session: WorkoutSession | null,
  day: DayTemplate | null | undefined,
): { done: number; total: number } {
  if (!day) return { done: 0, total: 0 };
  return {
    done: doneSetCount(session, day),
    total: totalSetCount(day),
  };
}

export function activeSessionForDay(
  sessions: ReadonlyArray<WorkoutSession>,
  dayIndex: number,
): WorkoutSession | null {
  if (!Array.isArray(sessions)) return null;
  return (
    sessions.find(s => s.dayIndex === dayIndex && !s.completedAt && !s.abandonedAt) ?? null
  );
}
