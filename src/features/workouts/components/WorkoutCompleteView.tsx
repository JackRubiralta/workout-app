import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  fontSize,
  fonts,
  layout,
  radius,
  spacing,
  surfaces,
  text,
} from '@/shared/theme';
import { Button, StatCard } from '@/shared/components';
import { exerciseTotalSets } from '../constants/exerciseDefaults';
import { sessionVolume } from '../utils/volumeUtils';
import { formatDurationISO } from '@/shared/utils/format';
import { fromLb, unitLabel, type UnitSystemValue } from '@/shared/utils/units';
import type {
  DayTemplate,
  SetEntry,
  WorkoutSession,
} from '../types/workoutTypes';

// Rendered after the user finishes the last set of a session. Replaces the
// previous behaviour where `completeSession()` nulled out `activeSessionId`
// and the screen rendered as an empty `<SafeAreaView />` (the "blank screen
// on finish" bug). The component is *driven by a snapshot* — the parent
// captures the just-completed `WorkoutSession` before persisting completion
// so we can render the recap even after the session is no longer active.

export type WorkoutCompleteViewProps = {
  session: WorkoutSession;
  day: DayTemplate;
  unitSystem: UnitSystemValue;
  onDone: () => void;
};

type ExerciseRecap = {
  name: string;
  topSet: SetEntry | null;
  workingCount: number;
};

function recapsForSession(session: WorkoutSession): ExerciseRecap[] {
  const order: string[] = [];
  const map = new Map<string, ExerciseRecap>();
  for (const e of session.entries) {
    if (e.isPlaceholder || e.isWarmup || e.isSkipped) continue;
    let recap = map.get(e.exerciseName);
    if (!recap) {
      recap = { name: e.exerciseName, topSet: null, workingCount: 0 };
      map.set(e.exerciseName, recap);
      order.push(e.exerciseName);
    }
    recap.workingCount += 1;
    const top = recap.topSet;
    const score = e.weight * Math.max(e.reps, 1);
    const topScore = top ? top.weight * Math.max(top.reps, 1) : -1;
    if (score > topScore) recap.topSet = e;
  }
  return order.map(n => map.get(n)!).filter(r => r.workingCount > 0);
}

export function WorkoutCompleteView({
  session,
  day,
  unitSystem,
  onDone,
}: WorkoutCompleteViewProps) {
  const programmedSets = useMemo(
    () => day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0),
    [day.exercises],
  );

  const completedSets = useMemo(
    () => session.entries.filter(e => !e.isPlaceholder).length,
    [session.entries],
  );

  const volumeLb = useMemo(() => sessionVolume(session), [session]);
  const volumeDisplay = Math.round(fromLb(volumeLb, unitSystem));
  const duration = formatDurationISO(session.startedAt, session.completedAt);
  const unit = unitLabel(unitSystem, { uppercase: true });

  const recaps = useMemo(() => recapsForSession(session), [session]);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroBlock}>
          <View
            style={[
              s.badge,
              {
                backgroundColor: day.color + '22',
                borderColor: day.color,
              },
            ]}
          >
            <Text style={[s.badgeCheck, { color: day.color }]}>✓</Text>
          </View>
          <Text style={s.eyebrow}>WORKOUT COMPLETE</Text>
          <Text style={[s.title, { color: day.color }]}>
            Day {day.day} · {day.title}
          </Text>
          {day.focus ? <Text style={s.focus}>{day.focus}</Text> : null}
        </View>

        <View style={s.statsRow}>
          <StatCard
            value={`${completedSets}/${programmedSets}`}
            label="SETS"
          />
          <StatCard
            value={volumeDisplay > 0 ? volumeDisplay.toLocaleString() : '—'}
            label={`VOL · ${unit}`}
          />
          <StatCard value={duration ?? '—'} label="DURATION" />
          <StatCard value={day.exercises.length} label="EXERCISES" />
        </View>

        {recaps.length > 0 ? (
          <View style={s.recapBlock}>
            <Text style={s.sectionLabel}>HIGHLIGHTS</Text>
            <View style={s.recapList}>
              {recaps.map(r => {
                if (!r.topSet) return null;
                const w = Math.round(fromLb(r.topSet.weight, unitSystem) * 10) / 10;
                const hasWeight = r.topSet.weight > 0;
                const hasReps = r.topSet.reps > 0;
                const hasTime =
                  r.topSet.timeSeconds != null && r.topSet.timeSeconds > 0;
                return (
                  <View key={r.name} style={s.recapRow}>
                    <View style={[s.exDot, { backgroundColor: day.color }]} />
                    <Text style={s.recapName} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={s.recapValue}>
                      {hasTime && !hasWeight && !hasReps
                        ? `${Math.floor((r.topSet.timeSeconds ?? 0) / 60)}:${String(
                            (r.topSet.timeSeconds ?? 0) % 60,
                          ).padStart(2, '0')} hold`
                        : hasWeight || hasReps
                          ? `${hasWeight ? `${w} ${unitLabel(unitSystem)}` : '—'} × ${hasReps ? r.topSet.reps : '—'}`
                          : `${r.workingCount} sets`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={s.bodyMessage}>
          <Text style={s.bodyMessageText}>
            Logged to your history. Great work — recovery starts now.
          </Text>
        </View>

        <View style={{ height: layout.tabBarClearance }} />
      </ScrollView>

      <View style={s.footer}>
        <Button label="Back to Days" onPress={onDone} color={day.color} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },

  heroBlock: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  badge: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeCheck: { fontSize: 44, fontWeight: '800', lineHeight: 52 },
  eyebrow: {
    ...(text.eyebrow as TextStyle),
    color: colors.textTertiary,
    letterSpacing: 1.6,
  },
  title: {
    ...(text.largeTitle as TextStyle),
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  focus: {
    ...(text.bodySecondary as TextStyle),
    fontFamily: fonts.mono,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },

  statsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg },

  recapBlock: { gap: spacing.sm, marginBottom: spacing.lg },
  sectionLabel: {
    ...(text.eyebrowSmall as TextStyle),
    color: colors.textTertiary,
    paddingHorizontal: spacing.xs,
  },
  recapList: { ...surfaces.card, paddingVertical: spacing.xs },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  exDot: { width: 8, height: 8, borderRadius: 4 },
  recapName: {
    flex: 1,
    ...(text.callout as TextStyle),
    fontWeight: '600',
  },
  recapValue: {
    ...(text.monoSubhead as TextStyle),
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSize.subhead,
  },

  bodyMessage: { alignItems: 'center', paddingVertical: spacing.md },
  bodyMessageText: {
    ...(text.bodySecondary as TextStyle),
    color: colors.textTertiary,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
