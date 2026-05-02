// Direct client → Anthropic call for the workout-program assistant.
//
// Like `nutritionAiService`, the API key is read from
// `EXPO_PUBLIC_ANTHROPIC_API_KEY` at bundle time and is therefore
// extractable from the shipped app. Acceptable for a personal build;
// replace with a backend proxy before any public release.
//
// Design choice: structured JSON output instead of tool-use. We need a
// single response that is EITHER a chat reply OR a chat reply + program
// proposal. JSON keeps the call cheap (one round trip), the parsing
// path identical regardless of mode, and is consistent with the
// existing `analyzeFood` service in this codebase.

import { dayPalette } from '@/shared/theme';
import type { UnitSystemValue } from '@/shared/utils/units';
import { migrateExercise } from '../constants/exerciseDefaults';
import { sessionVolume } from '../utils/volumeUtils';
import type {
  DayTemplate,
  ExerciseTemplate,
  WorkoutConfig,
  WorkoutSession,
} from '../types/workoutTypes';
import type { AssistantMessage, AssistantTurnResult } from '../types/assistantTypes';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
// Sonnet 4.6 — same price as the deprecated Sonnet 4.0 launch model the
// coach used to ride on, but supports adaptive thinking, structured
// outputs, and stays supported past June 2026. Coach quality matters
// more than nutrition (it edits the program and gives training advice),
// so we don't drop to Haiku here.
const CLAUDE_MODEL = 'claude-sonnet-4-6';
// Conversation memory cap. Six turns ≈ three user/assistant exchanges,
// which covers virtually every coaching ask we've observed. Capping
// here keeps later-turn cost flat instead of growing linearly with chat
// length.
const MAX_HISTORY_TURNS = 6;
// How many completed sessions feed the `<state>` block. Three is enough
// for Claude to spot a regression or plateau across recent workouts; we
// also pre-summarise to top working set per exercise, so a heavy lifter
// with 15 sets/session no longer dumps ~1k tokens of detail per session.
const MAX_RECENT_SESSIONS = 3;

// ─── Output schema ──────────────────────────────────────────────────────────
// Mirrors `RawAssistantResponse` below and `WorkoutConfig` after
// `normaliseProposedConfig`. Anthropic's structured-outputs JSON Schema
// subset requires `additionalProperties: false` on every object and
// rejects `minLength`/`maxLength`/`minimum`/`maximum` — those constraints
// (1–14 char titles, set counts, etc.) live in the normaliser.
//
// `nullable` unions use `anyOf` rather than `type: ["x", "null"]` because
// the latter occasionally trips the API's schema compiler. `anyOf` of two
// concrete types is universally accepted and reads cleaner alongside the
// nested object literal.

const EXERCISE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    sets: { type: 'number' },
    warmup: { type: 'boolean' },
    restSeconds: { type: 'number' },
    nextRestSeconds: {
      anyOf: [{ type: 'null' }, { type: 'number' }],
    },
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

const PROPOSED_CONFIG_SCHEMA = {
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

const COACH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    proposed_config: {
      anyOf: [{ type: 'null' }, PROPOSED_CONFIG_SCHEMA],
    },
    proposal_summary: {
      anyOf: [{ type: 'null' }, { type: 'string' }],
    },
  },
  required: ['reply', 'proposed_config', 'proposal_summary'],
  additionalProperties: false,
} as const;

// ─── Prompt ─────────────────────────────────────────────────────────────────
// The schema above pins shape; this prompt is purely about behaviour:
// when each field should be filled, value conventions the schema can't
// express (uppercase day titles, sensible rest windows, programming
// principles). No more inline schema literal.

