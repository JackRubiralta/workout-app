import { useState, useEffect, useRef, useCallback } from 'react';
<<<<<<< HEAD
import * as Haptics from 'expo-haptics';
import { REST_SECONDS } from '../constants/workout';
=======
import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
>>>>>>> 1f5a396 (s)

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRestTimer() {
  const [isResting, setIsResting] = useState(false);
<<<<<<< HEAD
  const [secondsLeft, setSecondsLeft] = useState(REST_SECONDS);
=======
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0); // stored so CircularTimer arc is correct
>>>>>>> 1f5a396 (s)
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

<<<<<<< HEAD
  // Start countdown interval whenever isResting becomes true
  useEffect(() => {
    if (!isResting) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);

    return clearTimer;
  }, [isResting, clearTimer]);

  // Detect natural completion (secondsLeft hits 0 while resting)
  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;

    // Countdown finished — fire haptics and end rest
    clearTimer();
    setIsResting(false);

    // Two-tap haptic pattern: notification burst + heavy impact
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const t = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 150);

    return () => clearTimeout(t);
  }, [isResting, secondsLeft, clearTimer]);

  // Clean up on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  const startRest = useCallback(() => {
    clearTimer();
    setSecondsLeft(REST_SECONDS);
=======
  useEffect(() => {
    if (!isResting) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return clearTimer;
  }, [isResting, clearTimer]);

  useEffect(() => {
    if (!isResting || secondsLeft > 0) return;
    clearTimer();
    setIsResting(false);
    // Alarm pattern: 3 strong pulses (wait, buzz, pause, buzz, pause, buzz)
    Vibration.vibrate([0, 450, 120, 450, 120, 450]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [isResting, secondsLeft, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Call startRest with the exercise's specific rest duration
  const startRest = useCallback((duration) => {
    Vibration.cancel();
    clearTimer();
    setTotalSeconds(duration);
    setSecondsLeft(duration);
>>>>>>> 1f5a396 (s)
    setIsResting(true);
  }, [clearTimer]);

  const skipRest = useCallback(() => {
<<<<<<< HEAD
    clearTimer();
    setIsResting(false);
    setSecondsLeft(REST_SECONDS);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearTimer]);

  return { isResting, secondsLeft, startRest, skipRest };
=======
    Vibration.cancel();
    clearTimer();
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearTimer]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
>>>>>>> 1f5a396 (s)
}
