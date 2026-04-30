// Direct client → Anthropic call. Key is hardcoded at the user's request for
// this private/personal build. Anyone with access to the bundle can extract
// it — replace with a backend proxy before any public release.

const ANTHROPIC_API_KEY = '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';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// ─── Prompts ────────────────────────────────────────────────────────────────

const JSON_SHAPE = `{
  "items": [{ "name": string, "quantity": number, "unit": string, "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number }],
  "totals": { "calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number },
  "confidence": "high" | "medium" | "low",
  "notes": string
}`;

const SYSTEM_PROMPT_PHOTO = `You are a precise nutrition analyst. Analyze the food in the image(s) and identify each distinct component. Use multiple photos together to improve portion estimation. Use your training knowledge of standard nutrition data (USDA / common food databases) to estimate calories and macros for each component, then sum them.

Return a final JSON object with this exact shape:
${JSON_SHAPE}

Confidence rubric:
- "high" — items clearly identifiable AND portion cues are good (utensils, plate, multiple angles)
- "medium" — items identified but portion is a rough guess
- "low" — ambiguous, partially obscured, or hard to identify

Use the "notes" field for short caveats (e.g. "Assumed olive oil; could be butter", "Portion estimated from plate size"). Keep notes under 200 characters.

Return ONLY the JSON object — no prose, no markdown fences. Use grams or common household units (cup, tbsp, slice, piece, oz, medium, large) as appropriate.`;

const SYSTEM_PROMPT_TEXT = `You are a precise nutrition analyst. The user describes a food or meal in plain English. Identify each component, fill in sensible portions if the user did not specify them, and return nutrition data using your training knowledge of standard nutrition databases.

Return a final JSON object with this exact shape:
${JSON_SHAPE}

Confidence rubric:
- "high" — query is specific and unambiguous (clear food name + clear portion)
- "medium" — query is recognizable but portion was inferred
- "low" — query is vague, ambiguous brand, or unusual food

Use the "notes" field for short caveats (e.g. "Assumed 1 medium banana", "Brand-specific values vary"). Keep notes under 200 characters.

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
    calories: Math.round(Number(i.calories ?? 0)),
    protein: Math.round(Number(i.protein ?? 0) * 10) / 10,
    carbs: Math.round(Number(i.carbs ?? 0) * 10) / 10,
    fat: Math.round(Number(i.fat ?? 0) * 10) / 10,
    fiber: Math.round(Number(i.fiber ?? 0) * 10) / 10,
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
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.fiber = Math.round(totals.fiber * 10) / 10;

  return {
    items,
    totals,
    confidence: parsed.confidence === 'high' || parsed.confidence === 'low' ? parsed.confidence : 'medium',
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
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

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * @param {{ images: Array<{ base64: string, mediaType: string }>, signal?: AbortSignal, onProgress?: (msg: string) => void }} args
 */
export async function analyzeFoodPhotos({ images, signal, onProgress }) {
  assertAnthropicKey();
  if (!images?.length) throw new Error('Need at least one photo to analyze.');

  onProgress?.('Sending photos to Claude…');

  const userContent = [
    ...images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType || 'image/jpeg',
        data: img.base64,
      },
    })),
    {
      type: 'text',
      text:
        images.length > 1
          ? `Here are ${images.length} photos of the same meal from different angles. Identify every component and estimate its nutrition.`
          : 'Identify every food component in this photo and estimate its nutrition.',
    },
  ];

  const data = await callAnthropic({
    system: SYSTEM_PROMPT_PHOTO,
    messages: [{ role: 'user', content: userContent }],
    signal,
  });

  onProgress?.('Tallying totals…');

  const text = pullText(data);
  if (!text) throw new Error('Claude returned no text.');
  return normalizeFinal(extractJson(text));
}

/**
 * @param {{ query: string, signal?: AbortSignal, onProgress?: (msg: string) => void }} args
 */
export async function analyzeFoodText({ query, signal, onProgress }) {
  assertAnthropicKey();
  const trimmed = (query ?? '').trim();
  if (!trimmed) throw new Error('Type what you ate to look it up.');

  onProgress?.('Asking Claude…');

  const data = await callAnthropic({
    system: SYSTEM_PROMPT_TEXT,
    messages: [{ role: 'user', content: trimmed }],
    signal,
  });

  const text = pullText(data);
  if (!text) throw new Error('Claude returned no text.');
  return normalizeFinal(extractJson(text));
}
