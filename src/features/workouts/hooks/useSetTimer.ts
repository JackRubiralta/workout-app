import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

const NOTIF_BUFFER_MS = 500;

type Phase = 'idle' | 'running' | 'finished';

export type UseSetTimerArgs = {
  onComplete?: (elapsedSeconds: number) => void;
  onAutoFinish?: (elapsedSeconds: number) => void;
};

export type UseSetTimer = {
  isRunning: boolean;
  isFinished: boolean;
  secondsLeft: number;
  totalSeconds: number;
  start: (durationSeconds: number, exerciseName?: string) => void;
  stopEarly: () => void;
  acknowledge: () => void;
  cancel: () => void;
};

/**
 * Wall-clock-based countdown for the WORKING SET (e.g. Plank, Bike Warmup).
 * Three-phase machine: idle → running → finished → idle (after acknowledge).
 *
 * `stopEarly()` skips the finished phase and fires onComplete immediately.
 */
export function useSetTimer({ onComplete, onAutoFinish }: UseSetTimerArgs = {}): UseSetTimer {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedAtFinishRef = useRef(0);
  const notifIdRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (phase !== 'running') return;
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 250);
    return clearTick;
  }, [phase, clearTick]);

  useEffect(() => {
    if (phase !== 'running' || secondsLeft > 0) return;
    enterFinished();
  }, [phase, secondsLeft, enterFinished]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
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

  useEffect(
    () => () => {
      clearTick();
      cancelNotif();
    },
    [clearTick, cancelNotif],
  );

  const scheduleFinishNotif = useCallback((endTime: number, exerciseName?: string) => {
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
      .then(id => {
        notifIdRef.current = id;
      })
      .catch(() => {});
  }, []);

  const start = useCallback(
    (duration: number, exerciseName?: string) => {
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
    },
    [clearTick, cancelNotif, scheduleFinishNotif],
  );

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
