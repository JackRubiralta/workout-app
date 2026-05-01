import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '../../theme';
import { useWorkoutData, useSessionData } from '../../shell/store';
import { Button, IconButton } from '../../components/primitives/Button';
import { SectionLabel } from '../../components/primitives/SectionLabel';
import { ChevronLeft, PencilIcon, PlusIcon } from '../../shell/icons';
import { ExerciseEditSheet } from './ExerciseEditSheet';
import { DayEditSheet } from './DayEditSheet';
import { activeSessionForDay, dayProgress, isDayComplete } from './logic/progress';
import { defaultExercise, exerciseTotalSets } from '../../utils/exercise';
import { confirm } from '../../utils/confirm';

const PER_SET_WORK_SECONDS = 45;

function estimateMinutes(day) {
  let secs = 0;
  for (const ex of day.exercises) {
    const total = exerciseTotalSets(ex);
    secs += total * PER_SET_WORK_SECONDS;
    secs += Math.max(0, total - 1) * (ex.restSeconds ?? 90);
    secs += ex.nextRestSeconds ?? day.exerciseRestSeconds ?? 180;
  }
  return Math.max(5, Math.round(secs / 60));
}


export function DayPreStartScreen({ navigation, route }) {
  const dayIndex = route.params?.dayIndex ?? 0;
  const { config, updateDay, deleteDay } = useWorkoutData();
  const { sessions, startSession, resumeSession, abandonSession, finishSession } = useSessionData();
  const day = config.days[dayIndex];

  const [editingExIndex, setEditingExIndex] = useState(null);
  const [dayEditOpen, setDayEditOpen] = useState(false);

  const active = useMemo(
    () => activeSessionForDay(sessions, dayIndex),
    [sessions, dayIndex],
  );
  const progress = useMemo(() => (day ? dayProgress(active, day) : { done: 0, total: 0 }), [active, day]);
  const completed = active && day ? isDayComplete(active, day) : false;
  const totalMins = useMemo(() => (day ? estimateMinutes(day) : 0), [day]);

  // ── Exercise editing ─────────────────────────────────────────────────────
  const handleSaveExercise = useCallback((exIndex, updates) => {
    if (!day) return;
    updateDay(dayIndex, {
      exercises: day.exercises.map((ex, i) => (i === exIndex ? { ...ex, ...updates } : ex)),
    });
    setEditingExIndex(null);
  }, [day, dayIndex, updateDay]);

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

  // ── Start / Resume ───────────────────────────────────────────────────────
  const goActive = useCallback((sessionId) => {
    navigation.getParent()?.navigate('ActiveSession', { dayIndex, sessionId });
  }, [navigation, dayIndex]);

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
        navigation.goBack();
      },
    });
  }, [active, finishSession, navigation]);

  const handleAbandon = useCallback(() => {
    if (!active) return;
    confirm({
      title: 'Abandon workout?',
      message: 'Saved to history as an abandoned session. Use Finish workout instead if you want it counted as done.',
      confirmLabel: 'Abandon',
      destructive: true,
      onConfirm: () => {
        abandonSession(active.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        navigation.goBack();
      },
    });
  }, [active, abandonSession, navigation]);

  if (!day) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={[text.title3, { padding: spacing.lg }]}>Day not found</Text>
      </SafeAreaView>
    );
  }

  const canResume = !!active && !completed;
  const ctaLabel = canResume ? 'Resume Workout' : completed ? 'Start Fresh' : 'Start Workout';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.text} size={20} />
        </IconButton>
        <View style={[styles.dayDot, { backgroundColor: day.color + '20', borderColor: day.color + '40' }]}>
          <Text style={[styles.dayDotText, { color: day.color }]}>{day.day}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setDayEditOpen(true)} style={styles.editPill} activeOpacity={0.7}>
          <PencilIcon color={colors.textSecondary} />
          <Text style={styles.editPillText}>Edit day</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleArea}>
          <Text style={[text.largeTitle, { color: day.color }]}>{day.title}</Text>
          {day.focus ? <Text style={styles.focusLine}>{day.focus}</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaValue}>{day.exercises.length}</Text>
            <Text style={styles.metaLabel}>EXERCISES</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaValue}>{progress.total}</Text>
            <Text style={styles.metaLabel}>SETS</Text>
          </View>
          <View style={styles.metaCard}>
            <Text style={styles.metaValue}>~{totalMins}</Text>
            <Text style={styles.metaLabel}>MINUTES</Text>
          </View>
        </View>

        {canResume && (
          <View style={[styles.resumeBanner, { borderColor: day.color }]}>
            <Text style={[styles.resumeTitle, { color: day.color }]}>In progress</Text>
            <Text style={styles.resumeBody}>
              {progress.done} of {progress.total} sets logged. Resume where you left off, or use the actions below.
            </Text>
          </View>
        )}

        <SectionLabel style={styles.sectionLabel}>EXERCISES · TAP TO EDIT</SectionLabel>
        <View style={styles.exerciseList}>
          {day.exercises.map((ex, i) => {
            const total = exerciseTotalSets(ex);
            const tag = ex.tracksTime
              ? `${Math.floor(ex.durationSeconds / 60)}:${String(ex.durationSeconds % 60).padStart(2, '0')} timed`
              : ex.tracksWeight === false && ex.tracksReps === false ? 'no tracking'
              : ex.tracksWeight === false ? 'bodyweight' : null;
            return (
              <TouchableOpacity
                key={i}
                style={styles.exerciseRow}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setEditingExIndex(i);
                }}
              >
                <View style={[styles.exNumber, { borderColor: day.color }]}>
                  <Text style={[styles.exNumberText, { color: day.color }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.exMeta} numberOfLines={1}>
                    {ex.warmup ? '1 warm-up + ' : ''}{ex.sets} sets · {ex.reps}{tag ? ` · ${tag}` : ''}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {Array.from({ length: total }).map((_, di) => (
                    <View key={di} style={[styles.dot, { backgroundColor: day.color + '50' }]} />
                  ))}
                </View>
                <PencilIcon color={colors.textTertiary} size={14} />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={handleAddExercise}
            style={styles.addRow}
            activeOpacity={0.75}
          >
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
        onDelete={(i) => { deleteDay(i); navigation.goBack(); }}
        onClose={() => setDayEditOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  dayDot: { width: 36, height: 36, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { fontSize: fontSize.subhead, fontWeight: '700', fontFamily: fonts.mono },
  editPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.sm + 2, paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  editPillText: { ...text.buttonSmall, color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  titleArea: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.xs },
  focusLine: { ...text.bodySecondary, color: colors.textSecondary, letterSpacing: 0.3 },

  metaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  metaCard: {
    ...surfaces.row,
    flex: 1, alignItems: 'center', gap: 2,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.sm,
  },
  metaValue: { ...text.monoNumber, fontSize: fontSize.title2, fontWeight: '700' },
  metaLabel: { ...text.eyebrowSmall },

  resumeBanner: {
    ...surfaces.row,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  resumeTitle: { ...text.eyebrow, color: colors.text, letterSpacing: 1.5, fontWeight: '700' },
  resumeBody: { ...text.bodySecondary, fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xs },
  exerciseList: { gap: spacing.sm },
  exerciseRow: {
    ...surfaces.row,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  exNumber: { width: 28, height: 28, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  exNumberText: { ...text.monoCaption, fontWeight: '700', color: colors.text },
  exName: { ...text.title3, fontSize: 15, color: colors.text, fontWeight: '600' },
  exMeta: { ...text.bodySecondary, fontSize: 12, color: colors.textSecondary },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  addRow: {
    ...surfaces.dashed,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  addIcon: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  addText: { ...text.button, fontSize: 14, color: colors.textSecondary },

  cta: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { height: 46, paddingHorizontal: 0 },
});
