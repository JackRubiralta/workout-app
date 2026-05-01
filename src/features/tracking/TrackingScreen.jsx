import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, layout, spacing } from '../../theme';
import { useSessionData, useBodyWeightData } from '../../shell/store';
import { Chip, EmptyState, ScreenHeader, SectionLabel } from '../../ui';
import { DumbbellIcon } from '../../ui/icons';
import { SummaryCard } from './SummaryCard';
import { SessionCard } from './SessionCard';
import { TrackingCharts } from './TrackingCharts';
import { TopExercises } from './TopExercises';
import { BodyWeightCard } from './BodyWeightCard';
import { BodyWeightSheet } from './BodyWeightSheet';
import { workoutsThisMonth, workoutsThisWeek, streakStats } from '../workout/logic/volume';
import { SESSIONS_PREVIEW_COUNT } from '../../constants/tracking';

export function TrackingScreen({ navigation }) {
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

  // Visible slice + how many are hidden behind the expander. Sessions are
  // already newest-first in the store, so slicing from the head shows the
  // most recent.
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
    (id) => navigation.navigate('SessionDetail', { sessionId: id }),
    [navigation],
  );

  const handleOpenExercise = useCallback(
    (name) => {
      // Navigate to most recent session that contains this exercise.
      const target = sessions.find(s => s.entries.some(e => e.exerciseName === name));
      if (target) navigation.navigate('SessionDetail', { sessionId: target.id });
    },
    [navigation, sessions],
  );

  const goToWorkout = useCallback(() => {
    navigation.getParent()?.navigate('Workout');
  }, [navigation]);

  const hasSessions = sessions.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          // The standalone "TRACKING" eyebrow above a "Tracking" title was
          // visually redundant. When there's history we surface the count;
          // pre-history we omit the eyebrow entirely so the title stands
          // alone and the empty-state card below carries the narrative.
          eyebrow={hasSessions
            ? `${sessions.length} WORKOUT${sessions.length !== 1 ? 'S' : ''} LOGGED`
            : undefined}
          title="Tracking"
        />
      </View>

      {/* Single rendering path — the scaffolding always renders. Cards
          render their own zero/empty states (e.g. SummaryCard with 0/0/0,
          BodyWeightCard with "No entries yet"). TrackingCharts and
          TopExercises gate themselves on having enough data; for
          first-launch users we surface an EmptyState card to give the
          screen a clear next action instead of a long dark void. */}
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
            <SectionLabel style={styles.sessionsLabel}>
              SESSIONS · {sessions.length}
            </SectionLabel>
            {visibleSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => handleOpenSession(session.id)}
              />
            ))}
            {hiddenSessionCount > 0 && (
              <View style={styles.expanderRow}>
                <Chip
                  label={showAllSessions
                    ? 'Show fewer'
                    : `Show ${hiddenSessionCount} older session${hiddenSessionCount === 1 ? '' : 's'}`}
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
