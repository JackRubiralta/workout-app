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
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_HISTORY_TURNS = 12;
const MAX_RECENT_SESSIONS = 8;

// ─── Prompt ─────────────────────────────────────────────────────────────────

const RESPONSE_SCHEMA = `{
  "reply": string,                  // Conversational answer. Plain text. No code fences.
  "proposed_config": null | {       // ONLY set when the user asked for a change.
    "days": [
      {
        "title": string,            // 1–14 chars. Short, UPPERCASE words ("PUSH", "PULL", "LEGS", "REST").
        "focus": string,            // Optional descriptor. e.g. "CHEST · TRICEPS".
        "exerciseRestSeconds": number,   // Default rest BETWEEN exercises (seconds).
        "exercises": [
          {
            "name": string,
            "sets": number,         // Working sets. Warm-up is a separate boolean.
            "warmup": boolean,
            "restSeconds": number,  // Rest after each working set.
            "nextRestSeconds": number | null,  // Override for last set → next exercise.
            "reps": string,         // Free-text guide e.g. "6–10 reps".
            "warmupReps": string,   // Only meaningful when warmup === true.
            "tracksWeight": boolean,
            "tracksReps": boolean,
            "tracksTime": boolean,
            "durationSeconds": number
          }
        ]
      }
    ]
  },
  "proposal_summary": string | null  // One-line plain-English summary of the change. Null when proposed_config is null.
}`;

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

You MUST always respond with a single JSON object that matches this exact schema:

${RESPONSE_SCHEMA}

Rules:
  • Reply in second person, conversational tone. Be concise — one or two short paragraphs is usually right.
  • If the user is just chatting / asking, set "proposed_config" to null and "proposal_summary" to null.
  • If the user asked for a change, set "proposed_config" to the FULL new program (every day, including days you didn't change — copy them as-is). The app applies the proposal as a single atomic replacement.
  • Default reps "6–10 reps" for compounds, "8–12 reps" for accessories, "10–15 reps" for isolation.
  • Default warmupReps: "Light weight, 12–15 reps".
  • Set tracksWeight=false ONLY for true bodyweight exercises (push-ups, pull-ups, planks, dips).
  • Set tracksTime=true ONLY for static holds (planks) or warm-ups (e.g. bike, rower); use durationSeconds for those.
  • Use the "user's unit system" hint only for context — weights you reference in your reply should use it; the schema itself is unitless.
  • Day titles must be 1–14 characters. Focus is optional and should be short (e.g. "CHEST · TRICEPS").
  • Don't invent fields outside the schema. Don't wrap the JSON in markdown fences.

Return ONLY the JSON object.`;

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

function describeRecentSessions(
  sessions: ReadonlyArray<WorkoutSession>,
  unitSystem: UnitSystemValue,
): string {
  const completed = sessions.filter(s => s.completedAt && !s.abandonedAt).slice(0, MAX_RECENT_SESSIONS);
  if (!completed.length) return '(no completed sessions yet)';
  return completed
    .map(s => {
      const date = (s.completedAt ?? s.startedAt).slice(0, 10);
      const real = s.entries.filter(e => !e.isPlaceholder && !e.isWarmup && !e.isSkipped);
      const lines = real
        .map(e => `  ${e.exerciseName}: ${e.weight}${e.unit} × ${e.reps}${e.toFailure ? ' to failure' : ''}`)
        .join('\n');
      const vol = Math.round(sessionVolume(s));
      return `${date} — ${s.dayTitle}${s.dayFocus ? ` (${s.dayFocus})` : ''} · vol ${vol} (lb·reps), ${real.length} working sets\n${lines || '  (no working-set data captured)'}`;
    })
    .join('\n\n');
}

function buildSystemPrompt(
  config: WorkoutConfig,
  sessions: ReadonlyArray<WorkoutSession>,
  unitSystem: UnitSystemValue,
): string {
  const program = describeProgram(config);
  const recent = describeRecentSessions(sessions, unitSystem);
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

function extractJson(t: string): unknown {
  const stripped = t.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(stripped);
  } catch {
    /* fall through to regex scan */
  }
  const m = stripped.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Assistant did not return JSON. Got: ' + stripped.slice(0, 200));
  return JSON.parse(m[0]);
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
