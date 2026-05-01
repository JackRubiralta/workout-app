import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Shared scheduling for the "your timer is up" local notification used by
// both the rest-between-sets timer and the working-set countdown timer
// (e.g. Plank, Bike Warmup).
//
// Both timers want the same delivery cue when the app is backgrounded /
// the screen is locked: triple-alert sound, time-sensitive interruption
// level, and the same Android channel. Keeping that here means the set
// timer and the rest timer can never drift apart on tone, sound, or
// scheduling — they both call the same function.

/** Android notification channel id, registered in the root layout. */
const CHANNEL_ID = 'workout-timer';

/**
 * Buffer between the timer's logical zero and when iOS is asked to fire
 * the notification. Gives the foreground ticker a window to dismiss the
 * scheduled notification when the user is already in the app, so the
 * system banner doesn't double up on top of the in-app cue.
 */
const SCHEDULE_BUFFER_MS = 500;

export type WorkoutTimerNotificationContent = {
  /** Foreground bold line — e.g. "Rest Complete" / "Set Done". */
  title: string;
  /** Supporting line — usually mentions the next or current exercise. */
  body: string;
};

export type ScheduleArgs = WorkoutTimerNotificationContent & {
  /** Wall-clock millis at which the timer hits zero. */
  endTime: number;
};

/**
 * Schedule a single timer-end notification. Returns the notification id
 * so callers can later cancel/dismiss it; returns `null` if scheduling
 * fails (e.g. notifications denied) so the caller can no-op cleanly.
 */
export async function scheduleWorkoutTimerNotification({
  endTime,
  title,
  body,
}: ScheduleArgs): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'triple_alert.caf',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endTime + SCHEDULE_BUFFER_MS),
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Cancel a scheduled timer-end notification AND dismiss it if it has
 * already been delivered. Safe to call with `null` (e.g. if scheduling
 * never succeeded) so callers don't need to gate the call themselves.
 */
export function cancelWorkoutTimerNotification(id: string | null): void {
  if (!id) return;
  Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  Notifications.dismissNotificationAsync(id).catch(() => {});
}
