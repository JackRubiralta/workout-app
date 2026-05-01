import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '../../theme';
import { useSessionData, useSettingsData } from '../../shell/store';
import { DetailHeader, IconButton, StatCard, StatusPill } from '../../components/primitives';
import { TrashIcon } from '../../shell/icons';
import { ExerciseHistorySheet } from '../workout/ExerciseHistorySheet';
import { sessionVolume } from '../workout/logic/volume';
import { formatDurationISO } from '../../utils/format';
import { formatWeight, fromLb, unitLabel } from '../../utils/units';
import { formatDateHeading } from '../../utils/date';
import { confirm } from '../../utils/confirm';
import { copy } from '../../copy';

function groupByExercise(entries) {
  const out = [];
  const map = new Map();
  for (const entry of entries) {
    if (!map.has(entry.exerciseName)) {
      const g = { name: entry.exerciseName, sets: [] };
      map.set(entry.exerciseName, g);
      out.push(g);
    }
    map.get(entry.exerciseName).sets.push(entry);
  }
  return out;
}


export function SessionDetailScreen({ navigation, route }) {
  const { sessions, deleteSession } = useSessionData();
  const { unitSystem } = useSettingsData();
  const unit = unitLabel(unitSystem);
  const sessionId = route.params?.sessionId;
  const session = useMemo(() => sessions.find(s => s.id === sessionId) ?? null, [sessions, sessionId]);
  const [historyExercise, setHistoryExercise] = useState(null);

  const groups = useMemo(() => session ? groupByExercise(session.entries) : [], [session]);
  const volumeLb = useMemo(() => session ? sessionVolume(session) : 0, [session]);
  const volumeDisplay = useMemo(() => Math.round(fromLb(volumeLb, unitSystem)), [volumeLb, unitSystem]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleDelete = useCallback(() => {
    if (!session) return;
    confirm({
      title: 'Delete session?',
      message: `Remove this ${session.dayTitle} workout from history.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        deleteSession(session.id);
        navigation.goBack();
      },
    });
  }, [session, deleteSession, navigation]);

  if (!session) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <DetailHeader onBack={handleBack} />
        <Text style={[text.title3, { padding: spacing.lg, color: colors.textSecondary }]}>Session not found</Text>
      </SafeAreaView>
    );
  }

  const statusInfo = session.completedAt
    ? { label: 'COMPLETED', color: colors.success }
    : session.abandonedAt
      ? { label: 'ABANDONED', color: colors.danger }
      : { label: 'IN PROGRESS', color: session.dayColor };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <DetailHeader
        onBack={handleBack}
        center={<View style={[s.dayDot, { backgroundColor: session.dayColor + '20', borderColor: session.dayColor + '40' }]} />}
        right={
          <IconButton onPress={handleDelete} variant="danger">
            <TrashIcon color={colors.danger} />
          </IconButton>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.titleArea}>
          <Text style={[text.largeTitle, { color: session.dayColor }]}>{session.dayTitle}</Text>
          {session.dayFocus ? <Text style={s.focus}>{session.dayFocus}</Text> : null}
          <Text style={s.date}>{formatDateHeading(session.startedAt)}</Text>
        </View>

        <View style={s.statsRow}>
          <StatCard value={groups.length} label="EXERCISES" />
          <StatCard value={session.entries.filter(e => !e.isPlaceholder).length} label="SETS" />
          <StatCard value={volumeDisplay > 0 ? volumeDisplay.toLocaleString() : '—'} label={`VOLUME (${unit})`} />
          <StatCard value={formatDurationISO(session.startedAt, session.completedAt) ?? '—'} label="DURATION" />
        </View>

        <View style={s.statusRow}>
          <StatusPill label={statusInfo.label} color={statusInfo.color} />
        </View>

        {groups.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>{copy.empty.sessionSets.title}</Text>
          </View>
        ) : (
          <View style={s.list}>
            {groups.map((group, i) => (
              <View key={i} style={s.exCard}>
                <TouchableOpacity onPress={() => setHistoryExercise(group.name)} activeOpacity={0.7}>
                  <View style={s.exHeader}>
                    <View style={[s.exDot, { backgroundColor: session.dayColor }]} />
                    <Text style={s.exName} numberOfLines={1}>{group.name}</Text>
                    <Text style={[s.exHint, { color: session.dayColor }]}>history ›</Text>
                  </View>
                </TouchableOpacity>
                <View style={s.setsList}>
                  {group.sets.map((entry, j) => {
                    const hasTime = entry.timeSeconds != null && entry.timeSeconds > 0;
                    const hasWeight = entry.weight > 0;
                    const hasReps = entry.reps > 0;
                    return (
                      <View
                        key={j}
                        style={[
                          s.setRow,
                          j !== 0 && s.setRowBorder,
                          entry.isWarmup && { opacity: 0.55 },
                          entry.isPlaceholder && { opacity: 0.4 },
                        ]}
                      >
                        <Text style={s.setLabel}>{entry.setLabel}</Text>
                        <View style={s.setData}>
                          {hasTime && !hasWeight && !hasReps ? (
                            <Text style={s.weight}>
                              {Math.floor(entry.timeSeconds / 60)}:{String(entry.timeSeconds % 60).padStart(2, '0')}
                              <Text style={s.weightUnit}> hold</Text>
                            </Text>
                          ) : (
                            <>
                              {hasWeight ? (
                                <Text style={s.weight}>
                                  {formatWeight(entry.weight, unitSystem, { withUnit: false })}
                                  <Text style={s.weightUnit}> {unit}</Text>
                                </Text>
                              ) : (
                                <Text style={[s.weight, { color: colors.textTertiary }]}>—</Text>
                              )}
                              <Text style={s.times}>×</Text>
                              {hasReps ? (
                                <Text style={s.reps}>{entry.reps}</Text>
                              ) : (
                                <Text style={[s.reps, { color: colors.textTertiary }]}>—</Text>
                              )}
                              {entry.toFailure && (
                                <View style={[s.failBadge, { backgroundColor: session.dayColor + '20' }]}>
                                  <Text style={[s.failText, { color: session.dayColor }]}>F</Text>
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxl + 64 }} />
      </ScrollView>

      <ExerciseHistorySheet
        visible={!!historyExercise}
        exerciseName={historyExercise}
        dayColor={session.dayColor}
        onClose={() => setHistoryExercise(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dayDot: { width: 28, height: 28, borderRadius: radius.full, borderWidth: 1, marginLeft: 4 },

  scroll: { paddingHorizontal: spacing.lg },
  titleArea: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 4 },
  focus: { ...text.bodySecondary, color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.3 },
  date: { ...text.monoCaption, color: colors.textTertiary, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: spacing.xs },

  statusRow: { marginVertical: spacing.md },

  emptyBox: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...text.monoFootnote, color: colors.textTertiary },

  // Each exercise group is a self-contained card so the visual
  // hierarchy reads "session → exercises → sets" instead of a flat wall
  // of rows. Internal hairline dividers between sets keep the card from
  // feeling cramped without adding more borders.
  list: { gap: spacing.sm, marginTop: spacing.xs },
  exCard: {
    ...surfaces.card,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  exHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  exDot: { width: 8, height: 8, borderRadius: 4 },
  exName: { flex: 1, ...text.monoSubhead, fontWeight: '700', color: colors.text, fontSize: fontSize.subhead },
  exHint: { ...text.monoCaption, fontWeight: '600', letterSpacing: 0.5 },

  setsList: { marginTop: 2 },
  setRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  setRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  setLabel: { ...text.monoFootnote, color: colors.textTertiary, fontWeight: '600', width: 68, letterSpacing: 0.3 },
  setData: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weight: { ...text.monoSubhead, fontWeight: '700', minWidth: 50, textAlign: 'right', color: colors.text },
  weightUnit: { fontWeight: '500', color: colors.textTertiary, fontSize: fontSize.caption },
  times: { ...text.monoFootnote, color: colors.textTertiary },
  reps: { ...text.monoSubhead, fontWeight: '700', color: colors.text, minWidth: 20 },
  failBadge: { width: 18, height: 18, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  failText: { fontSize: 10, fontWeight: '800', fontFamily: fonts.mono },
});
