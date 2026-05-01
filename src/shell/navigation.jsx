import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme';
import { WorkoutListScreen } from '../features/workout/WorkoutListScreen';
import { DayPreStartScreen } from '../features/workout/DayPreStartScreen';
import { ActiveSessionScreen } from '../features/workout/ActiveSessionScreen';
import { NutritionScreen } from '../features/nutrition/NutritionScreen';
import { FoodItemDetailScreen } from '../features/nutrition/FoodItemDetailScreen';
import { TrackingScreen } from '../features/tracking/TrackingScreen';
import { SessionDetailScreen } from '../features/tracking/SessionDetailScreen';
import { DumbbellIcon, AppleIcon, ClockIcon } from '../ui/icons';

// ─── Constants ──────────────────────────────────────────────────────────────
// Tab-bar dimensions tuned for a compact bar — no active-state pill, just
// icon-and-label with a clear focused/unfocused colour swap. The bottom
// inset on iOS covers the home-indicator gesture area.
const TAB_ICON_SIZE = 22;
// Heights tuned to fit icon (22) + label (10pt) + paddings cleanly. iOS
// adds a 24px home-indicator inset to the bottom; other platforms get a
// flat 12px. Was 88 / 78 originally — cutting ~10px off both by dropping
// the active-state pill above each icon.
const TAB_BAR_HEIGHT = Platform.select({ ios: 80, default: 72 });
const TAB_BAR_PAD_TOP = 8;
const TAB_BAR_PAD_BOTTOM = Platform.select({ ios: 24, default: 12 });
const TAB_LABEL_GAP = 4;

// ─── Stacks ─────────────────────────────────────────────────────────────────
// One stack per tab so each tab keeps its own back history when you switch
// away and back. `headerShown: false` because every screen renders its own
// chrome via <ScreenHeader> / <DetailHeader>.
const STACK_OPTIONS = { headerShown: false };

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTIONS}>
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="DayPreStart" component={DayPreStartScreen} />
    </Stack.Navigator>
  );
}

function TrackingStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTIONS}>
      <Stack.Screen name="TrackingHome" component={TrackingScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}

function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTIONS}>
      <Stack.Screen name="NutritionHome" component={NutritionScreen} />
      <Stack.Screen name="FoodItemDetail" component={FoodItemDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────
// Order in this array IS the visual left-to-right order of the bar.
// `Workout` sits in the middle and is the initial route (most-used).
const TABS = [
  { name: 'Nutrition', label: 'Nutrition', stack: NutritionStack, Icon: AppleIcon },
  { name: 'Workout',   label: 'Workout',   stack: WorkoutStack,   Icon: DumbbellIcon },
  { name: 'Tracking',  label: 'Tracking',  stack: TrackingStack,  Icon: ClockIcon },
];

// Factory for the tabBarIcon render-prop. Bound to the icon component so
// every tab's icon is wired identically — colour swaps with focus, size
// is the shared constant.
function makeTabIcon(Icon) {
  // eslint-disable-next-line react/display-name
  return ({ focused }) => (
    <Icon color={focused ? colors.text : colors.textTertiary} size={TAB_ICON_SIZE} />
  );
}

// ─── Theme ──────────────────────────────────────────────────────────────────
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.text,
    notification: colors.danger,
  },
};

const TAB_SCREEN_OPTIONS = {
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
};

function TabsNavigator() {
  return (
    <Tabs.Navigator initialRouteName="Workout" screenOptions={TAB_SCREEN_OPTIONS}>
      {TABS.map(({ name, label, stack: Component, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          component={Component}
          options={{ tabBarLabel: label, tabBarIcon: makeTabIcon(Icon) }}
        />
      ))}
    </Tabs.Navigator>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
// Modal-style root stack so ActiveSessionScreen presents over the tabs
// without the tab bar peeking through. Other screens live inside the
// per-tab stacks above.
const ROOT_OPTIONS = {
  headerShown: false,
  presentation: 'modal',
  gestureEnabled: false,
  animation: 'slide_from_bottom',
};

export function RootNavigation() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={ROOT_OPTIONS}>
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
