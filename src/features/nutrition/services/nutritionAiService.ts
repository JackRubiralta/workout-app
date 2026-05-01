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
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// ─── Prompts ────────────────────────────────────────────────────────────────

const JSON_SHAPE = `{
  "food_detected": boolean,
  "meal_name": string,
  "items": [{ "name": string, "quantity": number, "unit": string, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number },
  "confidence": "high" | "medium" | "low",
  "notes": string
}

If neither the photo(s) nor the text describes food (e.g. a person, an object, a screenshot, a blank/blurry image, an animal not being eaten, an empty string), set "food_detected": false, leave "items" and "totals" empty/zero, and put a one-sentence description of what the input actually shows in "notes" (e.g. "Photo shows a dog on a couch — no food in frame."). Do not invent food in this case.`;

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

Return a final JSON object with this exact shape:
${JSON_SHAPE}

"meal_name" is a short, descriptive name for the whole plate/meal as a single phrase (e.g. "Sushi platter", "Chicken & rice bowl", "Greek yogurt with berries", "Avocado toast"). Keep it under 32 characters. If only one component is shown, use its name.

Confidence rubric:
  • "high" — items clearly identifiable AND portions are well-anchored (clear text quantity, multiple photo angles, utensils/plate for scale)
  • "medium" — items identified but portion is partly inferred
  • "low" — ambiguous, partially obscured, hard to identify, or vague text

Use the "notes" field for short caveats (e.g. "Assumed olive oil; could be butter", "Trusted user's '3 eggs' over the 2 visible in frame"). Keep notes under 200 characters.

Return ONLY the JSON object — no prose, no markdown fences. Use grams or common household units (cup, tbsp, slice, piece, oz, medium, large) as appropriate.`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertAnthropicKey(): void {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'Anthropic key missing. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart Metro with `npx expo start -c`.',
    );
  }
}

function extractJson(text: string): unknown {
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(stripped);
  } catch {
    /* fall through */
  }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude did not return parseable JSON. Got: ' + stripped.slice(0, 200));
  return JSON.parse(match[0]);
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
