<<<<<<< HEAD
import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
=======
import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, unstable_batchedUpdates } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWorkoutConfig } from './src/hooks/useWorkoutConfig';
>>>>>>> 1f5a396 (s)
import { useWorkoutProgress } from './src/hooks/useWorkoutProgress';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { colors } from './src/constants/theme';

<<<<<<< HEAD
// ─── Loading Splash ───────────────────────────────────────────────────────────

=======
>>>>>>> 1f5a396 (s)
function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.textSecondary} size="large" />
    </View>
  );
}

<<<<<<< HEAD
// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeDayIndex, setActiveDayIndex] = useState(null); // null = home
  const workoutState = useWorkoutProgress();

  const handleSelectDay = (index) => setActiveDayIndex(index);
  const handleBack = () => setActiveDayIndex(null);
=======
export default function App() {
  const [activeDayIndex, setActiveDayIndex] = useState(null);
  const { config, loaded: configLoaded, updateDay, addDay, deleteDay, reorderDay } = useWorkoutConfig();
  const workoutState = useWorkoutProgress(config.days);
  const { removeDayProgress, reorderDayProgress } = workoutState;
  const isLoaded = configLoaded && workoutState.loaded;

  const handleDeleteDay = useCallback((dayIndex) => {
    unstable_batchedUpdates(() => {
      removeDayProgress(dayIndex);
      deleteDay(dayIndex);
    });
  }, [deleteDay, removeDayProgress]);

  const handleMoveDay = useCallback((fromIndex, toIndex) => {
    unstable_batchedUpdates(() => {
      reorderDayProgress(fromIndex, toIndex);
      reorderDay(fromIndex, toIndex);
    });
  }, [reorderDay, reorderDayProgress]);
>>>>>>> 1f5a396 (s)

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
<<<<<<< HEAD
      {!workoutState.loaded ? (
        <LoadingScreen />
      ) : activeDayIndex !== null ? (
        <WorkoutScreen
          key={activeDayIndex} // remount per day to reset timer state
          dayIndex={activeDayIndex}
          onBack={handleBack}
          progress={workoutState.progress}
          doneDays={workoutState.doneDays}
          markSetDone={workoutState.markSetDone}
          getNextSet={workoutState.getNextSet}
=======
      {!isLoaded ? (
        <LoadingScreen />
      ) : activeDayIndex !== null ? (
        <WorkoutScreen
          key={activeDayIndex}
          dayIndex={activeDayIndex}
          onBack={() => setActiveDayIndex(null)}
          progress={workoutState.progress}
          doneDays={workoutState.doneDays}
          markSetDone={workoutState.markSetDone}
          unmarkSetDone={workoutState.unmarkSetDone}
          getNextSet={workoutState.getNextSet}
          days={config.days}
>>>>>>> 1f5a396 (s)
        />
      ) : (
        <HomeScreen
          progress={workoutState.progress}
          doneDays={workoutState.doneDays}
          allDone={workoutState.allDone}
          resetAll={workoutState.resetAll}
<<<<<<< HEAD
          onSelectDay={handleSelectDay}
=======
          onSelectDay={setActiveDayIndex}
          days={config.days}
          updateDay={updateDay}
          addDay={addDay}
          deleteDay={handleDeleteDay}
          moveDay={handleMoveDay}
>>>>>>> 1f5a396 (s)
        />
      )}
    </SafeAreaProvider>
  );
}

<<<<<<< HEAD
// ─── Styles ───────────────────────────────────────────────────────────────────

=======
>>>>>>> 1f5a396 (s)
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
