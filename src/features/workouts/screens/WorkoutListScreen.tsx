import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, layout, radius, spacing, surfaces, text } from '@/shared/theme';
import { useWorkoutData, useSessionData, useSettingsData } from '@/shared/state/store';
import { DayCard } from '../components/DayCard';
import {
  DragList,
  ScreenHeader,
  SectionLabel,
  SegmentedControl,
  type SegmentedOption,
} from '@/shared/components';
import { PlusIcon } from '@/shared/components/icons';
import { UnitSystem, type UnitSystemValue } from '@/shared/utils/units';
import { WeekStrip } from '../components/WeekStrip';
import { WorkoutAssistantTrigger } from '../components/WorkoutAssistantTrigger';
import { WorkoutAssistantSheet } from '../components/WorkoutAssistantSheet';
import { activeSessionForDay, dayProgress, isDayComplete } from '../utils/progressUtils';
import { exerciseTotalSets } from '../constants/exerciseDefaults';
import { confirm } from '@/shared/utils/confirm';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const UNIT_OPTIONS: ReadonlyArray<SegmentedOption<UnitSystemValue>> = [
  { value: UnitSystem.IMPERIAL, label: 'Imperial · lb' },
  { value: UnitSystem.METRIC, label: 'Metric · kg' },
];

export function WorkoutListScreen() {
  const router = useRouter();
  const { config, addDay, reorderDay, resetConfig } = useWorkoutData();
  const { sessions } = useSessionData();
  const { unitSystem, setUnitSystem } = useSettingsData();
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleCardPress = useCallback(
    (index: number) => {
      router.push({ pathname: '/(tabs)/workout/day-pre-start', params: { dayIndex: String(index) } });
    },
    [router],
  );

  const toggleEditing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditing(prev => !prev);
  }, []);

  const dayKeyExtractor = useCallback((_: unknown, i: number) => `day-${i}`, []);

  const handleResetProgram = useCallback(() => {
    confirm({
      title: 'Reset program?',
      message: 'Restores the default day list and exercises. Your workout history is unchanged.',
      confirmLabel: 'Reset',
      destructive: true,
      onConfirm: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        resetConfig();
        setEditing(false);
      },
    });
  }, [resetConfig]);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow={todayLabel().toUpperCase()}
          title="Workout"
          actionLabel={editing ? 'Done' : 'Edit'}
          onActionPress={toggleEditing}
        />

        <View style={styles.weekWrap}>
          <WeekStrip sessions={sessions} />
        </View>

        <SectionLabel style={styles.sectionLabel}>PROGRAM</SectionLabel>
        <DragList
          data={config.days}
          enabled={editing}
          itemSpacing={spacing.sm}
          keyExtractor={dayKeyExtractor}
          onReorder={reorderDay}
          renderItem={({ item: day, index, handle }) => {
            const active = activeSessionForDay(sessions, index);
            const { done, total } = dayProgress(active, day);
            const isDone = active ? isDayComplete(active, day) : false;
            const totalSets =
              total || day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
            return (
              <DayCard
                day={day}
                doneSets={done}
                totalSets={totalSets}
                exerciseCount={day.exercises.length}
                isDone={isDone}
                isInProgress={!!active && !isDone}
                onPress={editing ? undefined : () => handleCardPress(index)}
                disabled={editing}
                rightSlot={editing ? handle : undefined}
              />
            );
          }}
        />

        {editing ? (
          <TouchableOpacity
            onPress={handleResetProgram}
            style={styles.resetBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.resetText}>Reset program</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={addDay}
            style={[styles.addBtn, { marginTop: spacing.sm }]}
            activeOpacity={0.7}
          >
            <View style={styles.addIconWrap}>
              <PlusIcon color={colors.textSecondary} />
            </View>
            <Text style={styles.addText}>Add day</Text>
          </TouchableOpacity>
        )}

        <SectionLabel style={styles.assistantLabel}>ASSISTANT</SectionLabel>
        <WorkoutAssistantTrigger onPress={() => setAssistantVisible(true)} />

        <SectionLabel style={styles.unitsLabel}>UNITS</SectionLabel>
        <SegmentedControl
          value={unitSystem}
          options={UNIT_OPTIONS}
          onChange={setUnitSystem}
        />

        <View style={{ height: layout.tabBarClearance }} />
      </ScrollView>

      <WorkoutAssistantSheet
        visible={assistantVisible}
        onClose={() => setAssistantVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },

  weekWrap: { marginBottom: spacing.lg },

  sectionLabel: { marginBottom: spacing.sm },
  assistantLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  unitsLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },

  resetBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  resetText: { ...(text.buttonSmall as TextStyle), color: colors.danger, fontWeight: '600' },

  addBtn: {
    ...surfaces.dashed,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
  },
  addIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { ...(text.callout as TextStyle), color: colors.textSecondary, fontWeight: '600' },
});
