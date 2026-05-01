import { useCallback, useMemo, useRef } from 'react';
import { KEYS } from '@/storage/keys';
import { usePersistedState } from '@/storage/usePersistedState';
import { activeSessionForDay } from '../utils/progressUtils';
import { MAX_SESSIONS } from '../constants/workoutConstants';
import { makeId } from '@/shared/utils/ids';
import type {
  DayTemplate,
  SetEntry,
  UndoAction,
  WorkoutSession,
  WorkoutSessionsState,
} from '../types/workoutTypes';

const INITIAL: WorkoutSessionsState = { sessions: [], activeSessionId: null };

// If the stored activeSessionId points to a session that no longer exists
// (e.g. the user wiped history out from under it), drop it so the active-
// session screen never tries to render against a ghost id.
function hydrate(stored: unknown): WorkoutSessionsState {
  const s = (stored ?? {}) as Partial<WorkoutSessionsState>;
  const sessions = s.sessions ?? [];
  const activeSessionId =
    s.activeSessionId && sessions.some(x => x.id === s.activeSessionId)
      ? s.activeSessionId
      : null;
  return { sessions, activeSessionId };
}

type MarkSetDoneArgs = {
  exerciseIndex: number;
  setIndex: number;
  exerciseName: string;
  setLabel: string;
  isWarmup: boolean;
  restSeconds: number | null;
};

type RecordSetValuesArgs = {
  exerciseIndex: number;
  setIndex: number;
  weight?: number;
  reps?: number;
  toFailure?: boolean;
  unit?: SetEntry['unit'];
  timeSeconds?: number;
};

export type UseWorkoutSession = {
  loaded: boolean;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  activeSessionId: string | null;
  startSession: (day: DayTemplate, dayIndex: number) => string;
  resumeSession: (sessionId: string) => void;
  pauseSession: () => void;
  completeSession: () => void;
  finishSession: (sessionId?: string) => void;
  abandonSession: (sessionId?: string) => void;
  skipExercise: (day: DayTemplate, exIndex: number) => void;
  markSetDone: (args: MarkSetDoneArgs) => void;
  unmarkSetDone: (exerciseIndex: number, setIndex: number) => void;
  recordSetValues: (args: RecordSetValuesArgs) => void;
  pushUndo: (action: UndoAction) => void;
  popUndo: () => UndoAction | null;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
  getActiveForDay: (dayIndex: number) => WorkoutSession | null;
};

