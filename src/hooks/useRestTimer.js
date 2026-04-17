import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRestTimer() {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef   = useRef(null);
  const endTimeRef    = useRef(null);   // wall-clock ms when rest ends
  const notifIdRef    = useRef(null);   // scheduled notification id
  const isRestingRef  = useRef(false);  // mirror for AppState handler (avoids stale closure)

  // Keep isRestingRef in sync with state
  useEffect(() => { isRestingRef.current = isResting; }, [isResting]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── AppState: recalculate when app returns from background ─────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || !isRestingRef.current || endTimeRef.current === null) return;

      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

      if (remaining <= 0) {
        // Timer finished while we were in the background.
        // The scheduled notification already handled the alert — just update state.
        clearTimer();
        endTimeRef.current = null;
        notifIdRef.current = null;
        setSecondsLeft(0);
        setIsResting(false);
      } else {
        // Snap display to correct remaining time (JS interval may have drifted)
        setSecondsLeft(remaining);
      }
    });

    return () => sub.remove();
  }, [clearTimer]);

  // ── Interval: wall-clock based so it's always accurate ────────────────────
  useEffect(() => {
    if (!isResting) return;

    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 1000);

    return clearTimer;
  }, [isResting, clearTimer]);

  // ── Timer complete in foreground ───────────────────────────────────────────
  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;

    clearTimer();
    setIsResting(false);
    endTimeRef.current = null;

    // Let the scheduled notification fire (shows banner via live activity + notification)
    notifIdRef.current = null;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [isResting, secondsLeft, clearTimer]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const startRest = useCallback((duration, exerciseName) => {
    clearTimer();

    // Cancel any leftover notification from previous rest
    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }

    const endTime = Date.now() + duration * 1000;
    endTimeRef.current = endTime;

    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsResting(true);

    // Schedule background notification — fires even if you switch apps or lock screen
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
      .then((id) => { notifIdRef.current = id; })
      .catch(() => {});
  }, [clearTimer]);

  const skipRest = useCallback(() => {
    clearTimer();

    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }

    endTimeRef.current = null;
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearTimer]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
}
