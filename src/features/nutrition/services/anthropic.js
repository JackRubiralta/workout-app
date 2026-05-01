// Direct client → Anthropic call. Key is read from EXPO_PUBLIC_ANTHROPIC_API_KEY
// at bundle time. Anyone with access to the shipped bundle can extract it —
// acceptable for a personal build, replace with a backend proxy before any
// public release.

import { roundInt, roundTenths } from '../../../utils/format';

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

// One unified system prompt that handles three modes in a single call:
//   (1) photos only
//   (2) text only
//   (3) photos + text — text adds quantity/identity/context to the photo
//
// Rule of thumb baked into the prompt: when both inputs disagree, the text
// wins for *quantity* and *identity disambiguation* (because the user is
// telling you the truth about portion), and the photo wins for *visual
// identification* of components and dishes.
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

function assertAnthropicKey() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      'Anthropic key missing. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart Metro with `npx expo start -c`.',
    );
  }
}

function extractJson(text) {
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(stripped);
  } catch { /* fall through */ }
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude did not return parseable JSON. Got: ' + stripped.slice(0, 200));
  return JSON.parse(match[0]);
}

function normalizeFinal(parsed) {
  const items = (parsed.items ?? []).map(i => ({
    name: String(i.name ?? 'Unknown'),
    quantity: Number(i.quantity ?? 1),
    unit: String(i.unit ?? 'serving'),
    calories: roundInt(i.calories),
    protein: roundTenths(i.protein),
    carbs: roundTenths(i.carbs),
    fat: roundTenths(i.fat),
    fiber: roundTenths(i.fiber),
  }));
  // Recompute totals so they always match items even if Claude's math drifted.
  const totals = items.reduce(
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

  // food_detected explicit, OR fall back to "is there at least one item with
  // calories?" — Claude sometimes forgets the flag but never invents food
  // when there isn't any.
  const foodDetected = parsed.food_detected === false
    ? false
    : items.some(it => it.calories > 0);

  return {
    foodDetected,
    items,
    totals,
    confidence: parsed.confidence === 'high' || parsed.confidence === 'low' ? parsed.confidence : 'medium',
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    mealName: typeof parsed.meal_name === 'string' ? parsed.meal_name.trim().slice(0, 64) : null,
  };
}

async function callAnthropic({ system, messages, signal }) {
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

function pullText(data) {
  return data.content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n')
    .trim();
}

// Builds the user message content array for the Messages API. Photos go
// first (Claude is more accurate when it sees the image before the text
// instructions), the text caption goes last and *always* exists — even
// for photo-only calls — so the prompt template above can reliably refer
// to "the user's text".
function buildUserContent({ images, query, photoCount, hasQuery }) {
  const content = [];
  for (const img of images) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType || 'image/jpeg', data: img.base64 },
    });
  }
  let textBlock;
  if (photoCount > 0 && hasQuery) {
    textBlock = `Here ${photoCount === 1 ? 'is 1 photo' : `are ${photoCount} photos`} of the meal, plus context from the user:\n\n"${query}"\n\nUse both. Reconcile per the system rules.`;
  } else if (photoCount > 0) {
    textBlock = photoCount > 1
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
 *
 * @param {object} args
 * @param {Array<{ base64: string, mediaType: string }>} [args.images=[]] - 0–N photos.
 * @param {string} [args.query=''] - Optional text description / portion context.
 * @param {AbortSignal} [args.signal] - Cancel the in-flight request.
 * @param {(msg: string) => void} [args.onProgress] - Status updates ("Sending photos to Claude…").
 * @returns {Promise<{ foodDetected: boolean, items: Array, totals: object, confidence: 'high'|'medium'|'low', notes: string, mealName: string|null }>}
 *
 * Throws if both `images` and `query` are empty.
 */
export async function analyzeFood({ images = [], query = '', signal, onProgress } = {}) {
  assertAnthropicKey();
  const trimmedQuery = (query ?? '').trim();
  const photoCount = images?.length ?? 0;
  if (photoCount === 0 && !trimmedQuery) {
    throw new Error('Add a photo or describe what you ate.');
  }

  const status = photoCount > 0 && trimmedQuery
    ? 'Sending photos and notes to Claude…'
    : photoCount > 0
      ? (photoCount > 1 ? `Sending ${photoCount} photos to Claude…` : 'Sending photo to Claude…')
      : 'Asking Claude…';
  onProgress?.(status);

  const data = await callAnthropic({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserContent({ images, query: trimmedQuery, photoCount, hasQuery: !!trimmedQuery }) }],
    signal,
  });

  onProgress?.('Tallying totals…');

  const text = pullText(data);
  if (!text) throw new Error('Claude returned no text.');
  return normalizeFinal(extractJson(text));
}
