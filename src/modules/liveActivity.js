import { Platform } from 'react-native';
import { createLiveActivity } from 'expo-widgets';
import WorkoutActivity from '../widgets/workoutActivity';

const isSupported = Platform.OS === 'ios';

let factory = null;
try {
  if (isSupported) {
    factory = createLiveActivity('WorkoutActivity', WorkoutActivity);
  }
} catch {
  // expo-widgets native module not available (e.g. Expo Go)
}

let current = null;
let cachedDayTitle = '';

/** End ALL existing live activities — ensures only one at a time. */
async function endAllExisting() {
  if (!factory) return;
  try {
    const instances = factory.getInstances();
    for (const inst of instances) {
      try { await inst.end('immediate'); } catch {}
    }
  } catch {}
  current = null;
}

/**
 * Start a Live Activity for the current workout.
 */
export async function startLiveActivity({ dayTitle, exerciseName, totalSets, exSetNum, exSetTotal }) {
  if (!factory) return;
  try {
    await endAllExisting();
    cachedDayTitle = dayTitle;
    current = factory.start({
      dayTitle,
      exerciseName,
      restEndTime: 0,
      setsCompleted: 0,
      totalSets,
      isResting: false,
      timerDone: false,
      exSetNum: exSetNum || 1,
      exSetTotal: exSetTotal || 1,
    });
  } catch {
    current = null;
  }
}

/**
 * Update the Live Activity with current workout state.
 */
export async function updateLiveActivity({ dayTitle, exerciseName, secondsRemaining, setsCompleted, totalSets, isResting, timerDone, exSetNum, exSetTotal }) {
  if (!current) return;
  try {
    const restEndTime = isResting && !timerDone ? Date.now() + secondsRemaining * 1000 : 0;
    await current.update({
      dayTitle: dayTitle || cachedDayTitle,
      exerciseName,
      restEndTime,
      setsCompleted,
      totalSets,
      isResting,
      timerDone: timerDone || false,
      exSetNum: exSetNum || 1,
      exSetTotal: exSetTotal || 1,
    });
  } catch {
    current = null;
  }
}

/**
 * End the Live Activity.
 */
export async function endLiveActivity() {
  await endAllExisting();
}
