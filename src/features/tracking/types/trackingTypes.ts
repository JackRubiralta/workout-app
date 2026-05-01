// Domain types for the tracking feature (body weight log).

export type BodyWeightUnit = 'lb';

export type BodyWeightEntry = {
  id: string;
  /** Always stored in pounds; UI converts at display + input time. */
  weight: number;
  unit: BodyWeightUnit;
  recordedAt: string;
};

export type BodyWeightState = {
  entries: BodyWeightEntry[];
};
