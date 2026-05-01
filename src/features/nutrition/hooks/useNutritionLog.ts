import { useCallback, useMemo } from 'react';
import { KEYS } from '@/storage/keys';
import { usePersistedState } from '@/storage/usePersistedState';
import { roundInt, roundTenths } from '@/shared/utils/format';
import { DEFAULT_GOALS } from '../constants/nutritionConstants';
import { makeId } from '@/shared/utils/ids';
import type {
  FoodComponent,
  FoodEntry,
  FoodPhoto,
  MacroGoals,
  NutritionState,
} from '../types/nutritionTypes';

function normalizeFood(it: Partial<FoodComponent> | null | undefined): FoodComponent {
  return {
    name: String(it?.name ?? 'Item'),
    quantity: Number(it?.quantity ?? 1),
    unit: String(it?.unit ?? 'serving'),
    calories: roundInt(it?.calories),
    protein: roundTenths(it?.protein),
    carbs: roundTenths(it?.carbs),
    fat: roundTenths(it?.fat),
    fiber: roundTenths(it?.fiber),
  };
}

const INITIAL: NutritionState = { logsByDate: {}, goals: DEFAULT_GOALS };

function hydrate(stored: unknown): NutritionState {
  const s = (stored ?? {}) as Partial<NutritionState>;
  return {
    logsByDate: s.logsByDate ?? {},
    goals: { ...DEFAULT_GOALS, ...(s.goals ?? {}) },
  };
}

type AddFoodInput = Partial<FoodEntry> & {
  components?: ReadonlyArray<Partial<FoodComponent>>;
};

export type UseNutritionLog = NutritionState & {
  loaded: boolean;
  addFood: (
    dateKey: string,
    item: AddFoodInput,
    photos?: ReadonlyArray<FoodPhoto | string>,
  ) => void;
  removeFood: (dateKey: string, itemId: string) => void;
  setGoals: (next: Partial<MacroGoals>) => void;
};

export function useNutritionLog(): UseNutritionLog {
  const [state, setState, loaded] = usePersistedState<NutritionState>(
    KEYS.nutrition,
    INITIAL,
    hydrate,
  );
  const { logsByDate, goals } = state;

  const addFood = useCallback(
    (dateKey: string, item: AddFoodInput, photos: ReadonlyArray<FoodPhoto | string> = []) => {
      const components: FoodComponent[] | null =
        Array.isArray(item.components) && item.components.length
          ? item.components.map(normalizeFood)
          : null;
      const entry: FoodEntry = {
        ...normalizeFood(item),
        id: makeId('f'),
        addedAt: new Date().toISOString(),
        photos: Array.isArray(photos)
          ? photos.slice(0, 3).map(p =>
              typeof p === 'string'
                ? { uri: p }
                : { uri: p.uri ?? '', mediaType: p.mediaType },
            )
          : [],
        source: item.source ?? null,
        notes: item.notes ?? null,
        confidence: item.confidence ?? null,
        components,
      };
      setState(prev => ({
        ...prev,
        logsByDate: {
          ...prev.logsByDate,
          [dateKey]: [...(prev.logsByDate[dateKey] ?? []), entry],
        },
      }));
    },
    [setState],
  );

  const removeFood = useCallback(
    (dateKey: string, itemId: string) => {
      setState(prev => {
        const day = prev.logsByDate[dateKey];
        if (!day) return prev;
        return {
          ...prev,
          logsByDate: { ...prev.logsByDate, [dateKey]: day.filter(it => it.id !== itemId) },
        };
      });
    },
    [setState],
  );

  const setGoals = useCallback(
    (next: Partial<MacroGoals>) => {
      setState(prev => ({ ...prev, goals: { ...prev.goals, ...next } }));
    },
    [setState],
  );

  return useMemo(
    () => ({ loaded, logsByDate, goals, addFood, removeFood, setGoals }),
    [loaded, logsByDate, goals, addFood, removeFood, setGoals],
  );
}
