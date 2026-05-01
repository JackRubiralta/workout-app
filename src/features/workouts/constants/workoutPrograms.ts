// 5-day Push / Pull / Core / Push / Pull seed program. Big block of
// data; comments inline explain the programming rationale so the
// thinking survives even if someone re-tunes a number.
//
// Programming principles applied below:
//
// • Compound first when the CNS is fresh — heaviest lift drives the most
//   stimulus, so a press/row leads every lifting day.
// • One warmup-set on the lead compound only — subsequent lifts use the
//   prior compound as a "warmup" for the same plane of motion.
// • 6–10 reps for primary compounds, 8–12 for secondary, 10–15 for
//   isolation. Mid-range hypertrophy is dose–response with volume.
// • Rest 150–180s on heavy compounds (full force output), 90–120s on
//   secondary compounds, 60–75s on isolation (metabolic stress).
// • Each muscle hit 2× per week. Weekly direct sets land in the 10–18
//   range across the program (Schoenfeld meta-analysis sweet spot).
// • Total session ≈ 40 minutes (5 min bike + ~35 min lifting).

import type { DayTemplate, ExerciseTemplate } from '../types/workoutTypes';
import { EXERCISE_REST_SECONDS } from './workoutConstants';

type ExerciseInput = Partial<ExerciseTemplate> & { name: string };

function ex({
  name,
  sets = 3,
  warmup = false,
  restSeconds = 120,
  nextRestSeconds = null,
  reps = '6–10 reps',
  warmupReps = 'Light weight, 12–15 reps',
  tracksWeight = true,
  tracksReps = true,
  tracksTime = false,
  durationSeconds = 60,
}: ExerciseInput): ExerciseTemplate {
  return {
    name,
    sets,
    warmup,
    restSeconds,
    nextRestSeconds,
    reps,
    warmupReps,
    tracksWeight,
    tracksReps,
    tracksTime,
    durationSeconds,
  };
}

const bikeWarmup = ex({
  name: 'Bike Warmup',
  sets: 1,
  restSeconds: 30,
  nextRestSeconds: 30,
  reps: '5 min easy pace',
  tracksWeight: false,
  tracksReps: false,
  tracksTime: true,
  durationSeconds: 300,
});

export const DAYS: DayTemplate[] = [
  // Day 1 — PUSH (chest-led).
  {
    day: 1,
    title: 'PUSH',
    focus: 'Chest Focus',
    color: '#FF4757',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      ex({
        name: 'Flat DB Bench Press',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: '6–10 reps',
      }),
      ex({
        name: 'Incline DB Bench Press',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 120,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Chest Dips (lean forward)',
        sets: 2,
        restSeconds: 90, nextRestSeconds: 90,
        reps: '8–12 reps',
        tracksWeight: false,
      }),
      ex({
        name: 'Dumbbell Flyes',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Rope Pushdowns',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 60,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Lateral Raises',
        sets: 3,
        restSeconds: 60,
        reps: '12–15 reps',
      }),
    ],
  },

  // Day 2 — PULL (lat-led).
  {
    day: 2,
    title: 'PULL',
    focus: 'Lat Focus',
    color: '#3742FA',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      ex({
        name: 'Pull-Ups (overhand, wide)',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: 'AMRAP (5–10)',
        tracksWeight: false,
        warmupReps: '3–5 easy reps',
      }),
      ex({
        name: 'Lat Pulldowns',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 120,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Cable Rows (wide, lat-focused)',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 90,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Pull-Ups (neutral grip)',
        sets: 2,
        restSeconds: 90, nextRestSeconds: 90,
        reps: 'AMRAP',
        tracksWeight: false,
      }),
      ex({
        name: 'Preacher Curls',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 60,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Hammer Curls',
        sets: 2,
        restSeconds: 60,
        reps: '10–12 reps',
      }),
    ],
  },

  // Day 3 — CORE + MOBILITY.
  {
    day: 3,
    title: 'CORE + MOBILITY',
    focus: 'Recovery',
    color: '#2ED573',
    exerciseRestSeconds: 60,
    exercises: [
      bikeWarmup,
      ex({
        name: 'Hanging Leg Raises',
        sets: 3,
        restSeconds: 90, nextRestSeconds: 75,
        reps: '8–12 reps',
        tracksWeight: false,
      }),
      ex({
        name: 'Russian Twists (weighted)',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '20 total',
      }),
      ex({
        name: 'Plank',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '60 sec hold',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 60,
      }),
      ex({
        name: 'Hollow Body Hold',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '30 sec hold',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 30,
      }),
      ex({
        name: 'Dead Bug',
        sets: 2,
        restSeconds: 45, nextRestSeconds: 45,
        reps: '10 per side',
        tracksWeight: false,
      }),
      ex({
        name: 'Cat-Cow',
        sets: 1,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '10 slow reps',
        tracksWeight: false, tracksReps: false,
      }),
      ex({
        name: 'Thoracic Spine Rotations',
        sets: 1,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '8 per side',
        tracksWeight: false, tracksReps: false,
      }),
      ex({
        name: 'Band Shoulder Dislocations',
        sets: 2,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '10 reps',
        tracksWeight: false, tracksReps: false,
      }),
      ex({
        name: 'Doorway Chest Stretch',
        sets: 1,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '45 sec per side',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 45,
      }),
      ex({
        name: 'Pigeon Pose',
        sets: 1,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '45 sec per side',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 45,
      }),
      ex({
        name: 'Standing Hamstring + Hip Flexor',
        sets: 1,
        restSeconds: 30,
        reps: '45 sec per side',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 45,
      }),
    ],
  },

  // Day 4 — PUSH (shoulder-led).
  {
    day: 4,
    title: 'PUSH',
    focus: 'Shoulder Focus',
    color: '#FFA502',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      ex({
        name: 'Seated DB Shoulder Press',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: '6–10 reps',
      }),
      ex({
        name: 'Lateral Raises',
        sets: 4,
        restSeconds: 75, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Cable Lateral Raises',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Rear Delt Flyes',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Incline DB Bench Press',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 90,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Bar Pushdowns',
        sets: 3,
        restSeconds: 60,
        reps: '10–12 reps',
      }),
    ],
  },

  // Day 5 — PULL (upper-back-led).
  {
    day: 5,
    title: 'PULL',
    focus: 'Upper Back Focus',
    color: '#A55EEA',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      ex({
        name: 'Chest-Supported Rows',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: '6–10 reps',
      }),
      ex({
        name: 'Cable Rows (close neutral)',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 120,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Lat Pulldowns',
        sets: 3,
        restSeconds: 90, nextRestSeconds: 90,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Rear Delt Flyes',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Bar Curls',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 60,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Hammer Curls',
        sets: 2,
        restSeconds: 60,
        reps: '10–12 reps',
      }),
    ],
  },
];
