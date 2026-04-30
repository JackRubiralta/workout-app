// Pre-fill + PR + e1RM helpers.
// "Working" entries = non-warmup, non-placeholder, weight or reps > 0.

function isWorking(entry) {
  return !entry.isWarmup && !entry.isPlaceholder && (entry.weight > 0 || entry.reps > 0);
}

// Most recent COMPLETED session's working set for an exercise — the new pre-fill rule.
export function mostRecentWorkingSet(sessions, exerciseName, excludeSessionId = null) {
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

// Two most recent working sets across the most recent completed sessions —
// powers the "last 135×8 · prev 130×8" trend hint.
export function lastTwoWorkingSets(sessions, exerciseName, excludeSessionId = null) {
  const out = [];
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    if (!s.completedAt) continue;
    const lastInSession = [...s.entries].reverse().find(e =>
      e.exerciseName === exerciseName && isWorking(e),
    );
    if (lastInSession) out.push({ entry: lastInSession, session: s });
    if (out.length >= 2) break;
  }
  return out;
}

// Average of the last N working sets for an exercise, used as the default
// pre-fill in the set log sheet. Walks newest-first across all sessions
// (including the current one) until N working sets are collected.
export function averageOfLastN(sessions, exerciseName, n = 5, excludeSessionId = null) {
  const collected = [];
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

// Epley estimated 1-rep max. Labeled "e1RM (Epley)" in UI.
export function epley(weight, reps) {
  if (!weight || !reps || reps < 1) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// All working sets for an exercise across all sessions (newest first).
export function allWorkingSets(sessions, exerciseName) {
  const out = [];
  for (const s of sessions) {
    for (const e of s.entries) {
      if (e.exerciseName === exerciseName && isWorking(e)) out.push({ entry: e, session: s });
    }
  }
  return out;
}

// Top set per session (heaviest weight, with reps as tiebreaker).
export function topSetPerSession(sessions, exerciseName) {
  const out = [];
  for (const s of sessions) {
    let top = null;
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

// Best ever (weight) and best ever (e1RM) across all sessions, optionally
// excluding a session (useful when checking "did THIS new entry beat history").
export function personalRecords(sessions, exerciseName, excludeSessionId = null) {
  let bestWeight = null;
  let bestE1RM = null;
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue;
    for (const e of s.entries) {
      if (e.exerciseName !== exerciseName || !isWorking(e)) continue;
      if (!bestWeight || e.weight > bestWeight.weight ||
          (e.weight === bestWeight.weight && e.reps > bestWeight.reps)) {
        bestWeight = e;
      }
      const er = epley(e.weight, e.reps);
      const erBest = bestE1RM ? epley(bestE1RM.weight, bestE1RM.reps) : 0;
      if (er > erBest) bestE1RM = e;
    }
  }
  return { bestWeight, bestE1RM };
}

// Did this entry just set a PR vs. all PRIOR entries (excluding the same session)?
export function detectPR(sessions, exerciseName, newEntry, sessionId) {
  if (!isWorking(newEntry)) return null;
  const prior = personalRecords(sessions, exerciseName, sessionId);
  const wins = [];
  if (!prior.bestWeight ||
      newEntry.weight > prior.bestWeight.weight ||
      (newEntry.weight === prior.bestWeight.weight && newEntry.reps > prior.bestWeight.reps)) {
    wins.push({ kind: 'weight', prev: prior.bestWeight });
  }
  const newE1RM = epley(newEntry.weight, newEntry.reps);
  const prevE1RM = prior.bestE1RM ? epley(prior.bestE1RM.weight, prior.bestE1RM.reps) : 0;
  if (newE1RM > prevE1RM && newE1RM > 0) {
    wins.push({ kind: 'e1rm', prev: prior.bestE1RM, prevE1RM, newE1RM });
  }
  return wins.length > 0 ? wins : null;
}

export function roundWeight(w) {
  return Math.round(w / 2.5) * 2.5;
}

// Most-frequent exercises across completed sessions. Returns
// [{ name, sessionCount }] descending. Excludes warmups, placeholders, and
// exercises that don't track weight (so e.g. Bike Warmup doesn't dominate).
export function topExercises(sessions, n = 4) {
  const counts = new Map();
  for (const s of sessions) {
    if (s.abandonedAt) continue;
    if (!s.completedAt && !s.entries.some(e => !e.isPlaceholder)) continue;
    const seen = new Set();
    for (const e of s.entries) {
      if (!isWorking(e) || e.isWarmup) continue;
      if (e.weight <= 0) continue; // skip bodyweight or untracked
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
