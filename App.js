import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, unstable_batchedUpdates } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useWorkoutConfig } from './src/hooks/useWorkoutConfig';
import { useWorkoutProgress } from './src/hooks/useWorkoutProgress';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { colors } from './src/constants/theme';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.textSecondary} size="large" />
    </View>
  );
}

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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
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
        />
      ) : (
        <HomeScreen
          progress={workoutState.progress}
          doneDays={workoutState.doneDays}
          allDone={workoutState.allDone}
          resetAll={workoutState.resetAll}
          onSelectDay={setActiveDayIndex}
          days={config.days}
          updateDay={updateDay}
          addDay={addDay}
          deleteDay={handleDeleteDay}
          moveDay={handleMoveDay}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
