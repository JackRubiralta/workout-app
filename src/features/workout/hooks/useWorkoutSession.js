import { useCallback, useMemo, useRef } from 'react';
import { KEYS } from '../../../storage/keys';
import { usePersistedState } from '../../../storage/usePersistedState';
import { activeSessionForDay } from '../logic/progress';
import { MAX_SESSIONS } from '../../../constants/workout';
import { makeId } from '../../../utils/ids';

const INITIAL = { sessions: [], activeSessionId: null };

// If the stored activeSessionId points to a session that no longer exists
// (e.g. the user wiped history out from under it), drop it so the active-
// session screen never tries to render against a ghost id.
function hydrate(stored) {
  const sessions = stored.sessions ?? [];
  const activeSessionId = stored.activeSessionId
    && sessions.some(s => s.id === stored.activeSessionId)
    ? stored.activeSessionId
    : null;
  return { sessions, activeSessionId };
}

/**
 * Single source of truth for the active workout session + completed history.
 * State shape: `{ sessions: Session[], activeSessionId: string|null }`.
 * Newest sessions live at index 0; older ones evicted past `MAX_SESSIONS`.
 *
 * @returns {{
 *   loaded: boolean,
 *   sessions: Array<object>,
 *   activeSession: object|null,
 *   activeSessionId: string|null,
 *   startSession: (day:object, dayIndex:number) => string,
 *   resumeSession: (sessionId:string) => void,
 *   pauseSession: () => void,
 *   completeSession: (sessionId?:string) => void,
 *   abandonSession: () => void,
 *   markSetDone: (entry:object) => void,
 *   recordSetValues: (entry:object) => void,
 *   skipExercise: (day:object, exIndex:number) => void,
 *   pushUndo: (action:object) => void,
 *   popUndo: () => object|null,
 *   deleteSession: (sessionId:string) => void,
 *   clearHistory: () => void,
 * }}
 */
