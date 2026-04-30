import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

// Three-vibration cue. Each delivered iOS notification triggers a fixed
// ~0.4s haptic; we space them 1000ms apart so iOS doesn't coalesce. We
// only schedule them when the app actually goes to background — if the
// user keeps the app open, the foreground haptic burst handles the cue
// and we avoid the system notification haptic stacking on top of it.
const VIBE_GAP_MS = 1000;
const VIBE_COUNT = 3;

export function useRestTimer() {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const notifIdsRef = useRef([]);
  const exerciseNameRef = useRef(null);
  const isRestingRef = useRef(false);
  // Generation token so in-flight schedule promises that resolve after a
  // cancel can detect they're stale and cancel themselves.
  const scheduleGenRef = useRef(0);

  useEffect(() => { isRestingRef.current = isResting; }, [isResting]);

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelAllNotifs = useCallback(() => {
    scheduleGenRef.current++;
    const ids = notifIdsRef.current;
    notifIdsRef.current = [];
    if (!ids.length) return;
    for (const id of ids) {
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      Notifications.dismissNotificationAsync(id).catch(() => {});
    }
  }, []);

  const scheduleNotifs = useCallback(() => {
    if (!endTimeRef.current) return;
    const myGen = ++scheduleGenRef.current;
    const body = exerciseNameRef.current
      ? `Time for ${exerciseNameRef.current}`
      : 'Time to get back to it';

    for (let i = 0; i < VIBE_COUNT; i++) {
      const fireAt = endTimeRef.current + i * VIBE_GAP_MS;
      if (fireAt <= Date.now()) continue;
      const isFirst = i === 0;
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest Complete',
          body: isFirst ? body : ' ',
          sound: isFirst ? 'triple_alert.caf' : 'beep_short.caf',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'ios' ? {
            interruptionLevel: 'timeSensitive',
            threadIdentifier: 'workout-rest',
          } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
          channelId: 'workout-timer',
        },
      })
        .then(id => {
          if (scheduleGenRef.current !== myGen) {
            Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
            return;
          }
          notifIdsRef.current = [...notifIdsRef.current, id];
        })
        .catch(() => {});
    }
  }, []);

  // AppState transitions: schedule notifications only while backgrounded.
  // Foreground end-of-rest is handled by manual haptics — mixing them
  // with system notification haptics produced the overlapping "weird"
  // feel the user reported.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        cancelAllNotifs();
        if (!isRestingRef.current || endTimeRef.current === null) return;
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval_();
          endTimeRef.current = null;
          setSecondsLeft(0);
          setIsResting(false);
        } else {
          setSecondsLeft(remaining);
        }
      } else if (isRestingRef.current && endTimeRef.current !== null) {
        scheduleNotifs();
      }
    });
    return () => sub.remove();
  }, [clearInterval_, cancelAllNotifs, scheduleNotifs]);

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

  // Foreground completion — manual haptic burst, no system notifications
  // involved (none were scheduled, since the app stayed foreground).
  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;
    clearInterval_();
    setIsResting(false);
    endTimeRef.current = null;
    cancelAllNotifs();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), VIBE_GAP_MS);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), VIBE_GAP_MS * 2);
  }, [isResting, secondsLeft, clearInterval_, cancelAllNotifs]);

  useEffect(() => () => clearInterval_(), [clearInterval_]);

  const startRest = useCallback((duration, exerciseName) => {
    clearInterval_();
    cancelAllNotifs();

    const endTime = Date.now() + duration * 1000;
    endTimeRef.current = endTime;
    exerciseNameRef.current = exerciseName ?? null;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsResting(true);
    // Notifications get scheduled when AppState transitions to background.
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
