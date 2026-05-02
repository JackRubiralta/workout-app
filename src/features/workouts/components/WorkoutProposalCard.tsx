import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';
import { Button, StatusPill } from '@/shared/components';
import { exerciseTotalSets } from '../constants/exerciseDefaults';
import type { WorkoutConfig } from '../types/workoutTypes';
import type { AssistantMessage } from '../types/assistantTypes';

export type WorkoutProposalCardProps = {
  config: WorkoutConfig;
  summary: string | null;
  status: AssistantMessage['proposalStatus'];
  onApply: () => void;
  onDiscard: () => void;
};

export function WorkoutProposalCard({
  config,
  summary,
  status,
  onApply,
  onDiscard,
}: WorkoutProposalCardProps) {
  const totalDays = config.days.length;
  const totalExercises = config.days.reduce((acc, d) => acc + d.exercises.length, 0);
  const totalSets = config.days.reduce(
    (acc, d) => acc + d.exercises.reduce((a, ex) => a + exerciseTotalSets(ex), 0),
    0,
  );

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
        <Text style={s.eyebrow}>PROPOSED PROGRAM</Text>
        {statusLabel ? <StatusPill label={statusLabel.label} color={statusLabel.color} /> : null}
      </View>

      {summary ? <Text style={s.summary}>{summary}</Text> : null}

      <View style={s.metrics}>
        <Text style={s.metric}>
          <Text style={s.metricNum}>{totalDays}</Text> days
        </Text>
        <Text style={s.metricDot}>·</Text>
        <Text style={s.metric}>
          <Text style={s.metricNum}>{totalExercises}</Text> exercises
        </Text>
        <Text style={s.metricDot}>·</Text>
        <Text style={s.metric}>
          <Text style={s.metricNum}>{totalSets}</Text> sets / cycle
        </Text>
      </View>

      <View style={s.dayList}>
        {config.days.map((day, i) => (
          <View key={`${i}-${day.title}`} style={s.dayBlock}>
            <View style={s.dayHeader}>
              <View style={[s.dayDot, { backgroundColor: day.color }]} />
              <Text style={[s.dayTitle, { color: day.color }]} numberOfLines={1}>
                Day {i + 1} · {day.title}
              </Text>
              {day.focus ? (
                <Text style={s.dayFocus} numberOfLines={1}>
                  {day.focus}
                </Text>
              ) : null}
            </View>
            <View style={s.exList}>
              {day.exercises.map((ex, j) => (
                <Text key={j} style={s.exLine} numberOfLines={1}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMeta}>{`  ${ex.sets}×${ex.reps}`}</Text>
                </Text>
              ))}
            </View>
          </View>
        ))}
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

  metrics: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metric: { ...(text.monoCaption as TextStyle), color: colors.textSecondary, fontSize: fontSize.caption },
  metricNum: { color: colors.text, fontWeight: '700' },
  metricDot: { color: colors.textTertiary, fontSize: fontSize.caption },

  dayList: { gap: spacing.xs, marginTop: spacing.xs },
  dayBlock: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    gap: 4,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayTitle: {
    ...(text.monoSubhead as TextStyle),
    fontWeight: '700',
    color: colors.text,
    fontSize: fontSize.subhead,
  },
  dayFocus: {
    flex: 1,
    ...(text.monoCaption as TextStyle),
    color: colors.textTertiary,
    textAlign: 'right',
  },

  exList: { gap: 2, paddingLeft: spacing.md },
  exLine: { ...(text.monoCaption as TextStyle), color: colors.textSecondary, fontSize: fontSize.caption },
  exName: { color: colors.text, fontWeight: '600' },
  exMeta: { color: colors.textTertiary },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1, height: 48 },
});
