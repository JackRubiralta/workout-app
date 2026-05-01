import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  cancelWorkoutTimerNotification,
  scheduleWorkoutTimerNotification,
} from '../services/workoutTimerNotifications';

export type UseRestTimer = {
  isResting: boolean;
  secondsLeft: number;
  totalSeconds: number;
  startRest: (durationSeconds: number, exerciseName?: string) => void;
  skipRest: () => void;
};

/**
 * Wall-clock-based rest timer with a local-notification fallback so the
 * "rest complete" cue still fires when the phone is locked / the app is
 * backgrounded. Only one rest timer is active at a time per app instance.
 *
 * Scheduling/dismissing the notification goes through
 * `workoutTimerNotifications` so the rest timer and the working-set timer
 * stay in lockstep on sound, interruption level, and timing.
 */
export function useRestTimer(): UseRestTimer {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const notifIdRef = useRef<string | null>(null);
  const isRestingRef = useRef(false);

  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const dismissNotif = useCallback(() => {
    const id = notifIdRef.current;
    notifIdRef.current = null;
    cancelWorkoutTimerNotification(id);
  }, []);

  // Recompute remaining when the app returns from background; bail to
  // idle if the timer has already ticked past zero while we were away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active' || !isRestingRef.current || endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearTick();
        endTimeRef.current = null;
        dismissNotif();
        setSecondsLeft(0);
        setIsResting(false);
      } else {
        setSecondsLeft(remaining);
      }
    });
    return () => sub.remove();
  }, [clearTick, dismissNotif]);

  // Wall-clock-based ticker.
  useEffect(() => {
    if (!isResting) return;
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 1000);
    return clearTick;
  }, [isResting, clearTick]);

  // Foreground completion. Cancel the scheduled notification before iOS
  // delivers it, then fire one manual haptic.
  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;
    clearTick();
    setIsResting(false);
    endTimeRef.current = null;
    dismissNotif();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [isResting, secondsLeft, clearTick, dismissNotif]);

  useEffect(() => () => clearTick(), [clearTick]);

  const startRest = useCallback(
    (duration: number, exerciseName?: string) => {
      clearTick();
      dismissNotif();

      const endTime = Date.now() + duration * 1000;
      endTimeRef.current = endTime;
      setTotalSeconds(duration);
      setSecondsLeft(duration);
      setIsResting(true);

      void scheduleWorkoutTimerNotification({
        endTime,
        title: 'Rest Complete',
        body: exerciseName ? `Time for ${exerciseName}` : 'Time to get back to it',
      }).then(id => {
        notifIdRef.current = id;
      });
    },
    [clearTick, dismissNotif],
  );

  const skipRest = useCallback(() => {
    clearTick();
    dismissNotif();
    endTimeRef.current = null;
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearTick, dismissNotif]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
}
