// iOS Live Activity / Dynamic Island bridge for the workout-rest timer.
//
// `expo-widgets` is iOS-only AND requires a custom dev client — it isn't
// part of Expo Go, isn't available on web/Android, and ITS IMPORT throws a
// native-module error if the dev client wasn't built with it. We
// lazy-require so any failure cleanly disables Live Activities without
// crashing the JS bundle. On unsupported platforms the API is a no-op.

import { Platform } from 'react-native';
import type {
  LiveActivityStartArgs,
  LiveActivityUpdateArgs,
} from '../types/liveActivityTypes';

const isSupported = Platform.OS === 'ios';

type ActivityInstance = {
  end: (mode: 'immediate') => Promise<void>;
  update: (payload: Record<string, unknown>) => Promise<void>;
};

type ActivityFactory = {
  getInstances: () => ActivityInstance[];
  start: (payload: Record<string, unknown>) => ActivityInstance;
};

let factory: ActivityFactory | null = null;
if (isSupported) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const widgetsModule = require('expo-widgets') as {
      createLiveActivity: (
        name: string,
        component: unknown,
      ) => ActivityFactory;
    };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WorkoutActivity = require('../widgets/workoutActivity').default;
    factory = widgetsModule.createLiveActivity('WorkoutActivity', WorkoutActivity);
  } catch {
    // expo-widgets native module not present (Expo Go / web / dev without it)
  }
}

let current: ActivityInstance | null = null;
let cachedDayTitle = '';

async function endAllExisting(): Promise<void> {
  if (!factory) return;
  try {
    const instances = factory.getInstances();
    for (const inst of instances) {
      try {
        await inst.end('immediate');
      } catch {
        /* swallow */
      }
    }
  } catch {
    /* swallow */
  }
  current = null;
}

export async function startLiveActivity({
  dayTitle,
  exerciseName,
  totalSets,
  exSetNum,
  exSetTotal,
}: LiveActivityStartArgs): Promise<void> {
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

export async function updateLiveActivity({
  dayTitle,
  exerciseName,
  secondsRemaining,
  setsCompleted,
  totalSets,
  isResting,
  timerDone,
  exSetNum,
  exSetTotal,
}: LiveActivityUpdateArgs): Promise<void> {
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

export async function endLiveActivity(): Promise<void> {
  await endAllExisting();
}