export function useWorkoutSession(): UseWorkoutSession {
  const [state, setState, loaded] = usePersistedState<WorkoutSessionsState>(
    KEYS.sessions,
    INITIAL,
    hydrate,
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const sessions = state.sessions;
  const activeSessionId = state.activeSessionId;
  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  const startSession = useCallback(
    (day: DayTemplate, dayIndex: number) => {
      const session: WorkoutSession = {
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
    },
    [setState],
  );

  const resumeSession = useCallback(
    (sessionId: string) => {
      setState(prev => ({ ...prev, activeSessionId: sessionId }));
    },
    [setState],
  );

  const completeSession = useCallback(() => {
    const id = stateRef.current.activeSessionId;
    if (!id) return;
    setState(prev => ({
      sessions: prev.sessions.map(s =>
        s.id === id ? { ...s, completedAt: new Date().toISOString() } : s,
      ),
      activeSessionId: null,
    }));
  }, [setState]);

  const abandonSession = useCallback(
    (sessionId?: string) => {
      const id = sessionId ?? stateRef.current.activeSessionId;
      if (!id) return;
      setState(prev => ({
        sessions: prev.sessions.map(s =>
          s.id === id ? { ...s, abandonedAt: new Date().toISOString() } : s,
        ),
        activeSessionId: prev.activeSessionId === id ? null : prev.activeSessionId,
      }));
    },
    [setState],
  );

  const pauseSession = useCallback(() => {
    setState(prev => ({ ...prev, activeSessionId: null }));
  }, [setState]);

  const finishSession = useCallback(
    (sessionId?: string) => {
      const id = sessionId ?? stateRef.current.activeSessionId;
      if (!id) return;
      setState(prev => ({
        sessions: prev.sessions.map(s =>
          s.id === id ? { ...s, completedAt: new Date().toISOString() } : s,
        ),
        activeSessionId: prev.activeSessionId === id ? null : prev.activeSessionId,
      }));
    },
    [setState],
  );

  const skipExercise = useCallback(
    (day: DayTemplate, exerciseIndex: number) => {
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
          const additions: SetEntry[] = [];
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
    },
    [setState],
  );

  // ── Set logging ───────────────────────────────────────────────────────────

  const markSetDone = useCallback(
    ({
      exerciseIndex,
      setIndex,
      exerciseName,
      setLabel,
      isWarmup,
      restSeconds,
    }: MarkSetDoneArgs) => {
      const id = stateRef.current.activeSessionId;
      if (!id) return;
      setState(prev => ({
        sessions: prev.sessions.map(s => {
          if (s.id !== id) return s;
          const entries = s.entries.filter(
            e => !(e.exerciseIndex === exerciseIndex && e.setIndex === setIndex),
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
            undoStack: [
              ...s.undoStack,
              { type: 'done', exerciseIndex, setIndex, restSeconds: restSeconds ?? null },
            ],
          };
        }),
        activeSessionId: prev.activeSessionId,
      }));
    },
    [setState],
  );

  const unmarkSetDone = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      const id = stateRef.current.activeSessionId;
      if (!id) return;
      setState(prev => ({
        sessions: prev.sessions.map(s => {
          if (s.id !== id) return s;
          return {
            ...s,
            entries: s.entries.filter(
              e => !(e.exerciseIndex === exerciseIndex && e.setIndex === setIndex),
            ),
          };
        }),
        activeSessionId: prev.activeSessionId,
      }));
    },
    [setState],
  );

  const recordSetValues = useCallback(
    ({
      exerciseIndex,
      setIndex,
      weight,
      reps,
      toFailure,
      unit,
      timeSeconds,
    }: RecordSetValuesArgs) => {
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
    },
    [setState],
  );

  const popUndo = useCallback((): UndoAction | null => {
    const id = stateRef.current.activeSessionId;
    if (!id) return null;
    let popped: UndoAction | null = null;
    setState(prev => ({
      sessions: prev.sessions.map(s => {
        if (s.id !== id) return s;
        if (s.undoStack.length === 0) return s;
        const last = s.undoStack[s.undoStack.length - 1];
        popped = last;
        const undoStack = s.undoStack.slice(0, -1);
        let entries = s.entries;
        if (last.type === 'done') {
          const exIdx = last.exerciseIndex;
          const setIdx = last.setIndex;
          entries = entries.filter(e => !(e.exerciseIndex === exIdx && e.setIndex === setIdx));
        }
        return { ...s, entries, undoStack };
      }),
      activeSessionId: prev.activeSessionId,
    }));
    return popped;
  }, [setState]);

  const pushUndo = useCallback(
    (action: UndoAction) => {
      const id = stateRef.current.activeSessionId;
      if (!id) return;
      setState(prev => ({
        sessions: prev.sessions.map(s =>
          s.id === id ? { ...s, undoStack: [...s.undoStack, action] } : s,
        ),
        activeSessionId: prev.activeSessionId,
      }));
    },
    [setState],
  );

  // ── Maintenance ───────────────────────────────────────────────────────────

  const deleteSession = useCallback(
    (sessionId: string) => {
      setState(prev => ({
        sessions: prev.sessions.filter(s => s.id !== sessionId),
        activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId,
      }));
    },
    [setState],
  );

  const clearHistory = useCallback(() => {
    setState({ sessions: [], activeSessionId: null });
  }, [setState]);

  const getActiveForDay = useCallback(
    (dayIndex: number) => activeSessionForDay(sessions, dayIndex),
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
