import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';

// Wall-clock-based countdown timer for the WORKING SET (e.g. plank, bike warmup).
// Distinct from useRestTimer: this fires onComplete callback so caller can
// auto-mark the set done with the actual elapsed time.

export function useSetTimer({ onComplete } = {}) {
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const startedAtRef = useRef(null);
  const isRunningRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Resync on app foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || !isRunningRef.current || endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        completeNow(true);
      } else {
        setSecondsLeft(remaining);
      }
    });
    return () => sub.remove();
  }, []);

  // Wall-clock ticker.
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    }, 250);
    return clearTick;
  }, [isRunning, clearTick]);

  // Auto-complete when foreground hits 0.
  useEffect(() => {
    if (!isRunning || secondsLeft > 0) return;
    completeNow(true);
  }, [isRunning, secondsLeft]);

  useEffect(() => () => clearTick(), [clearTick]);

  function completeNow(autoFired) {
    clearTick();
    const startedAt = startedAtRef.current;
    const total = totalSeconds;
    const elapsed = startedAt
      ? Math.min(total, Math.max(0, Math.round((Date.now() - startedAt) / 1000)))
      : total;
    endTimeRef.current = null;
    startedAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(0);
    if (autoFired) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onCompleteRef.current?.(elapsed);
  }

  const start = useCallback((duration) => {
    clearTick();
    const now = Date.now();
    endTimeRef.current = now + duration * 1000;
    startedAtRef.current = now;
    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setIsRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [clearTick]);

  const stopEarly = useCallback(() => {
    if (!isRunningRef.current) return;
    completeNow(false);
  }, []);

  const cancel = useCallback(() => {
    clearTick();
    endTimeRef.current = null;
    startedAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(0);
  }, [clearTick]);

  return { isRunning, secondsLeft, totalSeconds, start, stopEarly, cancel };
}
