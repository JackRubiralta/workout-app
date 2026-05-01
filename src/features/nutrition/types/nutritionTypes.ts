// Domain types for the nutrition feature.

export type FoodSourceValue = 'photo' | 'text' | 'manual';
export type ConfidenceValue = 'high' | 'medium' | 'low';

export type MacroSet = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type FoodPhoto = {
  uri: string;
  mediaType?: string;
};

/** Sub-component of a multi-component meal (e.g. each item on a plate). */
export type FoodComponent = {
  name: string;
  quantity: number;
  unit: string;
} & MacroSet;

export type FoodEntry = FoodComponent & {
  id: string;
  addedAt: string;
  photos: FoodPhoto[];
  source: FoodSourceValue | null;
  notes: string | null;
  confidence: ConfidenceValue | null;
  components: FoodComponent[] | null;
};

export type LogsByDate = Record<string, FoodEntry[]>;
export type MacroGoals = MacroSet;

export type NutritionState = {
  logsByDate: LogsByDate;
  goals: MacroGoals;
};

// ─── AI service shapes ─────────────────────────────────────────────────────

export type AnalyzeImageInput = {
  base64: string;
  mediaType?: string;
};

export type AnalyzeFoodArgs = {
  images?: AnalyzeImageInput[];
  query?: string;
  signal?: AbortSignal;
  onProgress?: (msg: string) => void;
};

export type AnalyzedItem = FoodComponent;

export type AnalyzeFoodResult = {
  foodDetected: boolean;
  items: AnalyzedItem[];
  totals: MacroSet;
  confidence: ConfidenceValue;
  notes: string;
  mealName: string | null;
};
