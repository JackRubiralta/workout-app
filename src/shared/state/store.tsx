import React, { createContext, useContext, type ReactNode } from 'react';
import { useWorkoutConfig, type UseWorkoutConfig } from '@/features/workouts/hooks/useWorkoutConfig';
import { useWorkoutSession, type UseWorkoutSession } from '@/features/workouts/hooks/useWorkoutSession';
import { useNutritionLog, type UseNutritionLog } from '@/features/nutrition/hooks/useNutritionLog';
import { useBodyWeight, type UseBodyWeight } from '@/features/tracking/hooks/useBodyWeight';
import { useSettings, type UseSettings } from '@/shared/hooks/useSettings';

// ── App-state composition layer ─────────────────────────────────────────────
// One context per persisted slice so consumers re-render only when their
// own slice changes. The previous shape was a single bag-context whose
// `value = { workout, session, nutrition, ... }` reference changed on
// every render and invalidated EVERY consumer.
//
// This file is the one place in /shared that imports from /features by
// design — it's the wiring layer that ties feature hooks into providers.
// Feature code depends on these accessors, not the other way around.

type SliceHandle<T> = {
  Provider: React.ComponentType<{ children: ReactNode }>;
  useSlice: () => T;
};

function makeSlice<T>(name: string, useHook: () => T): SliceHandle<T> {
  const Ctx = createContext<T | null>(null);
  Ctx.displayName = `${name}Context`;

  function Provider({ children }: { children: ReactNode }) {
    const value = useHook();
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function useSlice(): T {
    const v = useContext(Ctx);
    if (v == null) throw new Error(`use${name}Data must be used within <StoreProvider>`);
    return v;
  }

  return { Provider, useSlice };
}

const Workout = makeSlice<UseWorkoutConfig>('Workout', useWorkoutConfig);
const Session = makeSlice<UseWorkoutSession>('Session', useWorkoutSession);
const Nutrition = makeSlice<UseNutritionLog>('Nutrition', useNutritionLog);
const BodyWeight = makeSlice<UseBodyWeight>('BodyWeight', useBodyWeight);
const Settings = makeSlice<UseSettings>('Settings', useSettings);

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Settings.Provider>
      <Workout.Provider>
        <Session.Provider>
          <Nutrition.Provider>
            <BodyWeight.Provider>{children}</BodyWeight.Provider>
          </Nutrition.Provider>
        </Session.Provider>
      </Workout.Provider>
    </Settings.Provider>
  );
}

// Domain accessors — name = "<Domain>Data" by convention so it reads as
// "this comes from the persisted store" at the call site:
//
//   const { unitSystem } = useSettingsData();
//
export const useWorkoutData = Workout.useSlice;
export const useSessionData = Session.useSlice;
export const useNutritionData = Nutrition.useSlice;
export const useBodyWeightData = BodyWeight.useSlice;
export const useSettingsData = Settings.useSlice;

export function useStoreLoaded(): boolean {
  return (
    useWorkoutData().loaded &&
    useSessionData().loaded &&
    useNutritionData().loaded &&
    useBodyWeightData().loaded &&
    useSettingsData().loaded
  );
}
