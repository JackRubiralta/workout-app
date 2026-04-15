import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, unstable_batchedUpdates } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useWorkoutConfig } from './src/hooks/useWorkoutConfig';
import { useWorkoutProgress } from './src/hooks/useWorkoutProgress';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { colors } from './src/constants/theme';

// When a notification arrives while the app is OPEN, suppress the banner —
// the in-app timer handles the alert visually and via haptics.
// (This handler is NOT called when the app is in the background — the OS handles
// delivery natively, which is what gives us the sound + vibration when backgrounded.)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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

  // Request notification permission and create Android vibration channel
  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('workout-timer', {
        name: 'Workout Timer',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 450, 120, 450, 120, 450],
        sound: null,
      }).catch(() => {});
    }
  }, []);

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
