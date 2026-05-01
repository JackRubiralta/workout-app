import { useCallback, useEffect, useRef } from 'react';
import {
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
} from '../services/liveActivityService';
import { exerciseTotalSets } from '../constants/exerciseDefaults';
import type {
  DayTemplate,
  ExerciseTemplate,
  SetPosition,
  WorkoutSession,
} from '../types/workoutTypes';

export type UseLiveActivityArgs = {
  day: DayTemplate | null | undefined;
  session: WorkoutSession | null | undefined;
  isResting: boolean;
  isDayDone: boolean;
  currentPos: SetPosition | null;
};

export type UseLiveActivity = {
  onSetDone: (
    ex: ExerciseTemplate,
    exIndex: number,
    setIndex: number,
    restSeconds: number,
    setLabel: string,
    doneCount: number,
  ) => void;
  onSetTimerStart: (
    ex: ExerciseTemplate,
    exIndex: number,
    setIndex: number,
    durationSeconds: number,
    doneCount: number,
  ) => void;
  onSetTimerFinish: (
    ex: ExerciseTemplate,
    exIndex: number,
    setIndex: number,
    doneCount: number,
  ) => void;
  onSkipRest: () => void;
  onEnd: () => void;
};

/**
 * Wraps every iOS Live Activity / Dynamic Island call used during an
 * active session. Auto-starts on first render and exposes imperative
 * commands the screen calls when the user advances state.
 */
export function useLiveActivity({
  day,
  session,
  isResting,
  isDayDone,
  currentPos,
}: UseLiveActivityArgs): UseLiveActivity {
  const started = useRef(false);
  const prevResting = useRef(false);

  useEffect(() => {
    if (!day || !session || started.current) return;
    started.current = true;
    const firstEx = day.exercises[0];
    const total = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
    startLiveActivity({
      dayTitle: day.title,
      exerciseName: firstEx?.name ?? '',
      totalSets: total,
      exSetNum: 1,
      exSetTotal: firstEx ? exerciseTotalSets(firstEx) : 1,
    });
  }, [day, session]);

  useEffect(() => {
    if (!day || !session) return;
    const wasResting = prevResting.current;
    prevResting.current = isResting;
    if (!wasResting || isResting || isDayDone || !currentPos) return;

    const nextEx = day.exercises[currentPos.e];
    const total = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
    const done = session.entries.length;

    updateLiveActivity({
      dayTitle: day.title,
      exerciseName: nextEx?.name ?? '',
      secondsRemaining: 0,
      setsCompleted: done,
      totalSets: total,
      isResting: true,
      timerDone: true,
      exSetNum: currentPos.s + 1,
      exSetTotal: nextEx ? exerciseTotalSets(nextEx) : 1,
    });
    const t = setTimeout(() => {
      updateLiveActivity({
        dayTitle: day.title,
        exerciseName: nextEx?.name ?? '',
        secondsRemaining: 0,
        setsCompleted: done,
        totalSets: total,
        isResting: false,
        timerDone: false,
        exSetNum: currentPos.s + 1,
        exSetTotal: nextEx ? exerciseTotalSets(nextEx) : 1,
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [isResting, day, session, currentPos, isDayDone]);

  const onSetDone = useCallback<UseLiveActivity['onSetDone']>(
    (ex, _exIndex, setIndex, restDuration, setLabel, doneCount) => {
      if (!day) return;
      const total = day.exercises.reduce((acc, e) => acc + exerciseTotalSets(e), 0);
      updateLiveActivity({
        dayTitle: day.title,
        exerciseName: ex.name,
        setLabel,
        secondsRemaining: restDuration,
        setsCompleted: doneCount,
        totalSets: total,
        isResting: true,
        exSetNum: setIndex + 1,
        exSetTotal: exerciseTotalSets(ex),
      });
    },
    [day],
  );

  const onSetTimerStart = useCallback<UseLiveActivity['onSetTimerStart']>(
    (ex, _exIndex, setIndex, durationSeconds, doneCount) => {
      if (!day) return;
      const total = day.exercises.reduce((acc, e) => acc + exerciseTotalSets(e), 0);
      updateLiveActivity({
        dayTitle: day.title,
        exerciseName: ex.name,
        secondsRemaining: durationSeconds,
        setsCompleted: doneCount,
        totalSets: total,
        isResting: true,
        timerDone: false,
        exSetNum: setIndex + 1,
        exSetTotal: exerciseTotalSets(ex),
      });
    },
    [day],
  );

  const onSetTimerFinish = useCallback<UseLiveActivity['onSetTimerFinish']>(
    (ex, _exIndex, setIndex, doneCount) => {
      if (!day) return;
      const total = day.exercises.reduce((acc, e) => acc + exerciseTotalSets(e), 0);
      updateLiveActivity({
        dayTitle: day.title,
        exerciseName: ex.name,
        secondsRemaining: 0,
        setsCompleted: doneCount,
        totalSets: total,
        isResting: true,
        timerDone: true,
        exSetNum: setIndex + 1,
        exSetTotal: exerciseTotalSets(ex),
      });
    },
    [day],
  );

  const onSkipRest = useCallback(() => {
    if (!day || !currentPos) return;
    const nextEx = day.exercises[currentPos.e];
    const total = day.exercises.reduce((acc, e) => acc + exerciseTotalSets(e), 0);
    updateLiveActivity({
      dayTitle: day.title,
      exerciseName: nextEx?.name ?? '',
      secondsRemaining: 0,
      setsCompleted: session?.entries.length ?? 0,
      totalSets: total,
      isResting: false,
      exSetNum: currentPos.s + 1,
      exSetTotal: nextEx ? exerciseTotalSets(nextEx) : 1,
    });
  }, [day, currentPos, session]);

  const onEnd = useCallback(() => {
    void endLiveActivity();
  }, []);

  return { onSetDone, onSetTimerStart, onSetTimerFinish, onSkipRest, onEnd };
}
