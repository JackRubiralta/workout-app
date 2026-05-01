import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, surfaces, text } from '../../theme';

function Stat({ value, label, accent }) {
  return (
    <View style={s.stat}>
      <Text style={[s.value, accent && { color: accent }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

// Four equal columns, divider between each. The previous layout split into
// 3+2 rows with bottom cells centred between top columns — visually
// unbalanced. The TOTAL stat lived here too, but `SESSIONS · N` directly
// below restated it so it was dropped.
export function SummaryCard({ thisWeek, thisMonth, currentStreak, longestStreak }) {
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
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  value: { ...text.monoNumber, fontSize: 22 },
  label: { ...text.eyebrowSmall, textAlign: 'center' },
});
