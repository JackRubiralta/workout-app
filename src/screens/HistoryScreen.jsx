import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, fontSize, fonts, shadow } from '../constants/theme';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const mins = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatVolume(vol) {
  if (vol >= 10000) return `${(vol / 1000).toFixed(1)}k`;
  if (vol >= 1000) return vol.toLocaleString();
  return String(vol);
}

function groupEntriesByExercise(entries) {
  const groups = [];
  const map = new Map();
  for (const entry of entries) {
    if (!map.has(entry.exerciseName)) {
      const g = { name: entry.exerciseName, sets: [] };
      map.set(entry.exerciseName, g);
      groups.push(g);
    }
    map.get(entry.exerciseName).sets.push(entry);
  }
  return groups;
}

function isThisWeek(iso) {
  const d = new Date(iso);
  const now = new Date();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  return d >= weekAgo;
}

// ─── Stats Summary ──────────────────────────────────────────────────────────

function StatCard({ value, label, accent }) {
  return (
    <View style={st.card}>
      <Text style={[st.cardValue, accent && { color: accent }]}>{value}</Text>
      <Text style={st.cardLabel}>{label}</Text>
    </View>
  );
}

function StatsSummary({ sessions }) {
  const stats = useMemo(() => {
    const thisWeek = sessions.filter(s => isThisWeek(s.startedAt)).length;
    const totalVol = sessions.reduce((sum, s) =>
      sum + s.entries.reduce((es, e) => es + e.weight * e.reps, 0), 0,
    );
    const totalSets = sessions.reduce((sum, s) => sum + s.entries.length, 0);
    return { total: sessions.length, thisWeek, totalVol, totalSets };
  }, [sessions]);

  return (
    <View style={st.row}>
      <StatCard value={stats.thisWeek} label="This week" accent={colors.success} />
      <StatCard value={stats.total} label="Total" />
      <StatCard value={formatVolume(stats.totalVol)} label="Volume (lb)" />
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  cardValue: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─── Exercise Row (inside expanded session) ─────────────────────────────────

function ExerciseSection({ group, dayColor, prevSessionGroups }) {
  // Find the best (heaviest) working set in this exercise
  const bestSet = useMemo(() => {
    let best = null;
    for (const s of group.sets) {
      if (s.isWarmup) continue;
      if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
        best = s;
      }
    }
    return best;
  }, [group.sets]);

  // Compare to previous session's best for this exercise
  const prevBest = useMemo(() => {
    if (!prevSessionGroups) return null;
    const prevGroup = prevSessionGroups.find(g => g.name === group.name);
    if (!prevGroup) return null;
    let best = null;
    for (const s of prevGroup.sets) {
      if (s.isWarmup) continue;
      if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
        best = s;
      }
    }
    return best;
  }, [prevSessionGroups, group.name]);

  const weightDelta = bestSet && prevBest ? bestSet.weight - prevBest.weight : null;

  return (
    <View style={ex.section}>
      {/* Exercise name + progression indicator */}
      <View style={ex.nameRow}>
        <View style={[ex.dot, { backgroundColor: dayColor + '50' }]} />
        <Text style={ex.name} numberOfLines={1}>{group.name}</Text>
        {weightDelta !== null && weightDelta !== 0 && (
          <Text style={[ex.delta, { color: weightDelta > 0 ? colors.success : '#FF453A' }]}>
            {weightDelta > 0 ? '+' : ''}{weightDelta}
          </Text>
        )}
      </View>

      {/* Set rows */}
      {group.sets.map((entry, i) => (
        <View key={i} style={[ex.setRow, entry.isWarmup && { opacity: 0.5 }]}>
          <Text style={ex.setLabel}>{entry.setLabel}</Text>
          <View style={ex.setData}>
            {entry.weight > 0 ? (
              <Text style={ex.weight}>
                {entry.weight}
                <Text style={ex.unit}> lb</Text>
              </Text>
            ) : (
              <Text style={[ex.weight, { color: colors.textTertiary }]}>—</Text>
            )}
            <Text style={ex.times}>×</Text>
            {entry.reps > 0 ? (
              <Text style={ex.reps}>{entry.reps}</Text>
            ) : (
              <Text style={[ex.reps, { color: colors.textTertiary }]}>—</Text>
            )}
            {entry.toFailure && (
              <View style={[ex.failBadge, { backgroundColor: dayColor + '20' }]}>
                <Text style={[ex.failText, { color: dayColor }]}>F</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const ex = StyleSheet.create({
  section: { gap: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  name: {
    flex: 1,
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.mono,
  },
  delta: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingLeft: spacing.sm + spacing.xs,
    paddingRight: spacing.xs,
  },
  setLabel: {
    fontSize: fontSize.footnote,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontWeight: '500',
    width: 68,
  },
  setData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weight: {
    fontSize: fontSize.subhead,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
    minWidth: 50,
    textAlign: 'right',
  },
  unit: { fontWeight: '400', color: colors.textTertiary, fontSize: fontSize.caption },
  times: {
    fontSize: fontSize.footnote,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
  },
  reps: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    minWidth: 20,
  },
  failBadge: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  failText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fonts.mono,
  },
});

// ─── Session Card ───────────────────────────────────────────────────────────

function SessionCard({ session, onDelete, prevSessionGroups }) {
  const [expanded, setExpanded] = useState(false);
  const exerciseGroups = useMemo(() => groupEntriesByExercise(session.entries), [session.entries]);
  const duration = useMemo(() => formatDuration(session.startedAt, session.completedAt), [session]);
  const totalVolume = useMemo(() =>
    session.entries.reduce((sum, e) => sum + e.weight * e.reps, 0),
    [session.entries],
  );

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Delete Session',
      `Remove this ${session.dayTitle} workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(session.id) },
      ],
    );
  }, [session, onDelete]);

  return (
    <TouchableOpacity
      style={c.card}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setExpanded(prev => !prev);
      }}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Color bar */}
      <View style={[c.colorBar, { backgroundColor: session.dayColor }]} />

      {/* Header */}
      <View style={c.header}>
        <View style={c.titleArea}>
          <View style={c.titleRow}>
            <Text style={c.title}>{session.dayTitle}</Text>
            {session.dayFocus ? <Text style={c.focus}> · {session.dayFocus}</Text> : null}
          </View>
          <View style={c.metaRow}>
            <Text style={c.meta}>{formatDate(session.startedAt)}</Text>
            <Text style={c.metaDot}>·</Text>
            <Text style={c.meta}>{formatTime(session.startedAt)}</Text>
            {duration && (
              <>
                <Text style={c.metaDot}>·</Text>
                <Text style={c.meta}>{duration}</Text>
              </>
            )}
          </View>
        </View>
        <Text style={[c.chevron, { color: session.dayColor }]}>{expanded ? '▾' : '›'}</Text>
      </View>

      {/* Summary chips */}
      {!expanded && session.entries.length > 0 && (
        <View style={c.chips}>
          <View style={c.chip}>
            <Text style={c.chipVal}>{exerciseGroups.length}</Text>
            <Text style={c.chipLabel}>exercises</Text>
          </View>
          <View style={c.chip}>
            <Text style={c.chipVal}>{session.entries.length}</Text>
            <Text style={c.chipLabel}>sets</Text>
          </View>
          {totalVolume > 0 && (
            <View style={c.chip}>
              <Text style={c.chipVal}>{formatVolume(totalVolume)}</Text>
              <Text style={c.chipLabel}>lb vol</Text>
            </View>
          )}
          {session.completedAt && (
            <View style={[c.chip, { borderColor: colors.success + '30' }]}>
              <Text style={[c.chipVal, { color: colors.success, fontSize: 12 }]}>✓</Text>
              <Text style={[c.chipLabel, { color: colors.success }]}>done</Text>
            </View>
          )}
        </View>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={c.detail}>
          {exerciseGroups.length > 0 ? (
            exerciseGroups.map((group, i) => (
              <ExerciseSection
                key={i}
                group={group}
                dayColor={session.dayColor}
                prevSessionGroups={prevSessionGroups}
              />
            ))
          ) : (
            <Text style={c.emptyText}>No sets logged</Text>
          )}

          {/* Footer stats */}
          {totalVolume > 0 && (
            <View style={c.footerStats}>
              <Text style={c.footerLabel}>Total volume</Text>
              <Text style={c.footerValue}>{totalVolume.toLocaleString()} lb</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const c = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  colorBar: { height: 3, borderRadius: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.sm + 2,
    gap: spacing.sm,
  },
  titleArea: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline' },
  title: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  focus: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
  },
  metaDot: { fontSize: fontSize.caption, color: colors.textTertiary },
  chevron: { fontSize: 18, fontWeight: '400' },

  // Chips
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipVal: {
    fontSize: fontSize.footnote,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
  },
  chipLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontWeight: '500',
  },

  // Expanded
  detail: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.subhead,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerLabel: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footerValue: {
    fontSize: fontSize.subhead,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
  },
});

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 8V12L15 15M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"
          stroke={colors.textTertiary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete sets during a workout to start{'\n'}tracking your progress here
      </Text>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export function HistoryScreen({ sessions, deleteSession, clearHistory }) {
  // Pre-compute exercise groups for each session's "previous" for delta comparison
  const prevGroupsMap = useMemo(() => {
    const map = new Map();
    // For each session, find the previous session of the same dayTitle
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      for (let j = i + 1; j < sessions.length; j++) {
        if (sessions[j].dayTitle === session.dayTitle && sessions[j].entries.length > 0) {
          map.set(session.id, groupEntriesByExercise(sessions[j].entries));
          break;
        }
      }
    }
    return map;
  }, [sessions]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete all workout logs. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            clearHistory();
          },
        },
      ],
    );
  }, [clearHistory]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSub}>
            {sessions.length > 0
              ? `${sessions.length} workout${sessions.length !== 1 ? 's' : ''} logged`
              : 'Track your progress'}
          </Text>
        </View>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={10} activeOpacity={0.6}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* Stats at top */}
          <StatsSummary sessions={sessions} />

          {/* Session cards */}
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={deleteSession}
              prevSessionGroups={prevGroupsMap.get(session.id) ?? null}
            />
          ))}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Screen Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
    fontFamily: fonts.serif,
  },
  headerSub: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    fontFamily: fonts.mono,
  },
  clearBtn: {
    fontSize: fontSize.subhead,
    fontWeight: '500',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: fonts.serif,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.subhead,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fonts.mono,
  },
});