const SYSTEM_PROMPT = `You are a strength-training coach embedded in a personal workout-tracking app. The user can see their current program and recent training history. They might:
  • Ask questions ("Why is my bench plateauing?", "How many sets per week is my chest getting?")
  • Ask for tweaks ("Make my legs day harder", "Replace incline DB press with cable crossovers")
  • Ask for full plan rewrites ("Wipe everything and give me a 4-day upper/lower split")
  • Ask for general advice ("Should I deload this week?")

Programming principles to apply when proposing changes:
  • Compound lifts first when CNS is fresh.
  • Hypertrophy: 8–20 working sets per muscle per week, mostly 6–15 reps.
  • Rest: 150–180s for heavy compounds, 90–120s for accessories, 60–90s for isolation.
  • Each muscle group hit 2× per week is the practical sweet spot.
  • Progressive overload: small adjustments based on the user's recent performance.
  • Don't introduce equipment the user clearly doesn't have unless they ask.

Field guidance:
  • "reply" — second person, conversational tone. Be concise; one or two short paragraphs is usually right. Plain text, no markdown fences.
  • "proposed_config" — null when the user is just chatting/asking. When they asked for a change, emit the FULL new program (every day, including days you didn't change — copy them as-is). The app applies the proposal as a single atomic replacement.
  • "proposal_summary" — one-line plain-English summary of the change, null when "proposed_config" is null.

When you do propose changes:
  • Day titles must be 1–14 characters. Use short UPPERCASE words ("PUSH", "PULL", "LEGS", "REST").
  • Focus is a short descriptor (e.g. "CHEST · TRICEPS"); empty string is fine.
  • Default reps: "6–10 reps" for compounds, "8–12 reps" for accessories, "10–15 reps" for isolation.
  • Default warmupReps: "Light weight, 12–15 reps".
  • Set tracksWeight=false ONLY for true bodyweight exercises (push-ups, pull-ups, planks, dips).
  • Set tracksTime=true ONLY for static holds (planks) or warm-ups (e.g. bike, rower); use durationSeconds for those.
  • The user's unit system in <state> is informational — weights you mention in "reply" should use it; the schema itself is unitless.`;

// ─── Context builder ────────────────────────────────────────────────────────

function describeProgram(config: WorkoutConfig): string {
  if (!config.days.length) return '(empty — user has no days yet)';
  return config.days
    .map((d, i) => {
      const exs = d.exercises
        .map(ex => {
          const tags: string[] = [];
          if (ex.warmup) tags.push('warm-up');
          if (ex.tracksTime) tags.push(`${ex.durationSeconds}s timed`);
          if (!ex.tracksWeight) tags.push('bodyweight');
          const tagStr = tags.length ? ` [${tags.join(', ')}]` : '';
          return `    - ${ex.name}: ${ex.sets} × "${ex.reps}", rest ${ex.restSeconds}s${tagStr}`;
        })
        .join('\n');
      return `Day ${i + 1} — ${d.title}${d.focus ? ` (${d.focus})` : ''}, between-exercise rest ${d.exerciseRestSeconds}s\n${exs}`;
    })
    .join('\n\n');
}

type ExerciseDigest = {
  /** Heaviest non-warmup, non-placeholder set of this exercise this session. */
  topWeight: number;
  topReps: number;
  /** Total non-warmup, non-placeholder sets logged for this exercise. */
  setCount: number;
  /** True if any working set was taken to failure — useful intensity signal. */
  toFailure: boolean;
};

function digestSessionByExercise(session: WorkoutSession): Map<string, ExerciseDigest> {
  const out = new Map<string, ExerciseDigest>();
  for (const e of session.entries) {
    if (e.isPlaceholder || e.isWarmup || e.isSkipped) continue;
    let d = out.get(e.exerciseName);
    if (!d) {
      d = { topWeight: 0, topReps: 0, setCount: 0, toFailure: false };
      out.set(e.exerciseName, d);
    }
    d.setCount += 1;
    if (e.toFailure) d.toFailure = true;
    // Score by est-volume so a 5×5 PR isn't shadowed by a 10×3 single.
    const score = e.weight * Math.max(e.reps, 1);
    const topScore = d.topWeight * Math.max(d.topReps, 1);
    if (score > topScore) {
      d.topWeight = e.weight;
      d.topReps = e.reps;
    }
  }
  return out;
}

