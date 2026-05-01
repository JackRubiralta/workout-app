import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

const NOTIF_BUFFER_MS = 500;

export type UseRestTimer = {
  isResting: boolean;
  secondsLeft: number;
  totalSeconds: number;
  startRest: (durationSeconds: number, exerciseName?: string) => void;
  skipRest: () => void;
};

/**
 * Wall-clock-based rest timer with iOS local-notification fallback so the
 * "rest complete" cue still fires when the phone is locked / app
 * backgrounded. Only one rest timer is active at a time per app instance.
 */
export function useRestTimer(): UseRestTimer {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const notifIdsRef = useRef<string[]>([]);
  const isRestingRef = useRef(false);

  useEffect(() => {
    isRestingRef.current = isResting;
  }, [isResting]);

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelAllNotifs = useCallback(() => {
    const ids = notifIdsRef.current;
    notifIdsRef.current = [];
    if (!ids.length) return;
    for (const id of ids) {
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      Notifications.dismissNotificationAsync(id).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active' || !isRestingRef.current || endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval_();
        endTimeRef.current = null;
        cancelAllNotifs();
        setSecondsLeft(0);
        setIsResting(false);
      } else {
        setSecondsLeft(remaining);
      }
    });
    return () => sub.remove();
  }, [clearInterval_, cancelAllNotifs]);

  useEffect(() => {
    if (!isResting) return;
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 1000);
    return clearInterval_;
  }, [isResting, clearInterval_]);

  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;
    clearInterval_();
    setIsResting(false);
    endTimeRef.current = null;
    cancelAllNotifs();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [isResting, secondsLeft, clearInterval_, cancelAllNotifs]);

  useEffect(() => () => clearInterval_(), [clearInterval_]);

  const startRest = useCallback(
    (duration: number, exerciseName?: string) => {
      clearInterval_();
      cancelAllNotifs();

      const endTime = Date.now() + duration * 1000;
      endTimeRef.current = endTime;
      setTotalSeconds(duration);
      setSecondsLeft(duration);
      setIsResting(true);

      const body = exerciseName ? `Time for ${exerciseName}` : 'Time to get back to it';

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest Complete',
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
          notifIdsRef.current = [id];
        })
        .catch(() => {});
    },
    [clearInterval_, cancelAllNotifs],
  );

  const skipRest = useCallback(() => {
    clearInterval_();
    cancelAllNotifs();
    endTimeRef.current = null;
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearInterval_, cancelAllNotifs]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
}
