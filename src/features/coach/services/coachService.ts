// Direct client → Anthropic call for the cross-feature coach.
//
// The key is read from `EXPO_PUBLIC_ANTHROPIC_API_KEY` at bundle time and
// is therefore extractable from the shipped app. Acceptable for a personal
// build; replace with a backend proxy before any public release.
//
// Design notes:
//   • One round-trip per turn. Structured outputs constrain the model to
//     a single JSON object whose shape is `{ reply, workout_proposal,
//     macro_goals_proposal, proposal_summary }`. Either proposal can be
//     null; both can be present in the same turn (e.g. "build me a new
//     program and tighten my macros").
//   • Profile (name + height) and starting body weight are gathered via
//     onboarding, NOT mid-chat proposals. That keeps the schema compact
//     and the apply path predictable.
//   • Conversation memory cap mirrors the old workout assistant — six
//     turns ≈ three exchanges, which covers virtually every observed
//     coaching ask without growing token cost linearly.

import { dayPalette } from '@/shared/theme';
import type { UserProfile } from '@/shared/types/settingsTypes';
import type { UnitSystemValue } from '@/shared/utils/units';
import { migrateExercise } from '@/features/workouts/constants/exerciseDefaults';
import type {
  DayTemplate,
  ExerciseTemplate,
  WorkoutConfig,
  WorkoutSession,
} from '@/features/workouts/types/workoutTypes';
import type {
  LogsByDate,
  MacroGoals,
} from '@/features/nutrition/types/nutritionTypes';
import type { BodyWeightEntry } from '@/features/tracking/types/trackingTypes';
import {
  describeMacroGoals,
  describeProfile,
  describeProgram,
  describeRecentNutrition,
  describeRecentSessions,
  describeWeightTrend,
} from '../utils/coachContext';
import type { CoachMessage, CoachProposals, CoachTurnResult } from '../types/coachTypes';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
// Sonnet 4.6 — coaching needs reasoning over the user's history; Haiku
// would over-compress nuance. Same price tier as the deprecated launch
// Sonnet but supports adaptive thinking and structured outputs.
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_HISTORY_TURNS = 6;

// ─── Output schema ──────────────────────────────────────────────────────────
// `additionalProperties: false` is required on every nested object, and
// numeric/string constraints (`minimum`, `maxLength`, etc.) are NOT
// supported by Anthropic's structured-outputs subset — they're enforced
// in the normaliser below.

const EXERCISE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    sets: { type: 'number' },
    warmup: { type: 'boolean' },
    restSeconds: { type: 'number' },
    nextRestSeconds: { anyOf: [{ type: 'null' }, { type: 'number' }] },
    reps: { type: 'string' },
    warmupReps: { type: 'string' },
    tracksWeight: { type: 'boolean' },
    tracksReps: { type: 'boolean' },
    tracksTime: { type: 'boolean' },
    durationSeconds: { type: 'number' },
  },
  required: [
    'name',
    'sets',
    'warmup',
    'restSeconds',
    'nextRestSeconds',
    'reps',
    'warmupReps',
    'tracksWeight',
    'tracksReps',
    'tracksTime',
    'durationSeconds',
  ],
  additionalProperties: false,
} as const;

const WORKOUT_PROPOSAL_SCHEMA = {
  type: 'object',
  properties: {
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          focus: { type: 'string' },
          exerciseRestSeconds: { type: 'number' },
          exercises: { type: 'array', items: EXERCISE_SCHEMA },
        },
        required: ['title', 'focus', 'exerciseRestSeconds', 'exercises'],
        additionalProperties: false,
      },
    },
  },
  required: ['days'],
  additionalProperties: false,
} as const;

const MACRO_GOALS_SCHEMA = {
  type: 'object',
  properties: {
    calories: { type: 'number' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    fiber: { type: 'number' },
  },
  required: ['calories', 'protein', 'carbs', 'fat', 'fiber'],
  additionalProperties: false,
} as const;

const COACH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    workout_proposal: { anyOf: [{ type: 'null' }, WORKOUT_PROPOSAL_SCHEMA] },
    macro_goals_proposal: { anyOf: [{ type: 'null' }, MACRO_GOALS_SCHEMA] },
    proposal_summary: { anyOf: [{ type: 'null' }, { type: 'string' }] },
  },
  required: ['reply', 'workout_proposal', 'macro_goals_proposal', 'proposal_summary'],
  additionalProperties: false,
} as const;

// ─── Prompt ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a strength-and-nutrition coach embedded in a personal training app. You can see the user's profile (name, height, latest body weight), their full workout program, recent training history, current macro goals, and recent nutrition logs.

Common asks:
  • Strength questions ("Why is my bench plateauing?", "Should I deload?")
  • Program edits ("Make legs harder", "Replace this push day with a 4-exercise version", "Wipe everything and give me 4-day upper/lower")
  • Nutrition questions ("Am I eating enough protein?", "Tighten my goals for a cut")
  • Combined planning ("Set me up for a hypertrophy block — adjust both my program and my macros")

