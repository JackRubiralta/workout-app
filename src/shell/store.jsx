import React, { createContext, useContext } from 'react';
import { useWorkoutConfig } from '../features/workout/hooks/useWorkoutConfig';
import { useWorkoutSession } from '../features/workout/hooks/useWorkoutSession';
import { useNutritionLog } from '../features/nutrition/hooks/useNutritionLog';
import { useBodyWeight } from '../features/tracking/hooks/useBodyWeight';
import { useSettings } from '../hooks/useSettings';

// ── Slice factory ──────────────────────────────────────────────────────────
// Pair a domain hook with its own context so consumers of one slice don't
// re-render when an unrelated slice's state changes. The previous shape was
// a single bag-context whose `value = { workout, session, nutrition, ... }`
// reference changed on every render, invalidating EVERY consumer regardless
// of what actually changed. Splitting per-domain scopes the invalidation.
//
// Returns { Provider, useSlice } pair. Each underlying hook is responsible
// for memoising its own return value (all of them already do).
function makeSlice(name, useHook) {
  const Ctx = createContext(null);
  Ctx.displayName = `${name}Context`;
  function Provider({ children }) {
    const value = useHook();
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }
  function useSlice() {
    const v = useContext(Ctx);
    if (!v) throw new Error(`use${name}Data must be used within <StoreProvider>`);
    return v;
  }
  return { Provider, useSlice };
}

const Workout    = makeSlice('Workout',    useWorkoutConfig);
const Session    = makeSlice('Session',    useWorkoutSession);
const Nutrition  = makeSlice('Nutrition',  useNutritionLog);
const BodyWeight = makeSlice('BodyWeight', useBodyWeight);
const Settings   = makeSlice('Settings',   useSettings);

// Settings sits outermost since it's the most likely future dependency for
// other slices (e.g. unit-system-aware migrations). No slice currently
// reads from another's context, so order is otherwise arbitrary.
export function StoreProvider({ children }) {
  return (
    <Settings.Provider>
      <Workout.Provider>
        <Session.Provider>
          <Nutrition.Provider>
            <BodyWeight.Provider>
              {children}
            </BodyWeight.Provider>
          </Nutrition.Provider>
        </Session.Provider>
      </Workout.Provider>
    </Settings.Provider>
  );
}

// Domain accessors — name = "<Domain>Data" by convention so it reads as
// "this comes from the persisted store" at the call site:
//   const { unitSystem } = useSettingsData();
export const useWorkoutData    = Workout.useSlice;
export const useSessionData    = Session.useSlice;
export const useNutritionData  = Nutrition.useSlice;
export const useBodyWeightData = BodyWeight.useSlice;
export const useSettingsData   = Settings.useSlice;

// All-slices-loaded gate. Used at the app root to delay first paint until
// every persisted blob has hydrated; the sub-hooks each expose `loaded`.
// Subscribes to every slice — fine here because this hook only runs in the
// app shell, not inside hot screens.
export function useStoreLoaded() {
  return useWorkoutData().loaded
      && useSessionData().loaded
      && useNutritionData().loaded
      && useBodyWeightData().loaded
      && useSettingsData().loaded;
}
