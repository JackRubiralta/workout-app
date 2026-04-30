import React, { createContext, useContext } from 'react';
import { useWorkoutConfig } from '../features/workout/hooks/useWorkoutConfig';
import { useWorkoutSession } from '../features/workout/hooks/useWorkoutSession';
import { useNutritionLog } from '../features/nutrition/hooks/useNutritionLog';
import { useBodyWeight } from '../features/history/hooks/useBodyWeight';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const config = useWorkoutConfig();
  const session = useWorkoutSession();
  const nutrition = useNutritionLog();
  const bodyweight = useBodyWeight();
  const value = { config, session, nutrition, bodyweight };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}

export function useWorkoutData() {
  return useStore().config;
}
export function useSessionData() {
  return useStore().session;
}
export function useNutritionData() {
  return useStore().nutrition;
}
export function useBodyWeightData() {
  return useStore().bodyweight;
}

export function useStoreLoaded() {
  const { config, session, nutrition, bodyweight } = useStore();
  return config.loaded && session.loaded && nutrition.loaded && bodyweight.loaded;
}
