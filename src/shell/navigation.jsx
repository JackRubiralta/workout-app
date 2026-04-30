import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, fonts } from '../theme';
import { WorkoutListScreen } from '../features/workout/WorkoutListScreen';
import { DayPreStartScreen } from '../features/workout/DayPreStartScreen';
import { ActiveSessionScreen } from '../features/workout/ActiveSessionScreen';
import { NutritionScreen } from '../features/nutrition/NutritionScreen';
import { FoodItemDetailScreen } from '../features/nutrition/FoodItemDetailScreen';
import { HistoryListScreen } from '../features/history/HistoryListScreen';
import { SessionDetailScreen } from '../features/history/SessionDetailScreen';
import { DumbbellIcon, AppleIcon, ClockIcon } from './icons';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

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

function WorkoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutList" component={WorkoutListScreen} />
      <Stack.Screen name="DayPreStart" component={DayPreStartScreen} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HistoryList" component={HistoryListScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}

function NutritionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NutritionHome" component={NutritionScreen} />
      <Stack.Screen name="FoodItemDetail" component={FoodItemDetailScreen} />
    </Stack.Navigator>
  );
}

function tabIcon(Icon) {
  return ({ focused }) => (
    <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: 22, height: 3, borderRadius: 1.5,
          backgroundColor: focused ? colors.text : 'transparent',
          marginBottom: 6,
        }}
      />
      <Icon color={focused ? colors.text : colors.textTertiary} size={22} />
    </View>
  );
}

function TabsNavigator() {
  return (
    <Tabs.Navigator
      initialRouteName="Workout"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen name="Nutrition" component={NutritionStack} options={{ tabBarIcon: tabIcon(AppleIcon) }} />
      <Tabs.Screen name="Workout" component={WorkoutStack} options={{ tabBarIcon: tabIcon(DumbbellIcon) }} />
      <Tabs.Screen name="History" component={HistoryStack} options={{ tabBarLabel: 'Tracking', tabBarIcon: tabIcon(ClockIcon) }} />
    </Tabs.Navigator>
  );
}

export function RootNavigation() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ animation: 'fade' }} />
        <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 88 : 78,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.sans,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});
