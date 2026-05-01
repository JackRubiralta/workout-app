import { Redirect } from 'expo-router';

// Initial entry — bounce to the Workout tab. This file is required because
// Expo Router doesn't auto-redirect `/` into the first tab when the tabs
// group lives at `app/(tabs)/`.
export default function Index() {
  return <Redirect href="/(tabs)/workout" />;
}