function describeRecentSessions(sessions: ReadonlyArray<WorkoutSession>): string {
  // Newest-first slice of the most recent completed sessions, summarised
  // to a single line per exercise (top working set + total set count) so
  // the `<state>` block stays compact even after weeks of training.
  const completed = sessions
    .filter(s => s.completedAt && !s.abandonedAt)
    .slice(0, MAX_RECENT_SESSIONS);
  if (!completed.length) return '(no completed sessions yet)';

  return completed
    .map(s => {
      const date = (s.completedAt ?? s.startedAt).slice(0, 10);
      const digest = digestSessionByExercise(s);
      const totalSets = [...digest.values()].reduce((acc, d) => acc + d.setCount, 0);
      const vol = Math.round(sessionVolume(s));
      const header = `${date} — ${s.dayTitle}${s.dayFocus ? ` (${s.dayFocus})` : ''} · vol ${vol} (lb·reps), ${totalSets} working sets`;
      if (digest.size === 0) return `${header}\n  (no working-set data captured)`;
      const lines = [...digest.entries()].map(([name, d]) => {
        const setSuffix = d.setCount > 1 ? ` × ${d.setCount} sets` : '';
        const failureSuffix = d.toFailure ? ' (one to failure)' : '';
        // unit label is informational only — weights on disk are always lb.
        return `  ${name}: top ${d.topWeight}lb × ${d.topReps}${setSuffix}${failureSuffix}`;
      });
      return `${header}\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

function buildSystemPrompt(
  config: WorkoutConfig,
  sessions: ReadonlyArray<WorkoutSession>,
  unitSystem: UnitSystemValue,
): string {
  const program = describeProgram(config);
  const recent = describeRecentSessions(sessions);
  return `${SYSTEM_PROMPT}

<state>
User's preferred unit system: ${unitSystem}

Current program:
${program}

Recent training (most recent first, up to ${MAX_RECENT_SESSIONS} completed sessions):
${recent}
</state>`;
}

// ─── Parsing ────────────────────────────────────────────────────────────────

type RawProposal = {
  days?: Array<{
    title?: unknown;
    focus?: unknown;
    exerciseRestSeconds?: unknown;
    exercises?: unknown;
  }>;
};

type RawAssistantResponse = {
  reply?: unknown;
  proposed_config?: RawProposal | null;
  proposal_summary?: unknown;
};

/**
 * Parse the model's text response into JSON.
 *
 * `output_config.format` constrains the model to emit valid JSON
 * matching `COACH_OUTPUT_SCHEMA`, so the happy path is a direct
 * `JSON.parse`. The recovery branches handle the two cases the API
 * doesn't shield us from — a refusal (`stop_reason: "refusal"`) and
 * truncation (`stop_reason: "max_tokens"`). Both yield non-conforming
 * text; surfacing a clear error is correct.
 */
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
        /* fall through to thrown error */
      }
    }
    throw new Error('Assistant did not return JSON. Got: ' + stripped.slice(0, 200));
  }
}

function clampTitle(raw: unknown, fallback: string): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return fallback;
  return s.slice(0, 14).toUpperCase();
}

function normaliseProposedConfig(raw: RawProposal | null | undefined): WorkoutConfig | null {
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

// ─── Anthropic call ─────────────────────────────────────────────────────────

type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

function trimHistory(history: ReadonlyArray<AssistantMessage>): AssistantMessage[] {
  // Keep the most recent N, dropping any leading assistant message (the
  // Anthropic API requires the first message be 'user').
  const tail = history.slice(-MAX_HISTORY_TURNS);
  while (tail.length > 0 && tail[0].role !== 'user') tail.shift();
  return tail;
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
      // Structured outputs — the model is constrained to emit JSON that
      // validates against COACH_OUTPUT_SCHEMA. Replaces the inline
      // schema literal we used to embed in the system prompt.
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

export type AskWorkoutAssistantArgs = {
  /** Full transcript so far, including the just-appended user turn. */
  history: ReadonlyArray<AssistantMessage>;
  config: WorkoutConfig;
  recentSessions: ReadonlyArray<WorkoutSession>;
  unitSystem: UnitSystemValue;
  signal?: AbortSignal;
};

/**
 * Send the conversation to Claude and return the next assistant turn.
 * Always returns a parsed reply; throws on network or parse failure.
 */
export async function askWorkoutAssistant({
  history,
  config,
  recentSessions,
  unitSystem,
  signal,
}: AskWorkoutAssistantArgs): Promise<AssistantTurnResult> {
  assertKey();

  const trimmed = trimHistory(history);
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
    throw new Error('Conversation must end with a user message.');
  }

  const messages: AnthropicMessage[] = trimmed.map(m => ({
    role: m.role,
    content: m.role === 'assistant' && m.proposalSummary
      ? `${m.text}\n\n(Proposal: ${m.proposalSummary} — ${m.proposalStatus ?? 'pending'})`
      : m.text,
  }));

  const system = buildSystemPrompt(config, recentSessions, unitSystem);
  const data = await callAnthropic(system, messages, signal);
  const text = pullText(data);
  if (!text) throw new Error('Assistant returned an empty response.');

  const parsed = extractJson(text) as RawAssistantResponse;
  const reply =
    typeof parsed.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : 'Done.';
  const proposedConfig = normaliseProposedConfig(parsed.proposed_config);
  const proposalSummary =
    proposedConfig && typeof parsed.proposal_summary === 'string'
      ? parsed.proposal_summary.trim().slice(0, 140)
      : null;

  return { reply, proposedConfig, proposalSummary };
}
