import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';
import { useWorkoutData, useSessionData } from '@/shared/state/store';
import {
  Button,
  Chip,
  DetailHeader,
  NumberedListRow,
  SectionLabel,
  StatCard,
} from '@/shared/components';
import { PencilIcon, PlusIcon } from '@/shared/components/icons';
import { ExerciseEditSheet } from '../components/ExerciseEditSheet';
import { DayEditSheet } from '../components/DayEditSheet';
import { activeSessionForDay, dayProgress, isDayComplete } from '../utils/progressUtils';
import { defaultExercise, exerciseTotalSets } from '../constants/exerciseDefaults';
import { estimateDayMinutes } from '../utils/durationUtils';
import { confirm } from '@/shared/utils/confirm';
import type { DayTemplate } from '../types/workoutTypes';

export function DayPreStartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayIndex?: string | string[] }>();
  const dayIndexParam = Array.isArray(params.dayIndex) ? params.dayIndex[0] : params.dayIndex;
  const dayIndex = Number.parseInt(dayIndexParam ?? '0', 10) || 0;

  const { config, updateDay, deleteDay } = useWorkoutData();
  const { sessions, startSession, resumeSession, abandonSession, finishSession } = useSessionData();
  const day = config.days[dayIndex];

  const [editingExIndex, setEditingExIndex] = useState<number | null>(null);
  const [dayEditOpen, setDayEditOpen] = useState(false);

  const active = useMemo(() => activeSessionForDay(sessions, dayIndex), [sessions, dayIndex]);
  const progress = useMemo(
    () => (day ? dayProgress(active, day) : { done: 0, total: 0 }),
    [active, day],
  );
  const completed = active && day ? isDayComplete(active, day) : false;
  const totalMins = useMemo(() => (day ? estimateDayMinutes(day) : 0), [day]);

  const handleSaveExercise = useCallback(
    (exIndex: number, updates: Partial<DayTemplate['exercises'][number]>) => {
      if (!day) return;
      updateDay(dayIndex, {
        exercises: day.exercises.map((ex, i) => (i === exIndex ? { ...ex, ...updates } : ex)),
      });
      setEditingExIndex(null);
    },
    [day, dayIndex, updateDay],
  );

  const handleAddExercise = useCallback(() => {
    if (!day) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const newExercises = [...day.exercises, defaultExercise(`Exercise ${day.exercises.length + 1}`)];
    updateDay(dayIndex, { exercises: newExercises });
    setEditingExIndex(newExercises.length - 1);
  }, [day, dayIndex, updateDay]);

  const handleDeleteExercise = useCallback(() => {
    if (!day || editingExIndex == null || day.exercises.length <= 1) return;
    updateDay(dayIndex, {
      exercises: day.exercises.filter((_, i) => i !== editingExIndex),
    });
    setEditingExIndex(null);
  }, [day, dayIndex, editingExIndex, updateDay]);

  const goActive = useCallback(
    (sessionId: string) => {
      router.push({
        pathname: '/active-session',
        params: { dayIndex: String(dayIndex), sessionId },
      });
    },
    [router, dayIndex],
  );

  const handleStart = useCallback(() => {
    if (!day) return;
    if (active && !completed) {
      resumeSession(active.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      goActive(active.id);
      return;
    }
    if (completed) {
      confirm({
        title: 'Day already complete',
        message: 'Start a fresh session for this day?',
        confirmLabel: 'Start fresh',
        onConfirm: () => {
          if (active) abandonSession(active.id);
          const id = startSession(day, dayIndex);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          goActive(id);
        },
      });
      return;
    }
    const id = startSession(day, dayIndex);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    goActive(id);
  }, [day, dayIndex, active, completed, abandonSession, resumeSession, startSession, goActive]);

  const handleFinish = useCallback(() => {
    if (!active) return;
    confirm({
      title: 'Finish workout early?',
      message: 'Saves the workout as completed with whatever you logged so far.',
      confirmLabel: 'Finish',
      onConfirm: () => {
        finishSession(active.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.back();
      },
    });
  }, [active, finishSession, router]);

  const handleAbandon = useCallback(() => {
    if (!active) return;
    confirm({
      title: 'Abandon workout?',
      message:
        'Saved to history as an abandoned session. Use Finish workout instead if you want it counted as done.',
      confirmLabel: 'Abandon',
      destructive: true,
      onConfirm: () => {
        abandonSession(active.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        router.back();
      },
    });
  }, [active, abandonSession, router]);

  if (!day) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={[text.title3 as TextStyle, { padding: spacing.lg }]}>Day not found</Text>
      </SafeAreaView>
    );
  }

  const canResume = !!active && !completed;
  const ctaLabel = canResume ? 'Resume Workout' : completed ? 'Start Fresh' : 'Start Workout';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DetailHeader
        onBack={() => router.back()}
        center={
          <View
            style={[
              styles.dayDot,
              { backgroundColor: day.color + '20', borderColor: day.color + '40' },
            ]}
          >
            <Text style={[styles.dayDotText, { color: day.color }]}>{day.day}</Text>
          </View>
        }
        right={
          <Chip
            label="Edit day"
            icon={<PencilIcon color={colors.textSecondary} />}
            onPress={() => setDayEditOpen(true)}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleArea}>
          <Text style={[text.largeTitle as TextStyle, { color: day.color }]}>{day.title}</Text>
          {day.focus ? <Text style={styles.focusLine}>{day.focus}</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <StatCard value={day.exercises.length} label="EXERCISES" />
          <StatCard value={progress.total} label="SETS" />
          <StatCard value={`~${totalMins}`} label="MINUTES" />
        </View>

        {canResume && (
          <View style={[styles.resumeBanner, { borderColor: day.color }]}>
            <Text style={[styles.resumeTitle, { color: day.color }]}>In progress</Text>
            <Text style={styles.resumeBody}>
              {progress.done} of {progress.total} sets logged. Resume where you left off, or use the actions below.
            </Text>
          </View>
        )}

        <SectionLabel style={styles.sectionLabel}>EXERCISES</SectionLabel>
        <View style={styles.exerciseList}>
          {day.exercises.map((ex, i) => {
            const total = exerciseTotalSets(ex);
            const tag = ex.tracksTime
              ? `${Math.floor(ex.durationSeconds / 60)}:${String(ex.durationSeconds % 60).padStart(2, '0')} timed`
              : ex.tracksWeight === false && ex.tracksReps === false
                ? 'no tracking'
                : ex.tracksWeight === false
                  ? 'bodyweight'
                  : null;
            return (
              <NumberedListRow
                key={i}
                number={i + 1}
                accent={day.color}
                name={ex.name}
                meta={`${ex.warmup ? '1 warm-up + ' : ''}${ex.sets} sets · ${ex.reps}${tag ? ` · ${tag}` : ''}`}
                style={styles.exerciseRow}
                trailing={
                  <View style={styles.trailingRow}>
                    <View style={styles.dots}>
                      {Array.from({ length: total }).map((_, di) => (
                        <View key={di} style={[styles.dot, { backgroundColor: day.color + '50' }]} />
                      ))}
                    </View>
                    <PencilIcon color={colors.textTertiary} size={14} />
                  </View>
                }
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setEditingExIndex(i);
                }}
              />
            );
          })}

          <TouchableOpacity onPress={handleAddExercise} style={styles.addRow} activeOpacity={0.75}>
            <View style={styles.addIcon}>
              <PlusIcon color={colors.textSecondary} />
            </View>
            <Text style={styles.addText}>Add exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <Button label={ctaLabel} onPress={handleStart} color={day.color} />
        {canResume && (
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button
                label="Finish"
                onPress={handleFinish}
                color={colors.text}
                variant="outline"
                style={styles.actionBtn}
                textStyle={{ color: colors.text }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Abandon"
                onPress={handleAbandon}
                color={colors.danger}
                variant="outline"
                style={styles.actionBtn}
                textStyle={{ color: colors.danger }}
              />
            </View>
          </View>
        )}
      </View>

      <ExerciseEditSheet
        visible={editingExIndex !== null}
        exercise={editingExIndex !== null ? day.exercises[editingExIndex] : null}
        exIndex={editingExIndex ?? 0}
        dayColor={day.color}
        onSave={handleSaveExercise}
        onClose={() => setEditingExIndex(null)}
        onDelete={handleDeleteExercise}
        canDelete={day.exercises.length > 1}
      />

      <DayEditSheet
        visible={dayEditOpen}
        day={day}
        dayIndex={dayIndex}
        daysCount={config.days.length}
        onSave={updateDay}
        onDelete={i => {
          deleteDay(i);
          router.back();
        }}
        onClose={() => setDayEditOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotText: { fontSize: fontSize.subhead, fontWeight: '700', fontFamily: fonts.mono },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  titleArea: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.xs },
  focusLine: { ...(text.bodySecondary as TextStyle), color: colors.textSecondary, letterSpacing: 0.3 },

  metaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },

  resumeBanner: {
    ...surfaces.row,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  resumeTitle: {
    ...(text.eyebrow as TextStyle),
    color: colors.text,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  resumeBody: {
    ...(text.bodySecondary as TextStyle),
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xs },
  exerciseList: { gap: spacing.sm },
  exerciseRow: {
    ...surfaces.row,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  trailingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  addRow: {
    ...surfaces.dashed,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { ...(text.button as TextStyle), fontSize: 14, color: colors.textSecondary },

  // The screen sits inside the tab navigator, so the bottom tab bar handles
  // the iOS home-indicator inset. The CTA only needs a small breath above
  // the tab bar — `spacing.sm` mirrors the top padding so the buttons don't
  // sit lopsided against the hairline divider.
  cta: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { height: 46, paddingHorizontal: 0 },
});
