import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@workout_log_v1';
const MAX_SESSIONS = 200;

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createSession(day, dayIndex) {
  return {
    id: generateId(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    dayTitle: day.title,
    dayFocus: day.focus ?? '',
    dayColor: day.color,
    dayIndex,
    entries: [],
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useWorkoutLog() {
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const activeSessionRef = useRef(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setSessions(parsed.sessions ?? []);
          } catch { /* keep empty */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Persist every change
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions })).catch(() => {});
    }
  }, [sessions, loaded]);

  // Start a new workout session
  const startSession = useCallback((day, dayIndex) => {
    const session = createSession(day, dayIndex);
    activeSessionRef.current = session.id;
    setSessions(prev => [session, ...prev].slice(0, MAX_SESSIONS));
    return session.id;
  }, []);

  // Log a completed set to the active session
  const logSet = useCallback(({ exerciseName, exerciseIndex, setIndex, setLabel, isWarmup, weight, unit, reps, toFailure }) => {
    const sessionId = activeSessionRef.current;
    if (!sessionId) return;

    const entry = {
      exerciseName,
      exerciseIndex,
      setIndex,
      setLabel,
      isWarmup,
      weight: weight ?? 0,
      unit: unit ?? 'lb',
      reps: reps ?? 0,
      toFailure: toFailure ?? false,
      timestamp: new Date().toISOString(),
    };

    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, entries: [...s.entries, entry] };
    }));
  }, []);

  // Mark the active session as complete
  const completeSession = useCallback(() => {
    const sessionId = activeSessionRef.current;
    if (!sessionId) return;

    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return { ...s, completedAt: new Date().toISOString() };
    }));
    activeSessionRef.current = null;
  }, []);

  // End session without marking complete (e.g. user backs out)
  const abandonSession = useCallback(() => {
    const sessionId = activeSessionRef.current;
    if (!sessionId) return;
    // Keep the session with whatever entries were logged
    activeSessionRef.current = null;
  }, []);

  // Get the average weight from the last 3 entries for an exercise
  const getLastWeight = useCallback((exerciseName) => {
    const weights = [];
    for (const session of sessions) {
      for (let i = session.entries.length - 1; i >= 0; i--) {
        const entry = session.entries[i];
        if (entry.exerciseName === exerciseName && !entry.isWarmup && entry.weight > 0) {
          weights.push({ weight: entry.weight, unit: entry.unit });
          if (weights.length >= 3) break;
        }
      }
      if (weights.length >= 3) break;
    }
    if (weights.length === 0) return null;
    const avg = weights.reduce((sum, w) => sum + w.weight, 0) / weights.length;
    return { weight: Math.round(avg / 2.5) * 2.5, unit: weights[0].unit };
  }, [sessions]);

  // Get the average reps from the last 3 entries for an exercise
  const getLastReps = useCallback((exerciseName) => {
    const reps = [];
    for (const session of sessions) {
      for (let i = session.entries.length - 1; i >= 0; i--) {
        const entry = session.entries[i];
        if (entry.exerciseName === exerciseName && !entry.isWarmup && entry.reps > 0) {
          reps.push(entry.reps);
          if (reps.length >= 3) break;
        }
      }
      if (reps.length >= 3) break;
    }
    if (reps.length === 0) return null;
    return Math.round(reps.reduce((sum, r) => sum + r, 0) / reps.length);
  }, [sessions]);

  // Delete a session
  const deleteSession = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setSessions([]);
    activeSessionRef.current = null;
  }, []);

  const activeSessionId = activeSessionRef.current;

  return {
    sessions,
    loaded,
    activeSessionId,
    startSession,
    logSet,
    completeSession,
    abandonSession,
    getLastWeight,
    getLastReps,
    deleteSession,
    clearHistory,
  };
}
