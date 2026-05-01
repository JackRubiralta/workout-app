import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, surfaces, text } from '../../theme';

// Vertical stat cell — big mono number stacked over a small uppercase
// label, optionally with a sub line below. Used in stat rows across
// DayPreStartScreen, SessionDetailScreen, ExerciseHistorySheet.
//
//   <StatCard value={count} label="EXERCISES" />
//   <StatCard value="42" label="VOLUME (lb)" sub="× 8 reps" />
export function StatCard({ value, label, sub, valueColor, style }) {
  return (
    <View style={[styles.cell, style]}>
      <Text style={[styles.value, valueColor && { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    ...surfaces.row,
    flex: 1, alignItems: 'center', gap: 2,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm,
  },
  value: { ...text.monoNumber, fontSize: fontSize.title3 },
  label: { ...text.eyebrowSmall },
  sub: { ...text.monoCaption, color: colors.textSecondary, marginTop: 2 },
});
