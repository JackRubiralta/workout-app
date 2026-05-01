import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, layout, radius, spacing, surfaces, text } from '../../theme';
import { useWorkoutData, useSessionData, useSettingsData } from '../../shell/store';
import { DayCard } from './components/DayCard';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { SectionLabel } from '../../ui/SectionLabel';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { PlusIcon } from '../../ui/icons';
import { UnitSystem } from '../../utils/units';
import { WeekStrip } from './WeekStrip';
import { dayProgress, isDayComplete, activeSessionForDay } from './logic/progress';
import { exerciseTotalSets } from './logic/exercise';
import { confirm } from '../../utils/confirm';

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const UNIT_OPTIONS = [
  { value: UnitSystem.IMPERIAL, label: 'Imperial · lb' },
  { value: UnitSystem.METRIC, label: 'Metric · kg' },
];

export function WorkoutListScreen({ navigation }) {
  const { config, addDay, resetConfig } = useWorkoutData();
  const { sessions } = useSessionData();
  const { unitSystem, setUnitSystem } = useSettingsData();

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
        <ScreenHeader
          eyebrow={todayLabel().toUpperCase()}
          title="Workout"
          actionLabel="Reset"
          onActionPress={handleResetProgram}
        />

        {/* WeekStrip already shows the count + per-day status, so the
            standalone "streak / this week" chips that used to live here
            were redundant noise. */}
        <View style={styles.weekWrap}>
          <WeekStrip sessions={sessions} />
        </View>

        <SectionLabel style={styles.sectionLabel}>PROGRAM</SectionLabel>
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

          {/* Dashed surface signals a non-primary action — visually quieter
              than a real DayCard so the program list reads as the focus. */}
          <TouchableOpacity onPress={addDay} style={styles.addBtn} activeOpacity={0.7}>
            <View style={styles.addIconWrap}>
              <PlusIcon color={colors.textSecondary} />
            </View>
            <Text style={styles.addText}>Add day</Text>
          </TouchableOpacity>
        </View>

        {/* Unit preference. Stored in settings; weights are persisted in lb
            regardless of selection — the UI converts at display + input
            time so flipping units is non-destructive. */}
        <SectionLabel style={styles.unitsLabel}>UNITS</SectionLabel>
        <SegmentedControl
          value={unitSystem}
          options={UNIT_OPTIONS}
          onChange={setUnitSystem}
        />

        <View style={{ height: layout.tabBarClearance }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },

  weekWrap: { marginBottom: spacing.lg },

  sectionLabel: { marginBottom: spacing.sm },
  unitsLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },

  list: { gap: spacing.sm },

  addBtn: {
    ...surfaces.dashed,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
  },
  addIconWrap: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addText: { ...text.callout, color: colors.textSecondary, fontWeight: '600' },
});