Programming principles when proposing PROGRAM changes:
  • Compound lifts first when CNS is fresh.
  • Hypertrophy: 8–20 working sets per muscle per week, mostly 6–15 reps.
  • Rest: 150–180s for heavy compounds, 90–120s for accessories, 60–90s for isolation.
  • Each muscle group hit 2× per week is the sweet spot.
  • Progressive overload anchored to the user's recent performance.
  • Don't introduce equipment they clearly don't have unless they ask.

Nutrition principles when proposing MACRO GOAL changes:
  • Protein: ~0.8–1.0 g per lb of body weight for most lifters; 1.0+ g/lb in a cut.
  • Calories: bulk = +250–500 over maintenance, cut = -300–500 under, recomp ≈ maintenance.
  • Maintenance estimate: men ~15–17 kcal × lb of body weight, women ~13–15 kcal × lb. If gender is "other / unspecified" or missing, use ~14 kcal × lb and say so in the reply.
  • Fat: ≥ 0.3 g per lb of body weight to protect hormones (women trend higher in this range).
  • Fiber: 14 g per 1000 kcal (round to nearest 5 g).
  • Carbs: fill the remaining calories.
  • Round calories to the nearest 50, macros to the nearest 5 g.

Field guidance:
  • "reply" — second person, conversational. One or two short paragraphs. Plain text, no markdown fences.
  • "workout_proposal" — null when not proposing a program change. When the user asked for a program change, emit the FULL new program (every day, including ones you didn't change — copy them verbatim). The app applies it as a single atomic replacement.
  • "macro_goals_proposal" — null when not proposing macro changes. When set, ALL FIVE fields are required (calories, protein, carbs, fat, fiber). Apply atomically.
  • "proposal_summary" — one-line plain-English description of whichever proposal(s) you included. Null when both proposals are null.

Workout proposal rules:
  • Day titles must be 1–14 characters, short UPPERCASE words ("PUSH", "PULL", "LEGS", "REST").
  • Focus is a short descriptor (e.g. "CHEST · TRICEPS"); empty string is fine.
  • Default reps: "6–10 reps" for compounds, "8–12 reps" for accessories, "10–15 reps" for isolation.
  • Default warmupReps: "Light weight, 12–15 reps".
  • tracksWeight=false ONLY for true bodyweight exercises (push-ups, pull-ups, planks, dips).
  • tracksTime=true ONLY for static holds (planks) or warm-ups (e.g. bike, rower); set durationSeconds for those.

The unit system in <state> is informational. Weights you mention in "reply" should match it; the schema itself is unitless (the app stores everything in pounds).`;

function buildSystemPrompt(args: {
  profile: UserProfile;
  latestWeight: BodyWeightEntry | null;
  weightEntries: ReadonlyArray<BodyWeightEntry>;
  config: WorkoutConfig;
  sessions: ReadonlyArray<WorkoutSession>;
  goals: MacroGoals;
  logsByDate: LogsByDate;
  unitSystem: UnitSystemValue;
}): string {
  const sections: string[] = [
    `User's preferred unit system: ${args.unitSystem}`,
    `\nProfile:\n${describeProfile(args.profile, args.latestWeight, args.unitSystem)}`,
  ];
  const weightTrend = describeWeightTrend(args.weightEntries, args.unitSystem);
  if (weightTrend) sections.push('\n' + weightTrend);
  sections.push(`\nCurrent program:\n${describeProgram(args.config)}`);
  sections.push(`\nRecent training (newest first):\n${describeRecentSessions(args.sessions)}`);
  sections.push(`\nCurrent macro goals: ${describeMacroGoals(args.goals)}`);
  sections.push(`\nRecent nutrition (newest last):\n${describeRecentNutrition(args.logsByDate)}`);

  return `${SYSTEM_PROMPT}\n\n<state>\n${sections.join('\n')}\n</state>`;
}

// ─── Parsing ────────────────────────────────────────────────────────────────

type RawWorkoutProposal = {
  days?: Array<{
    title?: unknown;
    focus?: unknown;
    exerciseRestSeconds?: unknown;
    exercises?: unknown;
  }>;
};

type RawMacroGoalsProposal = Partial<Record<keyof MacroGoals, unknown>>;

type RawCoachResponse = {
  reply?: unknown;
  workout_proposal?: RawWorkoutProposal | null;
  macro_goals_proposal?: RawMacroGoalsProposal | null;
  proposal_summary?: unknown;
};

function extractJson(t: string): unknown {
  const stripped = t.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(stripped);
  } catch {
    const m = stripped.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    throw new Error('Coach did not return JSON. Got: ' + stripped.slice(0, 200));
  }
}

function clampTitle(raw: unknown, fallback: string): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return fallback;
  return s.slice(0, 14).toUpperCase();
}

