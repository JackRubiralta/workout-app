import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

export function useRestTimer() {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const notifIdRef = useRef(null);
  const isRestingRef = useRef(false);

  useEffect(() => { isRestingRef.current = isResting; }, [isResting]);

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Recompute remaining when app returns from background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || !isRestingRef.current || endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval_();
        endTimeRef.current = null;
        notifIdRef.current = null;
        setSecondsLeft(0);
        setIsResting(false);
      } else {
        setSecondsLeft(remaining);
      }
    });
    return () => sub.remove();
  }, [clearInterval_]);

  // Wall-clock-based ticker.
  useEffect(() => {
    if (!isResting) return;
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 1000);
    return clearInterval_;
  }, [isResting, clearInterval_]);

  // Foreground completion.
  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;
    clearInterval_();
    setIsResting(false);
    endTimeRef.current = null;
    notifIdRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [isResting, secondsLeft, clearInterval_]);

  useEffect(() => () => clearInterval_(), [clearInterval_]);

  const startRest = useCallback((duration, exerciseName) => {
    clearInterval_();
    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
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
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endTime),
        channelId: 'workout-timer',
      },
    })
      .then(id => { notifIdRef.current = id; })
      .catch(() => {});
  }, [clearInterval_]);

  const skipRest = useCallback(() => {
    clearInterval_();
    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
    endTimeRef.current = null;
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearInterval_]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
}
