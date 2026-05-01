import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing, text } from '../../theme';
import { Sheet } from '../../components/primitives/Sheet';
import { Sparkline } from '../../components/primitives/Sparkline';
import { useSessionData } from '../../shell/store';
import { topSetPerSession, personalRecords, epley } from './logic/suggestions';
import { formatDateShort } from '../../utils/date';
import { MAX_HISTORY_POINTS } from '../../constants/history';

export function ExerciseHistorySheet({ visible, exerciseName, dayColor, onClose }) {
  const { sessions } = useSessionData();

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
    () => topSets.map(({ entry }) => ({ value: entry.weight })),
    [topSets],
  );
  const e1rmPoints = useMemo(
    () => topSets.map(({ entry }) => ({ value: Math.round(epley(entry.weight, entry.reps)) })),
    [topSets],
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
              <Text style={s.emptyTitle}>No history yet</Text>
              <Text style={s.emptySub}>
                Log this exercise during a workout and we'll start charting top sets here.
              </Text>
            </View>
          ) : (
            <>
              <View style={s.statsGrid}>
                <View style={s.stat}>
                  <Text style={s.statValue}>{prs.bestWeight ? `${prs.bestWeight.weight}` : '—'}</Text>
                  <Text style={s.statLabel}>BEST WEIGHT (lb)</Text>
                  {prs.bestWeight ? (
                    <Text style={s.statSub}>× {prs.bestWeight.reps} reps</Text>
                  ) : null}
                </View>
                <View style={s.stat}>
                  <Text style={s.statValue}>
                    {prs.bestE1RM ? Math.round(epley(prs.bestE1RM.weight, prs.bestE1RM.reps)) : '—'}
                  </Text>
                  <Text style={s.statLabel}>e1RM (Epley)</Text>
                  {prs.bestE1RM ? (
                    <Text style={s.statSub}>{prs.bestE1RM.weight} × {prs.bestE1RM.reps}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.chartSection}>
                <Text style={text.eyebrow}>TOP SET (lb) · last {topSets.length}</Text>
                <Sparkline points={points} color={dayColor ?? colors.text} height={88} width={300} />
              </View>

              <View style={s.chartSection}>
                <Text style={text.eyebrow}>e1RM TREND · last {topSets.length}</Text>
                <Sparkline points={e1rmPoints} color={colors.text} height={88} width={300} />
              </View>

              <View style={s.list}>
                <Text style={[text.eyebrow, { marginBottom: spacing.xs }]}>SESSIONS</Text>
                {[...topSets].reverse().map(({ entry, session }, i) => (
                  <View key={i} style={s.row}>
                    <Text style={s.rowDate}>{formatDateShort(session.startedAt)}</Text>
                    <Text style={s.rowDay} numberOfLines={1}>{session.dayTitle}</Text>
                    <Text style={s.rowValue}>
                      {entry.weight}<Text style={s.rowUnit}> lb</Text> × {entry.reps}
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
  stat: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: colors.surfaceElevated, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
  },
  statValue: { ...text.monoNumber, fontSize: fontSize.title1 },
  statLabel: { ...text.eyebrowSmall },
  statSub: { ...text.monoCaption, color: colors.textSecondary, marginTop: 2 },

  chartSection: { gap: spacing.sm, marginBottom: spacing.md },

  list: { gap: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceElevated, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  rowDate: { ...text.monoCaption, color: colors.textSecondary, width: 56 },
  rowDay: { flex: 1, ...text.monoFootnote, color: colors.text, fontWeight: '600' },
  rowValue: { ...text.monoSubhead, fontWeight: '700' },
  rowUnit: { color: colors.textTertiary, fontWeight: '400', fontSize: fontSize.caption },
});
