import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, fontSize, macroColors, radius, spacing, surfaces, text } from '@/shared/theme';
import { Button, StatusPill } from '@/shared/components';
import type { MacroGoals } from '@/features/nutrition/types/nutritionTypes';
import type { ProposalStatus } from '../../types/coachTypes';

export type MacroGoalsProposalCardProps = {
  next: MacroGoals;
  current: MacroGoals;
  summary: string | null;
  status: ProposalStatus | undefined;
  onApply: () => void;
  onDiscard: () => void;
};

type Field = {
  key: keyof MacroGoals;
  label: string;
  unit: string;
  color: string;
};

const FIELDS: ReadonlyArray<Field> = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: macroColors.calories },
  { key: 'protein', label: 'Protein', unit: 'g', color: macroColors.protein },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: macroColors.carbs },
  { key: 'fat', label: 'Fat', unit: 'g', color: macroColors.fat },
  { key: 'fiber', label: 'Fiber', unit: 'g', color: macroColors.fiber },
];

function formatDelta(delta: number): string | null {
  if (delta === 0) return null;
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${Math.abs(delta)}`;
}

export function MacroGoalsProposalCard({
  next,
  current,
  summary,
  status,
  onApply,
  onDiscard,
}: MacroGoalsProposalCardProps) {
  const isPending = status === 'pending' || status == null;
  const statusLabel =
    status === 'applied'
      ? { label: 'APPLIED', color: colors.success }
      : status === 'discarded'
        ? { label: 'DISCARDED', color: colors.textTertiary }
        : null;

  return (
    <View style={[s.card, !isPending && s.cardDimmed]}>
      <View style={s.head}>
        <Text style={s.eyebrow}>PROPOSED MACROS</Text>
        {statusLabel ? <StatusPill label={statusLabel.label} color={statusLabel.color} /> : null}
      </View>

      {summary ? <Text style={s.summary}>{summary}</Text> : null}

      <View style={s.fieldList}>
        {FIELDS.map(f => {
          const delta = next[f.key] - current[f.key];
          const deltaLabel = formatDelta(delta);
          return (
            <View key={f.key} style={s.fieldRow}>
              <View style={[s.dot, { backgroundColor: f.color }]} />
              <Text style={s.fieldLabel}>{f.label}</Text>
              <Text style={s.fieldFromText}>{current[f.key]}</Text>
              <Text style={s.fieldArrow}>→</Text>
              <Text style={s.fieldToText}>{next[f.key]}</Text>
              <Text style={s.fieldUnit}>{f.unit}</Text>
              {deltaLabel ? (
                <Text
                  style={[
                    s.fieldDelta,
                    { color: delta > 0 ? colors.success : colors.warning },
                  ]}
                >
                  {deltaLabel}
                </Text>
              ) : (
                <Text style={[s.fieldDelta, s.fieldDeltaSame]}>—</Text>
              )}
            </View>
          );
        })}
      </View>

      {isPending ? (
        <View style={s.actions}>
          <Button label="Discard" variant="outline" onPress={onDiscard} style={s.actionBtn} />
          <Button label="Apply" onPress={onApply} style={s.actionBtn} color={colors.success} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    ...surfaces.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.borderStrong,
  },
  cardDimmed: { opacity: 0.55 },

  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { ...(text.eyebrowSmall as TextStyle), color: colors.textSecondary },
  summary: { ...(text.callout as TextStyle), color: colors.text },

  fieldList: {
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  fieldLabel: {
    ...(text.callout as TextStyle),
    flex: 1,
    color: colors.text,
    fontWeight: '600',
    fontSize: fontSize.subhead,
  },
  fieldFromText: {
    ...(text.monoCaption as TextStyle),
    color: colors.textTertiary,
    fontSize: fontSize.footnote,
  },
  fieldArrow: {
    color: colors.textTertiary,
    fontSize: fontSize.footnote,
    paddingHorizontal: 2,
  },
  fieldToText: {
    ...(text.monoSubhead as TextStyle),
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSize.subhead,
  },
  fieldUnit: {
    ...(text.monoCaption as TextStyle),
    color: colors.textTertiary,
    width: 32,
    fontSize: fontSize.caption,
  },
  fieldDelta: {
    ...(text.monoCaption as TextStyle),
    fontWeight: '700',
    fontSize: fontSize.caption,
    minWidth: 36,
    textAlign: 'right',
  },
  fieldDeltaSame: { color: colors.textMuted },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, height: 48 },
});