export function useWorkoutSession() {
  const [state, setState, loaded] = usePersistedState(KEYS.sessions, INITIAL, hydrate);

  const stateRef = useRef(state);
  stateRef.current = state;

  const sessions = state.sessions;
  const activeSessionId = state.activeSessionId;
  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  // Start a new session. If an active in-progress one exists for this day,
  // caller must explicitly call abandonSession or resumeSession first.
  const startSession = useCallback((day, dayIndex) => {
    const session = {
      id: makeId('s'),
      startedAt: new Date().toISOString(),
      completedAt: null,
      abandonedAt: null,
      dayIndex,
      dayTitle: day.title,
      dayFocus: day.focus ?? '',
      dayColor: day.color,
      entries: [],
      undoStack: [],
    };
    setState(prev => ({
      sessions: [session, ...prev.sessions].slice(0, MAX_SESSIONS),
      activeSessionId: session.id,
    }));
    return session.id;
  }, []);

  const resumeSession = useCallback((sessionId) => {
    setState(prev => ({ ...prev, activeSessionId: sessionId }));
  }, []);

  const completeSession = useCallback(() => {
    const id = stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s =>
        s.id === id ? { ...s, completedAt: new Date().toISOString() } : s,
      ),
      activeSessionId: null,
    }));
  }, []);

  // User left without finishing — keep the session, mark abandoned.
  const abandonSession = useCallback((sessionId) => {
    const id = sessionId ?? stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s =>
        s.id === id ? { ...s, abandonedAt: new Date().toISOString() } : s,
      ),
      activeSessionId: prev.activeSessionId === id ? null : prev.activeSessionId,
    }));
  }, []);

  // Just leave the screen, keep the session in-progress (no flag) — same as
  // navigating away with state preserved.
  const pauseSession = useCallback(() => {
    setState(prev => ({ ...prev, activeSessionId: null }));
  }, []);

  // Finish session early: marks completedAt with whatever was logged. The
  // remaining sets stay unlogged. Useful when the user wants to end the
  // workout but not throw away what they did. `sessionId` is optional —
  // falls back to the currently-active session if omitted, so this works
  // both from inside the active session and from pre-start (where the
  // active session isn't yet "active" via activeSessionId).
  const finishSession = useCallback((sessionId) => {
    const id = sessionId ?? stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s =>
        s.id === id ? { ...s, completedAt: new Date().toISOString() } : s,
      ),
      activeSessionId: prev.activeSessionId === id ? null : prev.activeSessionId,
    }));
  }, []);

  // Skip the current exercise: mark all of its sets done with empty entries
  // so the workout advances to the next exercise without forcing the user to
  // press Done on each set.
  const skipExercise = useCallback((day, exerciseIndex) => {
    const id = stateRef.current.activeSessionId;
    if (!id || !day) return;
    const ex = day.exercises[exerciseIndex];
    if (!ex) return;
    const total = (ex.warmup ? 1 : 0) + (ex.sets ?? 3);

    setState(prev => ({
      sessions: prev.sessions.map(s => {
        if (s.id !== id) return s;
        const existing = new Set(
          s.entries
            .filter(e => e.exerciseIndex === exerciseIndex)
            .map(e => e.setIndex),
        );
        const additions = [];
        for (let si = 0; si < total; si++) {
          if (existing.has(si)) continue;
          const isWarmup = ex.warmup && si === 0;
          additions.push({
            exerciseIndex,
            setIndex: si,
            exerciseName: ex.name,
            setLabel: isWarmup ? 'Warm-up' : `Set ${ex.warmup ? si : si + 1}`,
            isWarmup,
            weight: 0,
            unit: 'lb',
            reps: 0,
            toFailure: false,
            restSeconds: ex.restSeconds ?? null,
            timestamp: new Date().toISOString(),
            isPlaceholder: true,
            isSkipped: true,
          });
        }
        return { ...s, entries: [...s.entries, ...additions] };
      }),
      activeSessionId: prev.activeSessionId,
    }));
  }, []);

  // ── Set logging ───────────────────────────────────────────────────────────

  // Mark a set done with a placeholder entry; SetLogSheet will replace it
  // when the user saves, or it stays as a 0 if the exercise doesn't track
  // weight/reps.
  const markSetDone = useCallback(({ exerciseIndex, setIndex, exerciseName, setLabel, isWarmup, restSeconds }) => {
    const id = stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s => {
        if (s.id !== id) return s;
        // Strip any existing entry for this slot (idempotent re-press)
        const entries = s.entries.filter(e =>
          !(e.exerciseIndex === exerciseIndex && e.setIndex === setIndex),
        );
        entries.push({
          exerciseIndex,
          setIndex,
          exerciseName,
          setLabel,
          isWarmup,
          weight: 0,
          unit: 'lb',
          reps: 0,
          toFailure: false,
          restSeconds: restSeconds ?? null,
          timestamp: new Date().toISOString(),
          isPlaceholder: true,
        });
        return {
          ...s,
          entries,
          undoStack: [...s.undoStack, { type: 'done', exerciseIndex, setIndex, restSeconds: restSeconds ?? null }],
        };
      }),
      activeSessionId: prev.activeSessionId,
    }));
  }, []);

  const unmarkSetDone = useCallback((exerciseIndex, setIndex) => {
    const id = stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          entries: s.entries.filter(e =>
            !(e.exerciseIndex === exerciseIndex && e.setIndex === setIndex),
          ),
        };
      }),
      activeSessionId: prev.activeSessionId,
    }));
  }, []);

  // Save the user's logged values; replaces the placeholder for that slot.
  const recordSetValues = useCallback(({ exerciseIndex, setIndex, weight, reps, toFailure, unit, timeSeconds }) => {
    const id = stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          entries: s.entries.map(e => {
            if (e.exerciseIndex !== exerciseIndex || e.setIndex !== setIndex) return e;
            return {
              ...e,
              weight: weight ?? 0,
              reps: reps ?? 0,
              toFailure: !!toFailure,
              unit: unit ?? e.unit ?? 'lb',
              timeSeconds: timeSeconds ?? e.timeSeconds ?? null,
              isPlaceholder: false,
              timestamp: new Date().toISOString(),
            };
          }),
        };
      }),
      activeSessionId: prev.activeSessionId,
    }));
  }, []);

  const popUndo = useCallback(() => {
    const id = stateRef.current.activeSessionId;
    if (!id) return null;
    let popped = null;
    setState(prev => ({
      sessions: prev.sessions.map(s => {
        if (s.id !== id) return s;
        if (s.undoStack.length === 0) return s;
        popped = s.undoStack[s.undoStack.length - 1];
        const undoStack = s.undoStack.slice(0, -1);
        let entries = s.entries;
        if (popped.type === 'done') {
          entries = entries.filter(e =>
            !(e.exerciseIndex === popped.exerciseIndex && e.setIndex === popped.setIndex),
          );
        }
        return { ...s, entries, undoStack };
      }),
      activeSessionId: prev.activeSessionId,
    }));
    return popped;
  }, []);

  const pushUndo = useCallback((action) => {
    const id = stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s =>
        s.id === id ? { ...s, undoStack: [...s.undoStack, action] } : s,
      ),
      activeSessionId: prev.activeSessionId,
    }));
  }, []);

  // ── Maintenance ───────────────────────────────────────────────────────────

  const deleteSession = useCallback((sessionId) => {
    setState(prev => ({
      sessions: prev.sessions.filter(s => s.id !== sessionId),
      activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState({ sessions: [], activeSessionId: null });
  }, []);

  const getActiveForDay = useCallback(
    (dayIndex) => activeSessionForDay(sessions, dayIndex),
    [sessions],
  );

  return {
    loaded,
    sessions,
    activeSession,
    activeSessionId,
    startSession,
    resumeSession,
    completeSession,
    abandonSession,
    pauseSession,
    finishSession,
    skipExercise,
    markSetDone,
    unmarkSetDone,
    recordSetValues,
    pushUndo,
    popUndo,
    deleteSession,
    clearHistory,
    getActiveForDay,
  };
}
