// Payloads shared between the iOS Live Activity widget and the JS
// service that drives it.

export type LiveActivityStartArgs = {
  dayTitle: string;
  exerciseName: string;
  totalSets: number;
  exSetNum?: number;
  exSetTotal?: number;
};

export type LiveActivityUpdateArgs = {
  dayTitle?: string;
  exerciseName: string;
  /** SET LABEL ("WARM-UP" / "SET 2") — accepted for compatibility. */
  setLabel?: string;
  secondsRemaining: number;
  setsCompleted: number;
  totalSets: number;
  isResting: boolean;
  timerDone?: boolean;
  exSetNum?: number;
  exSetTotal?: number;
};

export type WorkoutActivityProps = {
  dayTitle?: string;
  exerciseName?: string;
  restEndTime?: number;
  setsCompleted?: number;
  totalSets?: number;
  isResting?: boolean;
  timerDone?: boolean;
  exSetNum?: number;
  exSetTotal?: number;
};
