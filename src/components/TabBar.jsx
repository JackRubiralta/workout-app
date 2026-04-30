import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, fonts } from '../constants/theme';

// ─── Tab Icons (24x24 SVG) ──────────────────────────────────────────────────

function ProgramIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 10h16M4 14h10M4 18h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WorkoutIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 6.5V17.5M17.5 6.5V17.5M6.5 12H17.5M2 9V15M22 9V15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function HistoryIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NutritionIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Fork */}
      <Path
        d="M7 3V9C7 10.1046 7.89543 11 9 11V21M5 3V8M9 3V8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Knife */}
      <Path
        d="M17 3C15.3431 3 14 4.34315 14 6V11C14 12.1046 14.8954 13 16 13H17V21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Tab Definitions ────────────────────────────────────────────────────────

const TABS = [
  { key: 'program', label: 'Program', Icon: ProgramIcon },
  { key: 'workout', label: 'Workout', Icon: WorkoutIcon },
  { key: 'nutrition', label: 'Nutrition', Icon: NutritionIcon },
  { key: 'history', label: 'History', Icon: HistoryIcon },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function TabBar({ activeTab, onTabChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      <View style={styles.divider} />
      <View style={styles.tabs}>
        {TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          const iconColor = isActive ? colors.text : colors.textTertiary;

          return (
            <TouchableOpacity
              key={key}
              style={styles.tab}
              onPress={() => {
                if (!isActive) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onTabChange(key);
                }
              }}
              activeOpacity={0.7}
            >
              <Icon color={iconColor} />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.text,
  },
});
