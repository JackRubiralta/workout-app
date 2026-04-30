import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, macroColors, radius, spacing, text } from '../../theme';

export function DailyTotalsBar({ totals, goals }) {
  const cells = [
    { label: 'Cal', val: totals.calories, goal: goals.calories, color: macroColors.calories, unit: '' },
    { label: 'P', val: totals.protein, goal: goals.protein, color: macroColors.protein, unit: 'g' },
    { label: 'C', val: totals.carbs, goal: goals.carbs, color: macroColors.carbs, unit: 'g' },
    { label: 'F', val: totals.fat, goal: goals.fat, color: macroColors.fat, unit: 'g' },
    { label: 'Fiber', val: totals.fiber, goal: null, color: colors.textSecondary, unit: 'g' },
  ];
  return (
    <View style={s.wrap}>
      <Text style={[text.eyebrow, { color: colors.textTertiary, marginLeft: 2 }]}>DAILY TOTALS</Text>
      <View style={s.card}>
        <View style={s.row}>
          {cells.map(c => (
            <View key={c.label} style={s.cell}>
              <Text style={[s.val, { color: c.color }]}>
                {Math.round(c.val)}{c.unit ? <Text style={s.unit}>{c.unit}</Text> : null}
              </Text>
              <Text style={s.label}>{c.label}</Text>
              {c.goal != null
                ? <Text style={s.remaining}>{Math.max(c.goal - Math.round(c.val), 0)} left</Text>
                : <Text style={s.remaining}> </Text>}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { alignItems: 'center', flex: 1, gap: 2 },
  val: { ...text.monoNumber, fontSize: fontSize.title3 },
  unit: { fontSize: fontSize.footnote, fontWeight: '600', color: colors.textTertiary },
  label: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1, textTransform: 'uppercase' },
  remaining: { fontSize: 9, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 0.3 },
});
