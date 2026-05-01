import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// Same buffer/scheduling pattern as useRestTimer: schedule the local
// notification a hair past endTime so the foreground ticker has a window
// to cancel it before iOS delivers (avoids the system notification haptic
// stacking on top of the manual foreground haptic when both fire).
const NOTIF_BUFFER_MS = 500;

/**
 * Wall-clock-based countdown timer for the WORKING SET (e.g. plank, bike
 * warmup). Three-phase state machine:
 *
 *   idle ──start(d)──▶ running ──hits 0──▶ finished
 *                          │                    │
 *                          ├──stopEarly()──┐    ├──acknowledge()─▶ idle
 *                          │               │    │   (fires onComplete)
 *                          ▼               ▼    │
 *                        idle ◀─cancel()─ idle ◀┘
 *                       (fires onComplete with current elapsed)
 *
 * **Why the finished phase exists:** the user asked that timed exercises
 * NOT auto-jump to rest when the timer hits zero — they want to see
 * "DONE" and press the Done CTA themselves. So natural completion lands
 * in `phase: 'finished'` and waits for `acknowledge()`. `stopEarly()`
 * (user pressed Stop while running) skips the finished phase entirely
 * and fires `onComplete` immediately with the partial elapsed time.
 *
 * Side effects:
 *   • Schedules a single local notification at `endTime + buffer`. The
 *     foreground hit-zero handler cancels it before delivery so it only
 *     surfaces when the app is backgrounded / locked.
 *   • Fires `onAutoFinish(elapsedSeconds)` when the timer naturally
 *     reaches zero — for callers that need to update side UI (e.g. the
 *     Live Activity countdown → "GO" flash) without recording the set.
 *   • Fires `onComplete(elapsedSeconds)` from acknowledge() and
 *     stopEarly() — this is the "save the set" callback.
 *
 * @param {{
 *   onComplete?: (elapsedSeconds:number) => void,
 *   onAutoFinish?: (elapsedSeconds:number) => void,
 * }} [args]
 * @returns {{
 *   isRunning: boolean,
 *   isFinished: boolean,
 *   secondsLeft: number,
 *   totalSeconds: number,
 *   start: (durationSeconds:number) => void,
 *   stopEarly: () => void,
 *   acknowledge: () => void,
 *   cancel: () => void,
 * }}
 */
export function useSetTimer({ onComplete, onAutoFinish } = {}) {
  // 'idle' | 'running' | 'finished'
  const [phase, setPhase] = useState('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const startedAtRef = useRef(null);
  const elapsedAtFinishRef = useRef(0);
  const notifIdRef = useRef(null);
  const phaseRef = useRef(phase);
  const totalRef = useRef(totalSeconds);
  const onCompleteRef = useRef(onComplete);
  const onAutoFinishRef = useRef(onAutoFinish);

  phaseRef.current = phase;
  totalRef.current = totalSeconds;
  onCompleteRef.current = onComplete;
  onAutoFinishRef.current = onAutoFinish;

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelNotif = useCallback(() => {
    const id = notifIdRef.current;
    if (!id) return;
    notifIdRef.current = null;
    Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    Notifications.dismissNotificationAsync(id).catch(() => {});
  }, []);

  const computeElapsed = useCallback(() => {
    const startedAt = startedAtRef.current;
    const total = totalRef.current;
    if (!startedAt) return total;
    return Math.min(total, Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
  }, []);

  const enterFinished = useCallback(() => {
    clearTick();
    cancelNotif();
    const elapsed = totalRef.current;
    elapsedAtFinishRef.current = elapsed;
    endTimeRef.current = null;
    startedAtRef.current = null;
    setSecondsLeft(0);
    setPhase('finished');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onAutoFinishRef.current?.(elapsed);
  }, [clearTick, cancelNotif]);

  // Wall-clock ticker (only while running).
  useEffect(() => {
    if (phase !== 'running') return;
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 250);
    return clearTick;
  }, [phase, clearTick]);

  // Auto-transition to finished when foreground hits zero.
  useEffect(() => {
    if (phase !== 'running' || secondsLeft > 0) return;
    enterFinished();
  }, [phase, secondsLeft, enterFinished]);

  // App-state resync: if backgrounded past endTime, jump straight to finished.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || phaseRef.current !== 'running' || endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        enterFinished();
      } else {
        setSecondsLeft(remaining);
      }
    });
    return () => sub.remove();
  }, [enterFinished]);

  // Belt-and-braces unmount cleanup.
  useEffect(() => () => { clearTick(); cancelNotif(); }, [clearTick, cancelNotif]);

  const scheduleFinishNotif = useCallback((endTime, exerciseName) => {
    const body = exerciseName
      ? `${exerciseName} — tap Done to log this set`
      : 'Set timer finished — tap Done to log';
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Set Done',
        body,
        sound: 'triple_alert.caf',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endTime + NOTIF_BUFFER_MS),
        channelId: 'workout-timer',
      },
    })
      .then(id => { notifIdRef.current = id; })
      .catch(() => {});
  }, []);

  const start = useCallback((duration, exerciseName) => {
    cancelNotif();
    clearTick();
    const now = Date.now();
    const endTime = now + duration * 1000;
    endTimeRef.current = endTime;
    startedAtRef.current = now;
    elapsedAtFinishRef.current = 0;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setPhase('running');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scheduleFinishNotif(endTime, exerciseName);
  }, [clearTick, cancelNotif, scheduleFinishNotif]);

  const stopEarly = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    const elapsed = computeElapsed();
    clearTick();
    cancelNotif();
    endTimeRef.current = null;
    startedAtRef.current = null;
    elapsedAtFinishRef.current = 0;
    setSecondsLeft(0);
    setTotalSeconds(0);
    setPhase('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onCompleteRef.current?.(elapsed);
  }, [clearTick, cancelNotif, computeElapsed]);

  const acknowledge = useCallback(() => {
    if (phaseRef.current !== 'finished') return;
    const elapsed = elapsedAtFinishRef.current;
    elapsedAtFinishRef.current = 0;
    setTotalSeconds(0);
    setPhase('idle');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCompleteRef.current?.(elapsed);
  }, []);

  const cancel = useCallback(() => {
    clearTick();
    cancelNotif();
    endTimeRef.current = null;
    startedAtRef.current = null;
    elapsedAtFinishRef.current = 0;
    setSecondsLeft(0);
    setTotalSeconds(0);
    setPhase('idle');
  }, [clearTick, cancelNotif]);

  return {
    isRunning: phase === 'running',
    isFinished: phase === 'finished',
    secondsLeft,
    totalSeconds,
    start,
    stopEarly,
    acknowledge,
    cancel,
  };
}
