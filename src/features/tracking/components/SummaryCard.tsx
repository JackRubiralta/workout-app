import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, spacing, surfaces, text } from '@/shared/theme';

type StatProps = {
  value: number;
  label: string;
  accent?: string;
};

function Stat({ value, label, accent }: StatProps) {
  return (
    <View style={s.stat}>
      <Text style={[s.value, accent && { color: accent }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

export type SummaryCardProps = {
  thisWeek: number;
  thisMonth: number;
  currentStreak: number;
  longestStreak: number;
};

export function SummaryCard({ thisWeek, thisMonth, currentStreak, longestStreak }: SummaryCardProps) {
  return (
    <View style={s.wrap}>
      <Stat value={thisWeek} label="This week" accent={thisWeek > 0 ? colors.success : undefined} />
      <View style={s.divider} />
      <Stat value={thisMonth} label="This month" />
      <View style={s.divider} />
      <Stat value={currentStreak} label="Streak" accent={currentStreak > 0 ? colors.success : undefined} />
      <View style={s.divider} />
      <Stat value={longestStreak} label="Best" />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...surfaces.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  value: { ...(text.monoNumber as TextStyle), fontSize: 22 },
  label: { ...(text.eyebrowSmall as TextStyle), textAlign: 'center' },
});
