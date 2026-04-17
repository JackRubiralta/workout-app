import { Platform } from 'react-native';
import { createLiveActivity } from 'expo-widgets';
import WorkoutActivity from '../widgets/workoutActivity';

const isSupported = Platform.OS === 'ios';

// The factory knows how to start new instances of our Live Activity type.
// It's created once at module level — multiple calls to `start()` are fine.
let factory = null;
try {
  if (isSupported) {
    factory = createLiveActivity('WorkoutActivity', WorkoutActivity);
  }
} catch {
  // expo-widgets native module not available (e.g. Expo Go)
}

/** Currently active Live Activity instance (if any). */
let current = null;

/**
 * Start a Live Activity for the current workout.
 * Displays on the lock screen and Dynamic Island.
 */
export async function startLiveActivity({ dayTitle, dayColor, exerciseName, setLabel, totalSets }) {
  if (!factory) return;
  try {
    // End any existing activity first
    await endLiveActivity();
    current = factory.start({
      dayTitle,
      dayColor,
      exerciseName,
      setLabel,
      restEndTime: 0,
      setsCompleted: 0,
      totalSets,
      isResting: false,
    });
  } catch {
    current = null;
  }
}

/**
 * Update the Live Activity with current workout state.
 *
 * For the timer we pass `restEndTime` (wall-clock epoch ms) so the
 * widget's Text[timerInterval] counts down natively — no need to
 * push an update every second.
 */
export async function updateLiveActivity({ exerciseName, setLabel, secondsRemaining, totalSeconds, setsCompleted, totalSets, isResting }) {
  if (!current) return;
  try {
    const restEndTime = isResting ? Date.now() + secondsRemaining * 1000 : 0;
    await current.update({
      dayTitle: '', // unchanged — widget keeps last non-empty value
      exerciseName,
      setLabel,
      restEndTime,
      setsCompleted,
      totalSets,
      isResting,
    });
  } catch {
    // Activity may have been dismissed by the user
    current = null;
  }
}

/**
 * End the Live Activity.
 */
export async function endLiveActivity() {
  if (!current) return;
  try {
    await current.end('immediate');
  } catch {
    // Already ended
  }
  current = null;
}
