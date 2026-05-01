import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, surfaces, text } from '../../theme';
import { Sheet, SectionLabel, Sparkline, StatCard } from '../../ui';
import { useSessionData, useSettingsData } from '../../shell/store';
import { topSetPerSession, personalRecords, epley } from './logic/suggestions';
import { formatDateShort } from '../../utils/date';
import { fromLb, unitLabel } from '../../utils/units';
import { MAX_HISTORY_POINTS } from '../../constants/tracking';
import { copy } from '../../copy';

export function ExerciseHistorySheet({ visible, exerciseName, dayColor, onClose }) {
  const { sessions } = useSessionData();
  const { unitSystem } = useSettingsData();
  const unit = unitLabel(unitSystem);
  const round1 = (n) => Math.round(n * 10) / 10;

  const topSets = useMemo(() => {
    if (!exerciseName) return [];
    // newest first → oldest first for charting, capped at MAX_HISTORY_POINTS
    return topSetPerSession(sessions, exerciseName).slice(0, MAX_HISTORY_POINTS).reverse();
  }, [sessions, exerciseName]);

  const prs = useMemo(() => {
    if (!exerciseName) return { bestWeight: null, bestE1RM: null };
    return personalRecords(sessions, exerciseName);
  }, [sessions, exerciseName]);

  const points = useMemo(
    () => topSets.map(({ entry }) => ({ value: round1(fromLb(entry.weight, unitSystem)) })),
    [topSets, unitSystem],
  );
  const e1rmPoints = useMemo(
    () => topSets.map(({ entry }) => ({ value: Math.round(fromLb(epley(entry.weight, entry.reps), unitSystem)) })),
    [topSets, unitSystem],
  );

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={s.body}>
        <View style={s.header}>
          <View style={[s.dot, { backgroundColor: dayColor ?? colors.text }]} />
          <Text style={[text.title3, { fontSize: fontSize.headline, flex: 1 }]} numberOfLines={1}>
            {exerciseName ?? ''}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }} showsVerticalScrollIndicator={false}>
          {topSets.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>{copy.empty.exerciseHistory.title}</Text>
              <Text style={s.emptySub}>{copy.empty.exerciseHistory.subtitle}</Text>
            </View>
          ) : (
            <>
              <View style={s.statsGrid}>
                <StatCard
                  value={prs.bestWeight ? round1(fromLb(prs.bestWeight.weight, unitSystem)) : '—'}
                  label={`BEST WEIGHT (${unit})`}
                  sub={prs.bestWeight ? `× ${prs.bestWeight.reps} reps` : undefined}
                />
                <StatCard
                  value={prs.bestE1RM ? Math.round(fromLb(epley(prs.bestE1RM.weight, prs.bestE1RM.reps), unitSystem)) : '—'}
                  label="e1RM (Epley)"
                  sub={prs.bestE1RM ? `${round1(fromLb(prs.bestE1RM.weight, unitSystem))} × ${prs.bestE1RM.reps}` : undefined}
                />
              </View>

              <View style={s.chartSection}>
                <SectionLabel style={s.chartLabel}>TOP SET ({unit}) · LAST {topSets.length}</SectionLabel>
                <Sparkline points={points} color={dayColor ?? colors.text} height={88} />
              </View>

              <View style={s.chartSection}>
                <SectionLabel style={s.chartLabel}>e1RM TREND · LAST {topSets.length}</SectionLabel>
                <Sparkline points={e1rmPoints} color={colors.text} height={88} />
              </View>

              <View style={s.list}>
                <SectionLabel style={s.chartLabel}>SESSIONS</SectionLabel>
                {[...topSets].reverse().map(({ entry, session }, i) => (
                  <View key={i} style={s.row}>
                    <Text style={s.rowDate}>{formatDateShort(session.startedAt)}</Text>
                    <Text style={s.rowDay} numberOfLines={1}>{session.dayTitle}</Text>
                    <Text style={s.rowValue}>
                      {round1(fromLb(entry.weight, unitSystem))}<Text style={s.rowUnit}> {unit}</Text> × {entry.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, maxHeight: 720 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },

  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.xs },
  emptyTitle: { ...text.title3, color: colors.textSecondary },
  emptySub: { ...text.bodySecondary, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: spacing.md, lineHeight: 20 },

  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },

  chartSection: { gap: spacing.xs, marginBottom: spacing.md },
  chartLabel: { marginBottom: 2 },

  list: { gap: 4 },
  row: {
    ...surfaces.inset,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  rowDate: { ...text.monoCaption, color: colors.textSecondary, width: 56 },
  rowDay: { flex: 1, ...text.monoFootnote, color: colors.text, fontWeight: '600' },
  rowValue: { ...text.monoSubhead, fontWeight: '700' },
  rowUnit: { color: colors.textTertiary, fontWeight: '400', fontSize: fontSize.caption },
});
