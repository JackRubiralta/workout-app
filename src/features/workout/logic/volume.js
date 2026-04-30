// Volume = Σ weight × reps for non-warmup, non-placeholder sets.

export function sessionVolume(session) {
  if (!session) return 0;
  let v = 0;
  for (const e of session.entries) {
    if (e.isWarmup || e.isPlaceholder) continue;
    v += (e.weight || 0) * (e.reps || 0);
  }
  return v;
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function dateKey(d) {
  const c = startOfDay(d);
  const y = c.getFullYear();
  const m = String(c.getMonth() + 1).padStart(2, '0');
  const day = String(c.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sessionDate(s) {
  return startOfDay(new Date(s.completedAt ?? s.startedAt));
}

// Counts a session if it has any non-placeholder entries OR is completed.
function counts(s) {
  if (s.abandonedAt) return false;
  if (s.completedAt) return true;
  return s.entries.some(e => !e.isPlaceholder);
}

export function workoutsThisWeek(sessions) {
  const days = workoutDays(sessions);
  const today = startOfDay(new Date());
  const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  return [...days].filter(k => new Date(k) >= weekAgo).length;
}

export function workoutsThisMonth(sessions) {
  const today = startOfDay(new Date());
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  return [...workoutDays(sessions)].filter(k => new Date(k) >= monthAgo).length;
}

function workoutDays(sessions) {
  const set = new Set();
  for (const s of sessions) {
    if (counts(s)) set.add(dateKey(sessionDate(s)));
  }
  return set;
}

// Current streak = consecutive days ending today (or yesterday) with a workout.
// Longest streak = max run anywhere in history.
export function streakStats(sessions) {
  const days = workoutDays(sessions);
  if (days.size === 0) return { current: 0, longest: 0 };

  // Sort ascending
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: walk back from today
  const today = startOfDay(new Date());
  let cursor = today;
  let current = 0;
  // Allow today to be missing — start from yesterday if today not present.
  if (!days.has(dateKey(today))) {
    cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  }
  while (days.has(dateKey(cursor))) {
    current++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return { current, longest };
}

export function totalVolume(sessions) {
  return sessions.reduce((acc, s) => acc + sessionVolume(s), 0);
}

// Last N days, oldest → newest. Each entry: { date, volume, count, dayLabel, isToday }
export function workoutsByDayLastN(sessions, n = 7) {
  const today = startOfDay(new Date());
  const out = [];
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

// Total volume per ISO-week, oldest → newest. Returns array of { weekStart, volume, count, label }.
function startOfWeek(d) {
  const c = startOfDay(d);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

export function weeklyVolume(sessions, weeks = 4) {
  const today = startOfDay(new Date());
  const thisWeek = startOfWeek(today);
  const out = [];
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

// Compare last 4 weeks of volume vs the prior 4 weeks. Returns
// { current, previous, deltaPercent } where deltaPercent is null if no
// baseline. Positive = trending up.
export function volumeTrend(sessions, windowWeeks = 4) {
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