function normaliseWorkoutProposal(raw: RawWorkoutProposal | null | undefined): WorkoutConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.days) || raw.days.length === 0) return null;

  const days: DayTemplate[] = raw.days
    .map((d, i): DayTemplate => {
      const exercises: ExerciseTemplate[] = Array.isArray(d?.exercises)
        ? (d.exercises as unknown[]).map(ex => migrateExercise(ex))
        : [];
      return {
        day: i + 1,
        title: clampTitle(d?.title, `DAY ${i + 1}`),
        focus: typeof d?.focus === 'string' ? d.focus.trim().slice(0, 32) : '',
        color: dayPalette[i % dayPalette.length],
        exerciseRestSeconds:
          typeof d?.exerciseRestSeconds === 'number' && d.exerciseRestSeconds > 0
            ? Math.round(d.exerciseRestSeconds)
            : 180,
        exercises,
      };
    })
    .filter(d => d.exercises.length > 0);

  if (days.length === 0) return null;
  return { days };
}

function clampPositive(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' && isFinite(raw) ? raw : NaN;
  if (!isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

function normaliseMacroGoals(
  raw: RawMacroGoalsProposal | null | undefined,
  current: MacroGoals,
): MacroGoals | null {
  if (!raw || typeof raw !== 'object') return null;
  const next: MacroGoals = {
    calories: clampPositive(raw.calories, current.calories),
    protein: clampPositive(raw.protein, current.protein),
    carbs: clampPositive(raw.carbs, current.carbs),
    fat: clampPositive(raw.fat, current.fat),
    fiber: clampPositive(raw.fiber, current.fiber),
  };
  // If the model returned an object identical to the current goals (no
  // actual change), surface it as null so the UI doesn't render a noop
  // proposal card.
  const same =
    next.calories === current.calories &&
    next.protein === current.protein &&
    next.carbs === current.carbs &&
    next.fat === current.fat &&
    next.fiber === current.fiber;
  return same ? null : next;
}

// ─── Anthropic call ─────────────────────────────────────────────────────────

type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

function trimHistory(history: ReadonlyArray<CoachMessage>): CoachMessage[] {
  const tail = history.slice(-MAX_HISTORY_TURNS);
  while (tail.length > 0 && tail[0].role !== 'user') tail.shift();
  return tail;
}

function serialiseAssistantTurn(m: CoachMessage): string {
  if (m.role !== 'assistant') return m.text;
  const tags: string[] = [];
  if (m.proposals?.workoutConfig) {
    tags.push(`workout proposal — ${m.workoutStatus ?? 'pending'}`);
  }
  if (m.proposals?.macroGoals) {
    tags.push(`macro goals proposal — ${m.goalsStatus ?? 'pending'}`);
  }
  if (!tags.length) return m.text;
  return `${m.text}\n\n(${tags.join('; ')}${m.proposalSummary ? `: ${m.proposalSummary}` : ''})`;
}

async function callAnthropic(
  system: string,
  messages: AnthropicMessage[],
  signal?: AbortSignal,
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system,
      messages,
      output_config: {
        format: { type: 'json_schema', schema: COACH_OUTPUT_SCHEMA },
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

function pullText(data: { content: Array<{ type: string; text?: string }> }): string {
  return data.content
    .filter(c => c.type === 'text')
    .map(c => c.text ?? '')
    .join('\n')
    .trim();
}

function assertKey(): void {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'Anthropic key missing. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart Metro with `npx expo start -c`.',
    );
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export type AskCoachArgs = {
  /** Full transcript so far, including the just-appended user turn. */
  history: ReadonlyArray<CoachMessage>;
  profile: UserProfile;
  latestWeight: BodyWeightEntry | null;
  weightEntries: ReadonlyArray<BodyWeightEntry>;
  config: WorkoutConfig;
  sessions: ReadonlyArray<WorkoutSession>;
  goals: MacroGoals;
  logsByDate: LogsByDate;
  unitSystem: UnitSystemValue;
  signal?: AbortSignal;
};

export async function askCoach(args: AskCoachArgs): Promise<CoachTurnResult> {
  assertKey();

  const trimmed = trimHistory(args.history);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
    throw new Error('Conversation must end with a user message.');
  }

  const messages: AnthropicMessage[] = trimmed.map(m => ({
    role: m.role,
    content: serialiseAssistantTurn(m),
  }));

  const system = buildSystemPrompt({
    profile: args.profile,
    latestWeight: args.latestWeight,
    weightEntries: args.weightEntries,
    config: args.config,
    sessions: args.sessions,
    goals: args.goals,
    logsByDate: args.logsByDate,
    unitSystem: args.unitSystem,
  });
  const data = await callAnthropic(system, messages, args.signal);
  const text = pullText(data);
  if (!text) throw new Error('Coach returned an empty response.');

  const parsed = extractJson(text) as RawCoachResponse;
  const reply =
    typeof parsed.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : 'Done.';
  const workoutConfig = normaliseWorkoutProposal(parsed.workout_proposal);
  const macroGoals = normaliseMacroGoals(parsed.macro_goals_proposal, args.goals);
  const proposals: CoachProposals | null =
    workoutConfig || macroGoals ? { workoutConfig, macroGoals } : null;
  const proposalSummary =
    proposals && typeof parsed.proposal_summary === 'string'
      ? parsed.proposal_summary.trim().slice(0, 160)
      : null;

  return { reply, proposals, proposalSummary };
}
