// Direct client → Anthropic call for meal nutrition analysis. The key is
// read from `EXPO_PUBLIC_ANTHROPIC_API_KEY` at bundle time. Anyone with
// access to the shipped bundle can extract it — acceptable for a personal
// build; replace with a backend proxy before any public release.

import { roundInt, roundTenths } from '@/shared/utils/format';
import type {
  AnalyzeFoodArgs,
  AnalyzeFoodResult,
  AnalyzeImageInput,
  AnalyzedItem,
  ConfidenceValue,
  MacroSet,
} from '../types/nutritionTypes';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
// Haiku 4.5 — cheapest model with vision. Food analysis is a bounded
// extraction task (identify components → estimate macros) that doesn't
// need Sonnet-tier reasoning, and `prepareFoodImage` already caps each
// photo at ~1k input tokens so the per-call cost lives in the floor of
// Haiku pricing ($1/$5 per 1M). If accuracy on portion estimation
// regresses against real meals, swap to `claude-sonnet-4-6` here — the
// rest of the request shape is identical.
const CLAUDE_MODEL = 'claude-haiku-4-5';

// ─── Output schema ──────────────────────────────────────────────────────────
// Mirrors `RawAnalyzeResponse` below and (after `normalizeFinal`)
// `AnalyzeFoodResult`. Anthropic's structured-outputs JSON Schema subset
// requires `additionalProperties: false` on every object and rejects
// numeric/string constraints (`minimum`, `maxLength`, etc.) — those are
// enforced in `normalizeFinal` instead.
//
// Keeping the schema next to the prompt is deliberate: the two are a
// single contract with the model. If a field changes here, the prompt
// guidance and the normaliser must both be updated in lockstep.

const MACRO_PROPERTIES = {
  calories: { type: 'number' },
  protein: { type: 'number' },
  carbs: { type: 'number' },
  fat: { type: 'number' },
  fiber: { type: 'number' },
} as const;
const MACRO_REQUIRED = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;

const NUTRITION_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    food_detected: { type: 'boolean' },
    meal_name: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          ...MACRO_PROPERTIES,
        },
        required: ['name', 'quantity', 'unit', ...MACRO_REQUIRED],
        additionalProperties: false,
      },
    },
    totals: {
      type: 'object',
      properties: { ...MACRO_PROPERTIES },
      required: [...MACRO_REQUIRED],
      additionalProperties: false,
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    notes: { type: 'string' },
  },
  required: ['food_detected', 'meal_name', 'items', 'totals', 'confidence', 'notes'],
  additionalProperties: false,
} as const;

// ─── Prompt ─────────────────────────────────────────────────────────────────
// The schema above guarantees the response *shape*. The system prompt only
// needs to describe *behaviour* — when to fill what, how to reconcile
// signals, and the confidence rubric. No more inline schema literal.

const SYSTEM_PROMPT = `You are a precise nutrition analyst. Identify each distinct food component the user is logging and estimate its calories + macros using your training knowledge of standard nutrition databases (USDA / common food databases).

You may receive:
  • photo(s) of food
  • a text description of food
  • or both — in which case the text gives extra context for the photo (e.g. "I ate 3 of these", "this is the low-fat version", "skip the bread")

When BOTH a photo and text are provided:
  • The text is authoritative for QUANTITY — if the photo shows one yogurt and the text says "I had 3", log 3.
  • The text is authoritative for VARIANT/BRAND/PREPARATION — "low-fat", "no dressing", "skim milk".
  • The photo is authoritative for VISUAL IDENTIFICATION of components (what's actually on the plate).
  • Never silently ignore either input. If they conflict beyond reconciliation, prefer the text and add a short caveat in "notes".

If neither the photo(s) nor the text describes food (e.g. a person, an object, a screenshot, a blank/blurry image, an animal not being eaten, an empty string), set "food_detected": false, leave "items" empty and every "totals" macro at 0, and put a one-sentence description of what the input actually shows in "notes" (e.g. "Photo shows a dog on a couch — no food in frame."). Do not invent food in this case.

Field guidance:
  • "meal_name" — a short, descriptive name for the whole plate/meal as a single phrase (e.g. "Sushi platter", "Chicken & rice bowl", "Greek yogurt with berries", "Avocado toast"). Keep it under 32 characters. If only one component is shown, use its name.
  • "items[].unit" — grams or common household units ("cup", "tbsp", "slice", "piece", "oz", "medium", "large") as appropriate.
  • "totals" — sum of all items. The app recomputes these defensively, but emit accurate values.
  • "confidence" — "high" when items are clearly identifiable AND portions are well-anchored (clear text quantity, multiple photo angles, utensils/plate for scale); "medium" when items are identified but portion is partly inferred; "low" when ambiguous, partially obscured, hard to identify, or vague text.
  • "notes" — short caveats only (e.g. "Assumed olive oil; could be butter", "Trusted user's '3 eggs' over the 2 visible in frame"). Keep under 200 characters. Empty string is fine when no caveat applies.`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertAnthropicKey(): void {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'Anthropic key missing. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart Metro with `npx expo start -c`.',
    );
  }
}

/**
 * Parse the model's text response into JSON.
 *
 * Structured outputs (`output_config.format`) guarantees the response is
 * valid JSON matching `NUTRITION_OUTPUT_SCHEMA` when the model produces
 * a normal turn — so the body is just `JSON.parse`. We still strip
 * stray markdown fences and recover the first object literal as a
 * defence-in-depth fallback for two cases the API doesn't shield us
 * from: a refusal (`stop_reason: "refusal"`), and a truncated response
 * (`stop_reason: "max_tokens"`). Both produce non-conforming text; a
 * loud parse error is the right outcome.
 */
