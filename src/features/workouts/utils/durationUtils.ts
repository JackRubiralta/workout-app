import type { DayTemplate } from '../types/workoutTypes';
import { exerciseTotalSets } from '../constants/exerciseDefaults';

const PER_SET_WORK_SECONDS = 45;

/**
 * Estimate session duration in minutes for a configured day:
 * sum of (sets × work) + (between-set rest) + (between-exercise rest).
 */
export function estimateDayMinutes(day: DayTemplate): number {
  let secs = 0;
  for (const ex of day.exercises) {
    const total = exerciseTotalSets(ex);
    secs += total * PER_SET_WORK_SECONDS;
    secs += Math.max(0, total - 1) * (ex.restSeconds ?? 90);
    secs += ex.nextRestSeconds ?? day.exerciseRestSeconds ?? 180;
  }
  return Math.max(5, Math.round(secs / 60));
}
