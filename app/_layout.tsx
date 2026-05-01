import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { StoreProvider } from '@/shared/state/store';
import { endLiveActivity } from '@/features/workouts/services/liveActivityService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    void endLiveActivity();
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <StoreProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="active-session"
              options={{
                presentation: 'modal',
                gestureEnabled: false,
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
