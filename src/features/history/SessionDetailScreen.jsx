import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, fontSize, radius, spacing, text } from '../../theme';
import { useSessionData } from '../../shell/store';
import { IconButton } from '../../components/primitives/Button';
import { ChevronLeft, TrashIcon } from '../../shell/icons';
import { ExerciseHistorySheet } from '../workout/ExerciseHistorySheet';
import { sessionVolume } from '../workout/logic/volume';
import { confirm } from '../../utils/confirm';

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

function formatLong(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(start, end) {
  if (!start || !end) return '—';
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function SessionDetailScreen({ navigation, route }) {
  const { sessions, deleteSession } = useSessionData();
  const sessionId = route.params?.sessionId;
  const session = useMemo(() => sessions.find(s => s.id === sessionId) ?? null, [sessions, sessionId]);
  const [historyExercise, setHistoryExercise] = useState(null);

  const groups = useMemo(() => session ? groupByExercise(session.entries) : [], [session]);
  const volume = useMemo(() => session ? sessionVolume(session) : 0, [session]);

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
        <View style={s.header}>
          <IconButton onPress={handleBack}>
            <ChevronLeft color={colors.text} />
          </IconButton>
          <View style={{ flex: 1 }} />
        </View>
        <Text style={[text.title3, { padding: spacing.lg, color: colors.textSecondary }]}>Session not found</Text>
      </SafeAreaView>
    );
  }

  const status = session.completedAt ? 'Completed' : session.abandonedAt ? 'Abandoned' : 'In progress';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <IconButton onPress={handleBack}>
          <ChevronLeft color={colors.text} />
        </IconButton>
        <View style={[s.dayDot, { backgroundColor: session.dayColor + '20', borderColor: session.dayColor + '40' }]} />
        <View style={{ flex: 1 }} />
        <IconButton onPress={handleDelete} style={{ borderColor: colors.danger + '70', backgroundColor: colors.dangerBg }}>
          <TrashIcon color={colors.danger} />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.titleArea}>
          <Text style={[text.largeTitle, { color: session.dayColor }]}>{session.dayTitle}</Text>
          {session.dayFocus ? <Text style={s.focus}>{session.dayFocus}</Text> : null}
          <Text style={s.date}>{formatLong(session.startedAt)}</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statValue}>{groups.length}</Text>
            <Text style={s.statLabel}>EXERCISES</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{session.entries.filter(e => !e.isPlaceholder).length}</Text>
            <Text style={s.statLabel}>SETS</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{volume > 0 ? volume.toLocaleString() : '—'}</Text>
            <Text style={s.statLabel}>VOLUME (lb)</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{formatDuration(session.startedAt, session.completedAt)}</Text>
            <Text style={s.statLabel}>DURATION</Text>
          </View>
        </View>

        <Text style={s.statusBadge}>{status}</Text>

        {groups.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No sets logged in this session.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {groups.map((group, i) => (
              <View key={i} style={s.exSection}>
                <TouchableOpacity onPress={() => setHistoryExercise(group.name)} activeOpacity={0.7}>
                  <View style={s.exHeader}>
                    <View style={[s.exDot, { backgroundColor: session.dayColor + '70' }]} />
                    <Text style={s.exName} numberOfLines={1}>{group.name}</Text>
                    <Text style={s.exHint}>history ›</Text>
                  </View>
                </TouchableOpacity>
                {group.sets.map((entry, j) => {
                  const hasTime = entry.timeSeconds != null && entry.timeSeconds > 0;
                  const hasWeight = entry.weight > 0;
                  const hasReps = entry.reps > 0;
                  return (
                    <View key={j} style={[s.setRow, entry.isWarmup && { opacity: 0.5 }, entry.isPlaceholder && { opacity: 0.4 }]}>
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
                                {entry.weight}<Text style={s.weightUnit}> lb</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  dayDot: { width: 28, height: 28, borderRadius: radius.full, borderWidth: 1, marginLeft: 4 },

  scroll: { paddingHorizontal: spacing.lg },
  titleArea: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 4 },
  focus: { ...text.bodySecondary, color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.3 },
  date: { ...text.monoCaption, color: colors.textTertiary, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: spacing.xs },
  stat: {
    flex: 1, alignItems: 'center', gap: 2,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  statValue: { ...text.monoNumber, fontSize: fontSize.title3 },
  statLabel: { ...text.eyebrowSmall },

  statusBadge: {
    alignSelf: 'flex-start',
    marginVertical: spacing.md,
    fontSize: 10, fontWeight: '700', color: colors.textTertiary,
    fontFamily: fonts.mono, letterSpacing: 1.4, textTransform: 'uppercase',
  },

  emptyBox: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...text.monoFootnote, color: colors.textTertiary },

  list: { gap: spacing.md, marginTop: spacing.sm },
  exSection: { gap: 1 },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  exDot: { width: 6, height: 6, borderRadius: 3 },
  exName: { flex: 1, ...text.monoSubhead, fontWeight: '600', color: colors.text },
  exHint: { ...text.monoCaption, color: colors.textTertiary, letterSpacing: 0.5 },

  setRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 5, paddingLeft: spacing.sm + spacing.xs, paddingRight: spacing.xs,
  },
  setLabel: { ...text.monoFootnote, color: colors.textTertiary, fontWeight: '500', width: 68 },
  setData: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weight: { ...text.monoSubhead, fontWeight: '700', minWidth: 50, textAlign: 'right' },
  weightUnit: { fontWeight: '400', color: colors.textTertiary, fontSize: fontSize.caption },
  times: { ...text.monoFootnote, color: colors.textTertiary },
  reps: { ...text.monoSubhead, fontWeight: '600', color: colors.textSecondary, minWidth: 20 },
  failBadge: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  failText: { fontSize: 10, fontWeight: '800', fontFamily: fonts.mono },
});
