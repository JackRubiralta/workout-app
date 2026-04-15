import { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRestTimer() {
  const [isResting, setIsResting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0); // stored so CircularTimer arc is correct
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
    setIsResting(true);
  }, [clearTimer]);

  const skipRest = useCallback(() => {
    Vibration.cancel();
    clearTimer();
    setIsResting(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [clearTimer]);

  return { isResting, secondsLeft, totalSeconds, startRest, skipRest };
}
