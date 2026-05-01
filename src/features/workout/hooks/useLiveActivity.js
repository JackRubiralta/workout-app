import { useCallback, useEffect, useRef } from 'react';
import { startLiveActivity, updateLiveActivity, endLiveActivity } from '../../../modules/liveActivity';
import { exerciseTotalSets } from '../../../utils/exercise';

/**
 * Wraps every iOS Live Activity / Dynamic Island call used during an
 * active session. Auto-starts on first render and exposes imperative
 * commands the screen calls when the user advances state.
 *
 * @param {object} args
 * @param {object} args.day
 * @param {object} args.session
 * @param {boolean} args.isResting
 * @param {boolean} args.isDayDone
 * @param {{ e:number, s:number }|null} args.currentPos
 * @returns {{
 *   onSetDone: (ex:object, exIndex:number, setIndex:number, restSeconds:number, setLabel:string, doneCount:number) => void,
 *   onSkipRest: () => void,
 *   onEnd: () => void,
 * }}
 */
export function useLiveActivity({ day, session, isResting, isDayDone, currentPos }) {
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

  // Flash "GO / log set" when rest finishes, then settle to READY 5 s later.
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

  const onSetDone = useCallback((ex, exIndex, setIndex, restDuration, setLabel, doneCount) => {
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
  }, [day]);

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

  const onEnd = useCallback(() => endLiveActivity(), []);

  return { onSetDone, onSkipRest, onEnd };
}