function extractJson(text: string): unknown {
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through to the thrown error below */
      }
    }
    throw new Error(
      'Nutrition assistant did not return parseable JSON. First 200 chars: ' +
        stripped.slice(0, 200),
    );
  }
}

type RawAnalyzedItem = {
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
  calories?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  fiber?: unknown;
};

type RawAnalyzeResponse = {
  food_detected?: boolean;
  items?: RawAnalyzedItem[];
  confidence?: string;
  notes?: string;
  meal_name?: string;
};

function normalizeFinal(parsed: unknown): AnalyzeFoodResult {
  const p = (parsed ?? {}) as RawAnalyzeResponse;
  const items: AnalyzedItem[] = (p.items ?? []).map((i): AnalyzedItem => ({
    name: String(i.name ?? 'Unknown'),
    quantity: Number(i.quantity ?? 1),
    unit: String(i.unit ?? 'serving'),
    calories: roundInt(i.calories as number),
    protein: roundTenths(i.protein as number),
    carbs: roundTenths(i.carbs as number),
    fat: roundTenths(i.fat as number),
    fiber: roundTenths(i.fiber as number),
  }));

  const totals: MacroSet = items.reduce<MacroSet>(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein: acc.protein + it.protein,
      carbs: acc.carbs + it.carbs,
      fat: acc.fat + it.fat,
      fiber: acc.fiber + it.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
  totals.protein = roundTenths(totals.protein);
  totals.carbs = roundTenths(totals.carbs);
  totals.fat = roundTenths(totals.fat);
  totals.fiber = roundTenths(totals.fiber);

  const foodDetected =
    p.food_detected === false ? false : items.some(it => it.calories > 0);

  const confidence: ConfidenceValue =
    p.confidence === 'high' || p.confidence === 'low' ? p.confidence : 'medium';

  return {
    foodDetected,
    items,
    totals,
    confidence,
    notes: typeof p.notes === 'string' ? p.notes : '',
    mealName: typeof p.meal_name === 'string' ? p.meal_name.trim().slice(0, 64) : null,
  };
}

type AnthropicMessage = {
  role: 'user';
  content: Array<
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'text'; text: string }
  >;
};

type AnthropicCallArgs = {
  system: string;
  messages: AnthropicMessage[];
  signal?: AbortSignal;
};

async function callAnthropic({ system, messages, signal }: AnthropicCallArgs): Promise<{
  content: Array<{ type: string; text?: string }>;
}> {
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
      max_tokens: 2048,
      system,
      messages,
      // Structured outputs — the model is constrained to emit JSON that
      // validates against NUTRITION_OUTPUT_SCHEMA. Replaces the inline
      // schema literal we used to embed in the system prompt.
      output_config: {
        format: { type: 'json_schema', schema: NUTRITION_OUTPUT_SCHEMA },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${text || res.statusText}`);
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

function buildUserContent({
  images,
  query,
  photoCount,
  hasQuery,
}: {
  images: AnalyzeImageInput[];
  query: string;
  photoCount: number;
  hasQuery: boolean;
}): AnthropicMessage['content'] {
  const content: AnthropicMessage['content'] = [];
  for (const img of images) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.base64 },
    });
  }
  let textBlock: string;
  if (photoCount > 0 && hasQuery) {
    textBlock = `Here ${photoCount === 1 ? 'is 1 photo' : `are ${photoCount} photos`} of the meal, plus context from the user:\n\n"${query}"\n\nUse both. Reconcile per the system rules.`;
  } else if (photoCount > 0) {
    textBlock =
      photoCount > 1
        ? `Here are ${photoCount} photos of the same meal from different angles. Identify every component and estimate its nutrition.`
        : 'Identify every food component in this photo and estimate its nutrition.';
  } else {
    textBlock = `The user described their meal:\n\n"${query}"\n\nIdentify components and estimate nutrition. If they didn't specify portions, fill in sensible defaults.`;
  }
  content.push({ type: 'text', text: textBlock });
  return content;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Analyze a meal from photo(s), a text description, or both.
 * Throws if both `images` and `query` are empty.
 */
export async function analyzeFood({
  images = [],
  query = '',
  signal,
  onProgress,
}: AnalyzeFoodArgs = {}): Promise<AnalyzeFoodResult> {
  assertAnthropicKey();
  const trimmedQuery = (query ?? '').trim();
  const photoCount = images?.length ?? 0;
  if (photoCount === 0 && !trimmedQuery) {
    throw new Error('Add a photo or describe what you ate.');
  }

  const status =
    photoCount > 0 && trimmedQuery
      ? 'Sending photos and notes to Claude…'
      : photoCount > 0
        ? photoCount > 1
          ? `Sending ${photoCount} photos to Claude…`
          : 'Sending photo to Claude…'
        : 'Asking Claude…';
  onProgress?.(status);

  const data = await callAnthropic({
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserContent({
          images,
          query: trimmedQuery,
          photoCount,
          hasQuery: !!trimmedQuery,
        }),
      },
    ],
    signal,
  });

  onProgress?.('Tallying totals…');

  const text = pullText(data);
  if (!text) throw new Error('Claude returned no text.');
  return normalizeFinal(extractJson(text));
}
