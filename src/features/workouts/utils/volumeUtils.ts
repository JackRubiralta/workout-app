// Volume = Σ weight × reps for non-warmup, non-placeholder sets.

import { startOfDay } from '@/shared/utils/date';
import type { WorkoutSession } from '../types/workoutTypes';

export function sessionVolume(session: WorkoutSession | null | undefined): number {
  if (!session) return 0;
  let v = 0;
  for (const e of session.entries) {
    if (e.isWarmup || e.isPlaceholder) continue;
    v += (e.weight || 0) * (e.reps || 0);
  }
  return v;
}

function dateKey(d: Date): string {
  const c = startOfDay(d);
  const y = c.getFullYear();
  const m = String(c.getMonth() + 1).padStart(2, '0');
  const day = String(c.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sessionDate(s: WorkoutSession): Date {
  return startOfDay(new Date(s.completedAt ?? s.startedAt));
}

function counts(s: WorkoutSession): boolean {
  if (s.abandonedAt) return false;
  if (s.completedAt) return true;
  return s.entries.some(e => !e.isPlaceholder);
}

function workoutDays(sessions: ReadonlyArray<WorkoutSession>): Set<string> {
  const set = new Set<string>();
  for (const s of sessions) {
    if (counts(s)) set.add(dateKey(sessionDate(s)));
  }
  return set;
}

export function workoutsThisWeek(sessions: ReadonlyArray<WorkoutSession>): number {
  const days = workoutDays(sessions);
  const today = startOfDay(new Date());
  const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  return [...days].filter(k => new Date(k) >= weekAgo).length;
}

export function workoutsThisMonth(sessions: ReadonlyArray<WorkoutSession>): number {
  const today = startOfDay(new Date());
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  return [...workoutDays(sessions)].filter(k => new Date(k) >= monthAgo).length;
}

export function streakStats(
  sessions: ReadonlyArray<WorkoutSession>,
): { current: number; longest: number } {
  const days = workoutDays(sessions);
  if (days.size === 0) return { current: 0, longest: 0 };

  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const today = startOfDay(new Date());
  let cursor = today;
  let current = 0;
  if (!days.has(dateKey(today))) {
    cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  }
  while (days.has(dateKey(cursor))) {
    current++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return { current, longest };
}

export function totalVolume(sessions: ReadonlyArray<WorkoutSession>): number {
  return sessions.reduce((acc, s) => acc + sessionVolume(s), 0);
}

export type DayVolumePoint = {
  date: Date;
  volume: number;
  count: number;
  dayLabel: string;
  isToday: boolean;
};

export function workoutsByDayLastN(
  sessions: ReadonlyArray<WorkoutSession>,
  n = 7,
): DayVolumePoint[] {
  const today = startOfDay(new Date());
  const out: DayVolumePoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dateKey(d);
    let volume = 0;
    let count = 0;
    for (const s of sessions) {
      if (s.abandonedAt) continue;
      if (!s.completedAt && !s.entries.some(e => !e.isPlaceholder)) continue;
      const sd = sessionDate(s);
      if (dateKey(sd) === key) {
        volume += sessionVolume(s);
        count += 1;
      }
    }
    out.push({
      date: d,
      volume: Math.round(volume),
      count,
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      isToday: i === 0,
    });
  }
  return out;
}

function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

export type WeeklyVolumePoint = {
  weekStart: Date;
  volume: number;
  count: number;
  label: string;
};

export function weeklyVolume(
  sessions: ReadonlyArray<WorkoutSession>,
  weeks = 4,
): WeeklyVolumePoint[] {
  const today = startOfDay(new Date());
  const thisWeek = startOfWeek(today);
  const out: WeeklyVolumePoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek);
    start.setDate(thisWeek.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    let volume = 0;
    let count = 0;
    for (const s of sessions) {
      if (s.abandonedAt) continue;
      if (!s.completedAt && !s.entries.some(e => !e.isPlaceholder)) continue;
      const sd = sessionDate(s);
      if (sd >= start && sd < end) {
        volume += sessionVolume(s);
        count += 1;
      }
    }
    out.push({
      weekStart: start,
      volume: Math.round(volume),
      count,
      label: i === 0 ? 'This' : `-${i}w`,
    });
  }
  return out;
}

export function volumeTrend(
  sessions: ReadonlyArray<WorkoutSession>,
  windowWeeks = 4,
): { current: number; previous: number; deltaPercent: number | null } {
  const today = startOfDay(new Date());
  const thisWeek = startOfWeek(today);
  const recentStart = new Date(thisWeek);
  recentStart.setDate(thisWeek.getDate() - (windowWeeks - 1) * 7);
  const priorEnd = new Date(recentStart);
  const priorStart = new Date(recentStart);
  priorStart.setDate(recentStart.getDate() - windowWeeks * 7);

  let current = 0;
  let previous = 0;
  for (const s of sessions) {
    if (s.abandonedAt) continue;
    const sd = sessionDate(s);
    if (sd >= recentStart && sd <= today) current += sessionVolume(s);
    else if (sd >= priorStart && sd < priorEnd) previous += sessionVolume(s);
  }
  const deltaPercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { current: Math.round(current), previous: Math.round(previous), deltaPercent };
}
