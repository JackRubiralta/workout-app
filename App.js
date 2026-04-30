import React, { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, unstable_batchedUpdates } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useWorkoutConfig } from './src/hooks/useWorkoutConfig';
import { useWorkoutProgress } from './src/hooks/useWorkoutProgress';
import { useWorkoutLog } from './src/hooks/useWorkoutLog';
import { useNutritionLog } from './src/hooks/useNutritionLog';
import { HomeScreen } from './src/screens/HomeScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { TabBar } from './src/components/TabBar';
import { colors } from './src/constants/theme';
import { endLiveActivity } from './src/modules/liveActivity';

// Show notification banner + sound when rest timer completes (even in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
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
  const [activeTab, setActiveTab] = useState('workout');

  const { config, loaded: configLoaded, updateDay, addDay, deleteDay, reorderDay } = useWorkoutConfig();
  const workoutState = useWorkoutProgress(config.days);
  const workoutLog = useWorkoutLog();
  const nutritionLog = useNutritionLog();
  const { removeDayProgress, reorderDayProgress } = workoutState;

  const isLoaded = configLoaded && workoutState.loaded && workoutLog.loaded && nutritionLog.loaded;

  useEffect(() => {
    // Clean up stale live activities and notifications from a previous session
    // (e.g. user killed the app while a rest timer was active)
    endLiveActivity();
    Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

    Notifications.requestPermissionsAsync().catch(() => {});

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('workout-timer', {
        name: 'Workout Timer',
        importance: Notifications.AndroidImportance.HIGH,
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
      ) : (
        <>
          <View style={styles.content}>
            <View style={[StyleSheet.absoluteFill, activeTab !== 'program' && styles.hiddenTab]}>
              <HomeScreen
                progress={workoutState.progress}
                doneDays={workoutState.doneDays}
                allDone={workoutState.allDone}
                resetAll={workoutState.resetAll}
                days={config.days}
                updateDay={updateDay}
                addDay={addDay}
                deleteDay={handleDeleteDay}
                moveDay={handleMoveDay}
              />
            </View>
            <View style={[StyleSheet.absoluteFill, activeTab !== 'workout' && styles.hiddenTab]}>
              <WorkoutScreen
                days={config.days}
                progress={workoutState.progress}
                doneDays={workoutState.doneDays}
                allDone={workoutState.allDone}
                resetAll={workoutState.resetAll}
                markSetDone={workoutState.markSetDone}
                unmarkSetDone={workoutState.unmarkSetDone}
                getNextSet={workoutState.getNextSet}
                logSet={workoutLog.logSet}
                getLastWeight={workoutLog.getLastWeight}
                getLastReps={workoutLog.getLastReps}
                startSession={workoutLog.startSession}
                completeSession={workoutLog.completeSession}
              />
            </View>
            <View style={[StyleSheet.absoluteFill, activeTab !== 'nutrition' && styles.hiddenTab]}>
              <NutritionScreen
                logsByDate={nutritionLog.logsByDate}
                goals={nutritionLog.goals}
                addFood={nutritionLog.addFood}
                removeFood={nutritionLog.removeFood}
                setGoals={nutritionLog.setGoals}
              />
            </View>
            <View style={[StyleSheet.absoluteFill, activeTab !== 'history' && styles.hiddenTab]}>
              <HistoryScreen
                sessions={workoutLog.sessions}
                deleteSession={workoutLog.deleteSession}
                clearHistory={workoutLog.clearHistory}
              />
            </View>
          </View>
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </>
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
  content: {
    flex: 1,
  },
  hiddenTab: {
    display: 'none',
  },
});
