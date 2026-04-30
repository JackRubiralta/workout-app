import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// Single notification cue. Fires NOTIF_BUFFER_MS past endTime so the
// foreground ticker (which hits 0 at endTime) has a window to cancel
// before iOS delivers it — that prevents the system notification haptic
// from stacking on top of the manual foreground haptic.
const NOTIF_BUFFER_MS = 500;

export function useRestTimer() {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const notifIdsRef = useRef([]);
  const isRestingRef = useRef(false);

  useEffect(() => { isRestingRef.current = isResting; }, [isResting]);

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

  // Recompute remaining when app returns from background and clear any
  // delivered banner.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
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

  // Foreground completion. Cancel the scheduled notification before iOS
  // delivers it, then fire one manual haptic.
  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;
    clearInterval_();
    setIsResting(false);
    endTimeRef.current = null;
    cancelAllNotifs();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [isResting, secondsLeft, clearInterval_, cancelAllNotifs]);

  useEffect(() => () => clearInterval_(), [clearInterval_]);

  const startRest = useCallback((duration, exerciseName) => {
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
        ...(Platform.OS === 'ios' ? {
          interruptionLevel: 'timeSensitive',
        } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endTime + NOTIF_BUFFER_MS),
        channelId: 'workout-timer',
      },
    })
      .then(id => { notifIdsRef.current = [id]; })
      .catch(() => {});
  }, [clearInterval_, cancelAllNotifs]);

  const skipRest = useCallback(() => {
    clearInterval_();
    cancelAllNotifs();
    endTimeRef.current = null;
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearInterval_, cancelAllNotifs]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
}
