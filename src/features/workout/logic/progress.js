import { exerciseTotalSets } from '../../../utils/exercise';

export function isSetDone(session, exIndex, setIndex) {
  if (!session) return false;
  return session.entries.some(e => e.exerciseIndex === exIndex && e.setIndex === setIndex);
}

export function entryFor(session, exIndex, setIndex) {
  if (!session) return null;
  return session.entries.find(e => e.exerciseIndex === exIndex && e.setIndex === setIndex) ?? null;
}

export function doneSetCount(session, day) {
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

export function totalSetCount(day) {
  return day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
}

export function isDayComplete(session, day) {
  if (!session || !day) return false;
  for (let ei = 0; ei < day.exercises.length; ei++) {
    const total = exerciseTotalSets(day.exercises[ei]);
    for (let si = 0; si < total; si++) {
      if (!isSetDone(session, ei, si)) return false;
    }
  }
  return true;
}

export function findNextSet(session, day) {
  if (!day) return null;
  for (let e = 0; e < day.exercises.length; e++) {
    const total = exerciseTotalSets(day.exercises[e]);
    for (let s = 0; s < total; s++) {
      if (!isSetDone(session, e, s)) return { e, s };
    }
  }
  return null;
}

export function dayProgress(session, day) {
  return {
    done: doneSetCount(session, day),
    total: totalSetCount(day),
  };
}

export function activeSessionForDay(sessions, dayIndex) {
  if (!Array.isArray(sessions)) return null;
  return sessions.find(s =>
    s.dayIndex === dayIndex && !s.completedAt && !s.abandonedAt,
  ) ?? null;
}
