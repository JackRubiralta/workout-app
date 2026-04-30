// ─── Workout Configuration ──────────────────────────────────────────────────
// Change these values to adjust timers, set counts, or labels without touching
// any component logic.

export const REST_SECONDS = 90;
export const SETS_PER_EXERCISE = 3;

// Must have exactly SETS_PER_EXERCISE entries
export const SET_LABELS = ['Warm-up', 'Set 1', 'Set 2'];
export const SET_REPS = ['Light weight, 12–15 reps', '6–10 reps', '6–10 reps'];

// ─── Day Definitions ────────────────────────────────────────────────────────
//
// Programming principles applied below (5-day Push / Pull / Core / Push / Pull):
//
// • Compound first when the CNS is fresh — heaviest lift drives the most
//   stimulus, so a press/row leads every lifting day.
// • One warmup-set on the lead compound only — subsequent lifts use the
//   prior compound as a "warmup" for the same plane of motion. Saves time.
// • 6–10 reps for primary compounds, 8–12 for secondary, 10–15 for
//   isolation. Mid-range hypertrophy is dose–response with volume, so we
//   stack working sets in the 6–15 zone.
// • Rest 150–180s on heavy compounds (full force output), 90–120s on
//   secondary compounds, 60–75s on isolation (metabolic stress, less
//   neural cost).
// • Each muscle hit 2× per week. Weekly direct sets land in the 10–18
//   range across the program (Schoenfeld meta-analysis sweet spot).
// • Lateral / rear delt and arms get more sets because they're small
//   and recover fast — they tolerate higher frequency/volume.
// • Total session ≈ 40 minutes (5 min bike + ~35 min lifting). Trimmed
//   any exercise that didn't earn its place inside that budget.
//
// Weekly direct-set counts after this redesign:
//   Chest: 14    Lats: 14    Mid back: 9    Bicep: 10
//   Med delt: 10    Front delt: 5+ pressing    Rear delt: 6
//   Tricep: 6 + pressing carryover    Core: 14
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
  // Day 1 — PUSH (chest-led). Heavy horizontal/incline pressing for the
  // bulk of the chest, then dips for the lower-chest stretch, flyes to
  // finish the chest with a stretched-position isolation, then triceps
  // and a small dose of lateral delts. ~40 min.
  {
    day: 1,
    title: 'PUSH',
    focus: 'Chest Focus',
    color: '#FF4757',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      // Lead compound: dumbbell flat bench wins over barbell here
      // because of the deeper stretch at the bottom (better hypertrophy)
      // and lower shoulder strain. 6–10 reps to build strength while
      // staying in the hypertrophy zone.
      ex({
        name: 'Flat DB Bench Press',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: '6–10 reps',
      }),
      // Incline targets the upper chest (clavicular pec), the hardest
      // chest region to grow and what builds the "shelf" look. Keep it
      // second, still heavy but slightly higher rep.
      ex({
        name: 'Incline DB Bench Press',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 120,
        reps: '8–10 reps',
      }),
      // Dips lean-forward = lower / sternal chest. Bodyweight compound
      // that lets you push hard without re-loading dumbbells. 2 sets is
      // enough by this point in the workout — chest is already cooked.
      ex({
        name: 'Chest Dips (lean forward)',
        sets: 2,
        restSeconds: 90, nextRestSeconds: 90,
        reps: '8–12 reps',
        tracksWeight: false,
      }),
      // Stretched-position isolation. Flyes finish the chest in the
      // most growth-stimulating mechanical position (long muscle length).
      // Light weight, controlled, full ROM.
      ex({
        name: 'Dumbbell Flyes',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      // Tricep main lift. Cables give constant tension across the full
      // range. Done after chest is fully fatigued so triceps aren't a
      // limiting factor on the pressing work above.
      ex({
        name: 'Rope Pushdowns',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 60,
        reps: '10–12 reps',
      }),
      // Side-delt finisher. 3 sets here + 7 sets on Day 4 = 10 weekly
      // sets for medial delt, the main driver of shoulder width.
      ex({
        name: 'Lateral Raises',
        sets: 3,
        restSeconds: 60,
        reps: '12–15 reps',
      }),
    ],
  },

  // Day 2 — PULL (lat-led). Vertical pulling first for lat width, then
  // a horizontal pull, a second vertical-pull variation for back-angle
  // variety, then biceps. ~40 min.
  {
    day: 2,
    title: 'PULL',
    focus: 'Lat Focus',
    color: '#3742FA',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      // Lead compound: wide-grip pull-up is the king of lat-width work.
      // Done first while you're strongest — AMRAP with low-rep ranges
      // because BW pull-ups are inherently hard. Warmup set lets you
      // dial in form / activation.
      ex({
        name: 'Pull-Ups (overhand, wide)',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: 'AMRAP (5–10)',
        tracksWeight: false,
        warmupReps: '3–5 easy reps',
      }),
      // Lat pulldown is the loadable version of the pull-up. Keep
      // pulling vertical to milk lat-width stimulus while you still
      // have something in the tank.
      ex({
        name: 'Lat Pulldowns',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 120,
        reps: '10–12 reps',
      }),
      // Horizontal pull, but with wide grip + lats-bias cue (elbows
      // wide, drive through elbows not hands). Different vector, same
      // muscle group.
      ex({
        name: 'Cable Rows (wide, lat-focused)',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 90,
        reps: '10–12 reps',
      }),
      // Neutral-grip pull-up: longer head of the bicep gets more work,
      // lats hit at a slightly different angle. 2 sets is enough here
      // — lats are toast.
      ex({
        name: 'Pull-Ups (neutral grip)',
        sets: 2,
        restSeconds: 90, nextRestSeconds: 90,
        reps: 'AMRAP',
        tracksWeight: false,
      }),
      // Bicep main lift. Preacher fixes the upper arm so you can't
      // cheat with body english — pure stretched-position work for the
      // short head.
      ex({
        name: 'Preacher Curls',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 60,
        reps: '8–10 reps',
      }),
      // Brachialis + brachioradialis. Adds arm thickness from a
      // different angle than supinated curls.
      ex({
        name: 'Hammer Curls',
        sets: 2,
        restSeconds: 60,
        reps: '10–12 reps',
      }),
    ],
  },

  // Day 3 — CORE + MOBILITY. Recovery / "deload-ish" middle of the
  // week. Anti-extension (plank, dead-bug, hollow), rotational
  // (russian twist), and dynamic core (leg raises). Then a focused
  // shoulder + hip mobility flow to undo desk-posture damage and
  // prep the next two lifting days. ~40 min.
  {
    day: 3,
    title: 'CORE + MOBILITY',
    focus: 'Recovery',
    color: '#2ED573',
    exerciseRestSeconds: 60,
    exercises: [
      bikeWarmup,
      // Best dynamic core movement available — hits lower abs and hip
      // flexors hard in a long ROM.
      ex({
        name: 'Hanging Leg Raises',
        sets: 3,
        restSeconds: 90, nextRestSeconds: 75,
        reps: '8–12 reps',
        tracksWeight: false,
      }),
      // Rotational / oblique work. Holding a plate adds load.
      ex({
        name: 'Russian Twists (weighted)',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '20 total',
      }),
      // Anti-extension. Foundational core stability, transfers to
      // every standing lift you do.
      ex({
        name: 'Plank',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '60 sec hold',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 60,
      }),
      // Full-body tension — gymnast staple, integrates the whole core
      // chain rather than isolating it.
      ex({
        name: 'Hollow Body Hold',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 60,
        reps: '30 sec hold',
        tracksWeight: false, tracksReps: false,
        tracksTime: true, durationSeconds: 30,
      }),
      // Anti-extension while moving limbs — trains the core's real-life
      // job (resist motion, don't generate it).
      ex({
        name: 'Dead Bug',
        sets: 2,
        restSeconds: 45, nextRestSeconds: 45,
        reps: '10 per side',
        tracksWeight: false,
      }),
      // ── Mobility block ──
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

  // Day 4 — PUSH (shoulder-led). Heavy overhead press first for
  // anterior + medial delt and tricep, then high-volume lateral-raise
  // work (the focus muscle), rear delts, then a small dose of incline
  // bench for chest frequency. ~40 min.
  {
    day: 4,
    title: 'PUSH',
    focus: 'Shoulder Focus',
    color: '#FFA502',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      // Lead compound. Seated DB > standing because no leg-drive
      // cheating, full ROM at the bottom. 6–10 to build pressing
      // strength.
      ex({
        name: 'Seated DB Shoulder Press',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: '6–10 reps',
      }),
      // Side-delt main work. 4 sets is high volume on purpose — the
      // medial delt is small, recovers fast, and is the visual driver
      // of shoulder width. Higher reps so we don't compete with the
      // pressing strength work above.
      ex({
        name: 'Lateral Raises',
        sets: 4,
        restSeconds: 75, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      // Second wave of medial delt with constant cable tension
      // (different stimulus profile than DB, which loses tension at
      // the bottom). Done after free-weight laterals so cable variety
      // hits when stabilizers are pre-fatigued.
      ex({
        name: 'Cable Lateral Raises',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      // Rear delts get neglected by every other day. 3 sets here + 3
      // sets on Day 5 = 6 weekly sets, enough for proportionality.
      ex({
        name: 'Rear Delt Flyes',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      // Secondary compound press. Hits anterior delt + upper chest.
      // Two sets is plenty — chest got hammered on Day 1, this is
      // just frequency maintenance.
      ex({
        name: 'Incline DB Bench Press',
        sets: 2,
        restSeconds: 120, nextRestSeconds: 90,
        reps: '8–10 reps',
      }),
      // Tricep finisher. Bar variation hits the long head a bit
      // differently than the rope on Day 1.
      ex({
        name: 'Bar Pushdowns',
        sets: 3,
        restSeconds: 60,
        reps: '10–12 reps',
      }),
    ],
  },

  // Day 5 — PULL (upper-back-led). Heavy rowing first for mid-back /
  // rhomboid mass, second row variation for thickness, then lat
  // pulldowns to keep lat frequency, rear delts, then biceps from a
  // different angle than Day 2. ~40 min.
  {
    day: 5,
    title: 'PULL',
    focus: 'Upper Back Focus',
    color: '#A55EEA',
    exerciseRestSeconds: EXERCISE_REST_SECONDS,
    exercises: [
      bikeWarmup,
      // Lead compound. Chest-supported = no spinal load, no body
      // English — pure mid-back / rhomboid hypertrophy. 6–10 to
      // build strength.
      ex({
        name: 'Chest-Supported Rows',
        sets: 2, warmup: true,
        restSeconds: 150, nextRestSeconds: 180,
        reps: '6–10 reps',
      }),
      // Close neutral grip emphasizes mid-back over lats (elbows
      // travel close to the torso). Different row angle than the
      // chest-supported version.
      ex({
        name: 'Cable Rows (close neutral)',
        sets: 3,
        restSeconds: 120, nextRestSeconds: 120,
        reps: '8–10 reps',
      }),
      // Lat frequency from Day 2. 3 sets here keeps weekly lat
      // volume at 14 sets.
      ex({
        name: 'Lat Pulldowns',
        sets: 3,
        restSeconds: 90, nextRestSeconds: 90,
        reps: '10–12 reps',
      }),
      // Rear delts, second hit of the week.
      ex({
        name: 'Rear Delt Flyes',
        sets: 3,
        restSeconds: 60, nextRestSeconds: 75,
        reps: '12–15 reps',
      }),
      // Bicep main: bar curl works both heads with the heaviest load
      // possible (vs. preacher on Day 2 which is more isolated).
      ex({
        name: 'Bar Curls',
        sets: 3,
        restSeconds: 75, nextRestSeconds: 60,
        reps: '8–10 reps',
      }),
      // Hammer for brachialis + forearm. Second hit of the week.
      ex({
        name: 'Hammer Curls',
        sets: 2,
        restSeconds: 60,
        reps: '10–12 reps',
      }),
    ],
  },
];
