// ─── Workout Configuration ──────────────────────────────────────────────────
// Change these values to adjust timers, set counts, or labels without touching
// any component logic.

export const REST_SECONDS = 90;
export const SETS_PER_EXERCISE = 3;

// Must have exactly SETS_PER_EXERCISE entries
export const SET_LABELS = ['Warm-up', 'Set 1', 'Set 2'];
export const SET_REPS = ['Light weight, 12–15 reps', '6–10 reps', '6–10 reps'];

// ─── Day Definitions ────────────────────────────────────────────────────────
export const DAYS = [
  {
    day: 1,
    title: 'PUSH',
    focus: 'Chest Focus',
    color: '#FF4757',
    exercises: [
      'Incline DB Bench',
      'Chest Fly',
      'Tricep Extension',
      'Shoulder Press',
      'Lateral Raise',
      'Overhead Tricep',
    ],
  },
  {
    day: 2,
    title: 'PULL',
    focus: 'Lat Focus',
    color: '#3742FA',
    exercises: [
      'Lat Pulldown',
      'Single Arm DB Row',
      'DB Bicep Curl',
      'Chest Supported Row',
      'Cable Face Pull',
      'Hammer Curl',
    ],
  },
  {
    day: 3,
    title: 'LEGS',
    focus: '',
    color: '#2ED573',
    exercises: [
      'DB Squat',
      'Leg Extension',
      'Hamstring Curl',
      'Calf Raise',
      'DB Lunges',
    ],
  },
  {
    day: 4,
    title: 'PUSH',
    focus: 'Shoulder Focus',
    color: '#FFA502',
    exercises: [
      'Shoulder Press',
      'Lateral Raise',
      'Overhead Tricep',
      'Incline DB Bench',
      'Chest Fly',
      'Tricep Extension',
    ],
  },
  {
    day: 5,
    title: 'PULL',
    focus: 'Upper Back Focus',
    color: '#A55EEA',
    exercises: [
      'Bent Over BB Row',
      'Cable Row',
      'Hammer Curl',
      'Pull Ups',
      'Cable Lat Row',
      'Bayesian Curls',
    ],
  },
];
