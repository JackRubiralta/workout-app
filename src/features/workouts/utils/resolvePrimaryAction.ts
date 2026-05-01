import { formatDuration } from '@/shared/utils/format';
import type { ExerciseTemplate } from '../types/workoutTypes';
import type { SessionPrimaryAction } from '../components/SessionFooter';

export type PrimaryActionHandlers = {
  onComplete: () => void;
  onSkipRest: () => void;
  onAcknowledgeSetTimer: () => void;
  onStopSetTimer: () => void;
  onStartSetTimer: () => void;
  onDone: () => void;
};

export type ResolvePrimaryActionArgs = {
  isDayDone: boolean;
  isResting: boolean;
  setTimerFinished: boolean;
  setTimerRunning: boolean;
  isTimed: boolean;
  currentEx: ExerciseTemplate | null;
  handlers: PrimaryActionHandlers;
};

/**
 * Picks the primary CTA based on which mode the active session is in.
 * Returning a {label, onPress, variant} keeps the screen JSX tidy.
 *
 * Order matters — "set timer finished" wins over "running" because the
 * timer transitions running → finished on natural completion.
 */
export function resolvePrimaryAction({
  isDayDone,
  isResting,
  setTimerFinished,
  setTimerRunning,
  isTimed,
  currentEx,
  handlers,
}: ResolvePrimaryActionArgs): SessionPrimaryAction {
  if (isDayDone) return { label: 'Back to Days', onPress: handlers.onComplete, variant: 'filled' };
  if (isResting) return { label: 'Skip Rest', onPress: handlers.onSkipRest, variant: 'outline' };
  if (setTimerFinished) {
    return { label: 'Done', onPress: handlers.onAcknowledgeSetTimer, variant: 'filled' };
  }
  if (setTimerRunning) {
    return { label: 'Stop & Save', onPress: handlers.onStopSetTimer, variant: 'outline' };
  }
  if (isTimed && currentEx) {
    return {
      label: `Start ${formatDuration(currentEx.durationSeconds)}`,
      onPress: handlers.onStartSetTimer,
      variant: 'filled',
    };
  }
  return { label: 'Done', onPress: handlers.onDone, variant: 'filled' };
}
