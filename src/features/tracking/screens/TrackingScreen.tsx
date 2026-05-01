import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, layout, spacing } from '@/shared/theme';
import { useSessionData, useBodyWeightData } from '@/shared/state/store';
import { Chip, EmptyState, ScreenHeader, SectionLabel } from '@/shared/components';
import { DumbbellIcon } from '@/shared/components/icons';
import { SummaryCard } from '../components/SummaryCard';
import { SessionCard } from '../components/SessionCard';
import { TrackingCharts } from '../components/TrackingCharts';
import { TopExercises } from '../components/TopExercises';
import { BodyWeightCard } from '../components/BodyWeightCard';
import { BodyWeightSheet } from '../components/BodyWeightSheet';
import {
  workoutsThisMonth,
  workoutsThisWeek,
  streakStats,
} from '@/features/workouts/utils/volumeUtils';
import { SESSIONS_PREVIEW_COUNT } from '../constants/trackingConstants';

export function TrackingScreen() {
  const router = useRouter();
  const { sessions } = useSessionData();
  const bw = useBodyWeightData();
  const [bwOpen, setBwOpen] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  const summary = useMemo(() => {
    const streak = streakStats(sessions);
    return {
      thisWeek: workoutsThisWeek(sessions),
      thisMonth: workoutsThisMonth(sessions),
      currentStreak: streak.current,
      longestStreak: streak.longest,
    };
  }, [sessions]);

  const visibleSessions = useMemo(
    () => (showAllSessions ? sessions : sessions.slice(0, SESSIONS_PREVIEW_COUNT)),
    [sessions, showAllSessions],
  );
  const hiddenSessionCount = Math.max(sessions.length - SESSIONS_PREVIEW_COUNT, 0);

  const handleToggleSessions = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setShowAllSessions(v => !v);
  }, []);

  const handleOpenSession = useCallback(
    (id: string) =>
      router.push({ pathname: '/(tabs)/tracking/session-detail', params: { sessionId: id } }),
    [router],
  );

  const handleOpenExercise = useCallback(
    (name: string) => {
      const target = sessions.find(s => s.entries.some(e => e.exerciseName === name));
      if (target) {
        router.push({
          pathname: '/(tabs)/tracking/session-detail',
          params: { sessionId: target.id },
        });
      }
    },
    [router, sessions],
  );

  const goToWorkout = useCallback(() => {
    router.push('/(tabs)/workout');
  }, [router]);

  const hasSessions = sessions.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow={
            hasSessions
              ? `${sessions.length} WORKOUT${sessions.length !== 1 ? 'S' : ''} LOGGED`
              : undefined
          }
          title="Tracking"
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <SummaryCard
          thisWeek={summary.thisWeek}
          thisMonth={summary.thisMonth}
          currentStreak={summary.currentStreak}
          longestStreak={summary.longestStreak}
        />

        <BodyWeightCard
          entries={bw.entries}
          latest={bw.latest}
          onLog={() => setBwOpen(true)}
        />

        {!hasSessions && (
          <EmptyState
            icon={<DumbbellIcon color={colors.textSecondary} size={28} />}
            title="Track your first workout"
            subtitle={'Complete a session to see streaks,\ncharts and personal records here.'}
            action={<Chip label="Start a workout" variant="strong" onPress={goToWorkout} />}
          />
        )}

        {hasSessions && <TrackingCharts sessions={sessions} />}

        {sessions.length > 1 && (
          <TopExercises sessions={sessions} onPressExercise={handleOpenExercise} />
        )}

        {hasSessions && (
          <>
            <SectionLabel style={styles.sessionsLabel}>SESSIONS · {sessions.length}</SectionLabel>
            {visibleSessions.map(session => (
              <SessionCard key={session.id} session={session} onPress={() => handleOpenSession(session.id)} />
            ))}
            {hiddenSessionCount > 0 && (
              <View style={styles.expanderRow}>
                <Chip
                  label={
                    showAllSessions
                      ? 'Show fewer'
                      : `Show ${hiddenSessionCount} older session${hiddenSessionCount === 1 ? '' : 's'}`
                  }
                  onPress={handleToggleSessions}
                />
              </View>
            )}
          </>
        )}

        <View style={{ height: layout.tabBarClearance }} />
      </ScrollView>

      <BodyWeightSheet
        visible={bwOpen}
        onClose={() => setBwOpen(false)}
        defaultWeight={bw.latest?.weight ?? 170}
        onSave={(w, unit) => bw.addEntry(w, unit)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  sessionsLabel: { marginTop: spacing.md },
  expanderRow: { alignItems: 'center', marginTop: spacing.xs },
});
