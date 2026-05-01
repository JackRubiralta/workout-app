import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, fonts } from '@/shared/theme';
import { AppleIcon, ClockIcon, DumbbellIcon } from '@/shared/components/icons';

const TAB_ICON_SIZE = 22;
const TAB_BAR_HEIGHT = Platform.select({ ios: 80, default: 72 });
const TAB_BAR_PAD_TOP = 8;
const TAB_BAR_PAD_BOTTOM = Platform.select({ ios: 24, default: 12 });
const TAB_LABEL_GAP = 4;

// Bound the icon component so each tab is wired identically — colour
// swaps with focus, size is the shared constant.
function makeIcon(Icon: React.ComponentType<{ color: string; size?: number }>) {
  // eslint-disable-next-line react/display-name
  return ({ focused }: { focused: boolean }) => (
    <Icon color={focused ? colors.text : colors.textTertiary} size={TAB_ICON_SIZE} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="workout"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_BAR_HEIGHT,
          paddingTop: TAB_BAR_PAD_TOP,
          paddingBottom: TAB_BAR_PAD_BOTTOM,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: fonts.sans,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginTop: TAB_LABEL_GAP,
        },
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition', tabBarIcon: makeIcon(AppleIcon) }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout', tabBarIcon: makeIcon(DumbbellIcon) }} />
      <Tabs.Screen name="tracking" options={{ title: 'Tracking', tabBarIcon: makeIcon(ClockIcon) }} />
    </Tabs>
  );
}
