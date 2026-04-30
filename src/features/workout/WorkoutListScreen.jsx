import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, spacing, text } from '../../theme';
import { useWorkoutData, useSessionData } from '../../shell/store';
import { DayCard } from '../../components/workout/DayCard';
import { WeekStrip } from './WeekStrip';
import { dayProgress, isDayComplete, activeSessionForDay } from './logic/progress';
import { exerciseTotalSets } from '../../utils/exercise';
import { workoutsThisWeek, streakStats } from './logic/volume';
import { confirm } from '../../utils/confirm';

function PlusIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function FlameIcon({ color, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2c2 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 1-5 0 2 2 3 4 0 0-2 0-3 0-5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function WorkoutListScreen({ navigation }) {
  const { config, addDay, resetConfig } = useWorkoutData();
  const { sessions } = useSessionData();

  const stats = useMemo(() => ({
    week: workoutsThisWeek(sessions),
    streak: streakStats(sessions).current,
  }), [sessions]);

  const handleCardPress = useCallback((index) => {
    navigation.navigate('DayPreStart', { dayIndex: index });
  }, [navigation]);

  const handleResetProgram = useCallback(() => {
    confirm({
      title: 'Reset program?',
      message: 'Restores the default day list and exercises. Your workout history is unchanged.',
      confirmLabel: 'Reset',
      destructive: true,
      onConfirm: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        resetConfig();
      },
    });
  }, [resetConfig]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{todayLabel().toUpperCase()}</Text>
            <Text style={text.hero}>Workout</Text>
          </View>
          <TouchableOpacity onPress={handleResetProgram} hitSlop={10} activeOpacity={0.6} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <FlameIcon color={colors.warning} />
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.week}</Text>
            <Text style={styles.statLabel}>this week</Text>
          </View>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <WeekStrip sessions={sessions} />
        </View>

        <Text style={[text.eyebrow, styles.sectionLabel]}>Program</Text>
        <View style={styles.list}>
          {config.days.map((day, index) => {
            const active = activeSessionForDay(sessions, index);
            const { done, total } = dayProgress(active, day);
            const isDone = active ? isDayComplete(active, day) : false;
            const totalSets = total || day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
            return (
              <DayCard
                key={`${day.day}-${index}`}
                day={day}
                doneSets={done}
                totalSets={totalSets}
                exerciseCount={day.exercises.length}
                isDone={isDone}
                isInProgress={!!active && !isDone}
                onPress={() => handleCardPress(index)}
              />
            );
          })}

          <TouchableOpacity onPress={addDay} style={styles.addBtn} activeOpacity={0.7}>
            <View style={styles.addIconWrap}>
              <PlusIcon color={colors.textSecondary} />
            </View>
            <Text style={styles.addText}>Add day</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Tap a day to view exercises and start.</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  eyebrow: { ...text.eyebrowSmall, color: colors.textTertiary, marginBottom: 4 },
  resetBtn: { paddingVertical: 6, paddingHorizontal: spacing.sm },
  resetText: { ...text.buttonSmall, color: colors.textSecondary, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { ...text.monoNumber, fontSize: 20 },
  statLabel: { ...text.bodySecondary, fontSize: 13, color: colors.textSecondary, flex: 1 },

  sectionLabel: { color: colors.textTertiary, marginBottom: spacing.sm, marginLeft: 2 },

  list: { gap: spacing.sm },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  addIconWrap: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addText: { ...text.callout, color: colors.textSecondary, fontWeight: '600' },

  hint: { ...text.monoCaption, textAlign: 'center', marginTop: spacing.md, color: colors.textMuted },
});
