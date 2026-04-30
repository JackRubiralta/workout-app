import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, text } from '../../theme';

function Stat({ value, label, accent }) {
  return (
    <View style={s.stat}>
      <Text style={[s.value, accent && { color: accent }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

export function SummaryCard({ thisWeek, thisMonth, currentStreak, longestStreak, totalSessions }) {
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <Stat value={thisWeek} label="This week" accent={colors.success} />
        <View style={s.divider} />
        <Stat value={thisMonth} label="This month" />
        <View style={s.divider} />
        <Stat value={totalSessions} label="Total" />
      </View>
      {(currentStreak > 0 || longestStreak > 0) && (
        <View style={s.streakRow}>
          <View style={s.streak}>
            <Text style={s.streakValue}>{currentStreak}</Text>
            <Text style={s.streakLabel}>CURRENT STREAK</Text>
          </View>
          <View style={s.streak}>
            <Text style={s.streakValue}>{longestStreak}</Text>
            <Text style={s.streakLabel}>LONGEST STREAK</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.xs },
  value: { ...text.monoNumber },
  label: { ...text.eyebrowSmall },

  streakRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  streak: { flex: 1, alignItems: 'center', gap: 2 },
  streakValue: { ...text.monoNumber, color: colors.success },
  streakLabel: { ...text.eyebrowSmall },
});
