import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { RootNavigation } from './src/shell/navigation';
import { StoreProvider } from './src/shell/store';
import { endLiveActivity } from './src/native/liveActivity';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <StoreProvider>
          <RootNavigation />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
