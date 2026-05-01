import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { colors, layout, spacing } from '../../theme';
import { useSessionData, useBodyWeightData } from '../../shell/store';
import { EmptyState } from '../../components/primitives/EmptyState';
import { ScreenHeader } from '../../components/primitives/ScreenHeader';
import { SectionLabel } from '../../components/primitives/SectionLabel';
import { SummaryCard } from './SummaryCard';
import { SessionCard } from './SessionCard';
import { HistoryCharts } from './HistoryCharts';
import { TopExercises } from './TopExercises';
import { BodyWeightCard } from './BodyWeightCard';
import { BodyWeightSheet } from './BodyWeightSheet';
import { workoutsThisMonth, workoutsThisWeek, streakStats } from '../workout/logic/volume';
import { confirm } from '../../utils/confirm';

function ClockSvg() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8V12L15 15M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke={colors.textTertiary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HistoryListScreen({ navigation }) {
  const { sessions, clearHistory } = useSessionData();
  const bw = useBodyWeightData();
  const [bwOpen, setBwOpen] = useState(false);

  const summary = useMemo(() => {
    const streak = streakStats(sessions);
    return {
      thisWeek: workoutsThisWeek(sessions),
      thisMonth: workoutsThisMonth(sessions),
      currentStreak: streak.current,
      longestStreak: streak.longest,
      totalSessions: sessions.filter(s => s.completedAt || s.entries.some(e => !e.isPlaceholder)).length,
    };
  }, [sessions]);

  const handleClear = useCallback(() => {
    confirm({
      title: 'Clear all history?',
      message: 'Permanently deletes every workout log. This cannot be undone.',
      confirmLabel: 'Clear all',
      destructive: true,
      onConfirm: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        clearHistory();
      },
    });
  }, [clearHistory]);

  const hasContent = sessions.length > 0 || bw.entries.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow={sessions.length > 0
            ? `${sessions.length} WORKOUT${sessions.length !== 1 ? 'S' : ''} LOGGED`
            : 'TRACKING'}
          title="Tracking"
          actionLabel={sessions.length > 0 ? 'Clear' : undefined}
          onActionPress={sessions.length > 0 ? handleClear : undefined}
        />
      </View>

      {!hasContent ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <BodyWeightCard entries={bw.entries} latest={bw.latest} onLog={() => setBwOpen(true)} />
          <EmptyState
            icon={<ClockSvg />}
            title="No workouts yet"
            subtitle={'Complete sets during a workout to start\ntracking your progress here'}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <SummaryCard
            thisWeek={summary.thisWeek}
            thisMonth={summary.thisMonth}
            currentStreak={summary.currentStreak}
            longestStreak={summary.longestStreak}
            totalSessions={summary.totalSessions}
          />

          <BodyWeightCard
            entries={bw.entries}
            latest={bw.latest}
            onLog={() => setBwOpen(true)}
          />

          {sessions.length > 0 && <HistoryCharts sessions={sessions} />}

          {sessions.length > 1 && (
            <TopExercises
              sessions={sessions}
              onPressExercise={(name) => {
                // Navigate to most recent session that contains this exercise
                const target = sessions.find(s => s.entries.some(e => e.exerciseName === name));
                if (target) navigation.navigate('SessionDetail', { sessionId: target.id });
              }}
            />
          )}

          {sessions.length > 0 && (
            <>
              <SectionLabel style={{ marginTop: spacing.md }}>SESSIONS</SectionLabel>
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                />
              ))}
            </>
          )}

          <View style={{ height: layout.tabBarClearance }} />
        </ScrollView>
      )}

      <BodyWeightSheet
        visible={bwOpen}
        onClose={() => setBwOpen(false)}
        defaultWeight={bw.latest?.weight ?? 170}
        onSave={(w) => bw.addEntry(w, 'lb')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
});
