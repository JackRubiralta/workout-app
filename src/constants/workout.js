// ─── Workout Configuration ──────────────────────────────────────────────────
// Change these values to adjust timers, set counts, or labels without touching
// any component logic.

export const REST_SECONDS = 90;
export const SETS_PER_EXERCISE = 3;

// Must have exactly SETS_PER_EXERCISE entries
export const SET_LABELS = ['Warm-up', 'Set 1', 'Set 2'];
export const SET_REPS = ['Light weight, 12–15 reps', '6–10 reps', '6–10 reps'];

// ─── Day Definitions ────────────────────────────────────────────────────────
export const EXERCISE_REST_SECONDS = 150;

// Small helper so each exercise row stays readable. Any field not passed
// falls back to the defaults defined in src/utils/exercise.js.
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
}) {
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

// Standard 5 min bike warmup — present on every training day
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

export const DAYS = [
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
        reps: '8–10 reps',
      }),
      ex({
        name: 'Incline DB Bench Press',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 180,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Chest Dips (lean forward)',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 150,
        reps: '8–12 reps',
        tracksWeight: false,
      }),
      ex({
        name: 'Dumbbell Flyes',
        sets: 2,
        restSeconds: 90, nextRestSeconds: 120,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Lateral Raises',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 120,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Rope Pushdowns',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 120,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Bar Pushdowns',
        sets: 2,
        restSeconds: 60,
        reps: '12–15 reps',
      }),
    ],
  },
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
        sets: 3,
        restSeconds: 150, nextRestSeconds: 180,
        reps: 'AMRAP (5–10)',
        tracksWeight: false,
      }),
      ex({
        name: 'Lat Pulldowns',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 150,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Pull-Ups (neutral grip)',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 150,
        reps: 'AMRAP',
        tracksWeight: false,
      }),
      ex({
        name: 'Cable Rows (wide, lat-focused)',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 150,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Preacher Curls',
        sets: 3,
        restSeconds: 90, nextRestSeconds: 120,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Hammer Curls',
        sets: 2,
        restSeconds: 75,
        reps: '10–12 reps',
      }),
    ],
  },
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
        sets: 2,
        restSeconds: 90, nextRestSeconds: 60,
        reps: '8–12 reps',
        tracksWeight: false,
      }),
      ex({
        name: 'Plank',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '60 sec hold',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 60,
      }),
      ex({
        name: 'Dead Bug',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '10 per side',
        tracksWeight: false,
      }),
      ex({
        name: 'Russian Twists (weighted)',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '20 total',
      }),
      ex({
        name: 'Hollow Body Hold',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 90,
        reps: '30 sec hold',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 30,
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
        name: 'Downward Dog to Cobra',
        sets: 1,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '6 flow reps',
        tracksWeight: false, tracksReps: false,
      }),
      ex({
        name: "Child's Pose",
        sets: 1,
        restSeconds: 30, nextRestSeconds: 30,
        reps: '45 sec hold',
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
        name: 'Doorway Chest Stretch',
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
        reps: '8–10 reps',
      }),
      ex({
        name: 'Incline DB Bench Press',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 180,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Lateral Raises',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 120,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Cable Lateral Raises',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 120,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Rear Delt Flyes',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 120,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Front Raises',
        sets: 2,
        restSeconds: 60, nextRestSeconds: 120,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Close-Grip Push-Ups',
        sets: 2,
        restSeconds: 60,
        reps: 'AMRAP',
        tracksWeight: false,
      }),
    ],
  },
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
        reps: '8–10 reps',
      }),
      ex({
        name: 'Cable Rows (close neutral)',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 180,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Preacher Rows',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 150,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Lat Pulldowns',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 150,
        reps: '10–12 reps',
      }),
      ex({
        name: 'Rear Delt Flyes',
        sets: 2,
        restSeconds: 75, nextRestSeconds: 120,
        reps: '12–15 reps',
      }),
      ex({
        name: 'Bar Curls',
        sets: 3,
        restSeconds: 90, nextRestSeconds: 120,
        reps: '8–10 reps',
      }),
      ex({
        name: 'Hammer Curls',
        sets: 2,
        restSeconds: 75,
        reps: '10–12 reps',
      }),
    ],
  },
];
