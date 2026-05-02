import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, spacing } from '@/shared/theme';
import { useWorkoutData, useSessionData, useSettingsData } from '@/shared/state/store';
import { useRestTimer } from '../hooks/useRestTimer';
import { useSetTimer } from '../hooks/useSetTimer';
import { useLiveActivity } from '../hooks/useLiveActivity';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { ExerciseList } from '../components/ExerciseList';
import { SetLogSheet } from '../components/SetLogSheet';
import { ExerciseHistorySheet } from '../components/ExerciseHistorySheet';
import { SessionTopBar } from '../components/SessionTopBar';
import { SessionStage } from '../components/SessionStage';
import { SessionFooter } from '../components/SessionFooter';
import { WorkoutCompleteView } from '../components/WorkoutCompleteView';
import { Button, EmptyState } from '@/shared/components';
import { findNextSet, isDayComplete, dayProgress, restDurationFor } from '../utils/progressUtils';
import { lastTwoWorkingSets, averageOfLastN, suggestSetDefaults } from '../utils/suggestionsUtils';
import { resolvePrimaryAction } from '../utils/resolvePrimaryAction';
import { exerciseTotalSets, getSetLabel } from '../constants/exerciseDefaults';
import { fromLb, unitLabel } from '@/shared/utils/units';
import { confirm } from '@/shared/utils/confirm';
import type { WorkoutSession } from '../types/workoutTypes';

type LogSheetState = {
  exerciseIndex: number;
  setIndex: number;
  exerciseName: string;
  setLabel: string;
  isWarmup: boolean;
  defaultWeight: number;
  defaultReps: number;
  /** How many working sets were averaged to produce the defaults (0 = none). */
  defaultsSampleSize: number;
  tracksWeight: boolean;
  tracksReps: boolean;
  trendHint: string | null;
};

export function ActiveSessionScreen() {
  useKeepAwake();
  const router = useRouter();
  const params = useLocalSearchParams<{ dayIndex?: string | string[] }>();
  const dayIndexParam = Array.isArray(params.dayIndex) ? params.dayIndex[0] : params.dayIndex;
  const dayIndex = Number.parseInt(dayIndexParam ?? '0', 10) || 0;

  const { config } = useWorkoutData();
  const { unitSystem } = useSettingsData();
  const day = config.days[dayIndex];
  const {
    activeSession,
    sessions,
    markSetDone,
    recordSetValues,
    popUndo,
    pushUndo,
    completeSession,
    pauseSession,
    skipExercise,
  } = useSessionData();

  const { timerSize, nameFontSize, isSmall, mainContentMinHeight } = useResponsiveLayout();
  const { isResting, secondsLeft, totalSeconds, startRest, skipRest } = useRestTimer();
  const [logSheet, setLogSheet] = useState<LogSheetState | null>(null);
  const [historyExercise, setHistoryExercise] = useState<string | null>(null);
  // Snapshot of the session at the moment we detect completion. We need this
  // because `completeSession()` nulls out `activeSessionId`, which would
  // otherwise leave us with `activeSession === null` and nothing to render.
  const [finishedSnapshot, setFinishedSnapshot] = useState<WorkoutSession | null>(null);

  const isDayDone = useMemo(() => isDayComplete(activeSession, day), [activeSession, day]);
  const currentPos = useMemo(
    () => (isDayDone ? null : findNextSet(activeSession, day)),
    [activeSession, day, isDayDone],
  );
  const { done: doneSets } = useMemo(
    () => dayProgress(activeSession, day),
    [activeSession, day],
  );
  const currentEx = day && currentPos ? day.exercises[currentPos.e] : null;
  const isTimed = !!(currentEx && currentEx.tracksTime);
  const totalSets = useMemo(
    () => (day ? day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0) : 0),
    [day],
  );

  const recentAvg = useMemo(() => {
    if (!currentEx) return null;
    const avg = averageOfLastN(sessions, currentEx.name, 5, activeSession?.id);
    if (!avg) return null;
    const w = Math.round(fromLb(avg.weight, unitSystem) * 10) / 10;
    return { count: avg.count, label: `${w} ${unitLabel(unitSystem)} × ${avg.reps}` };
  }, [sessions, currentEx, activeSession?.id, unitSystem]);

  const live = useLiveActivity({ day, session: activeSession, isResting, isDayDone, currentPos });

  const finalizeTimedSet = useCallback(
    (elapsedSeconds: number) => {
      if (!day || !currentPos) return;
      const ex = day.exercises[currentPos.e];
      const isWarmup = ex.warmup && currentPos.s === 0;
      const setLbl = getSetLabel(ex, currentPos.s);
      const restDuration = restDurationFor(day, ex, currentPos.e, currentPos.s);
      const nextEx =
        currentPos.s === exerciseTotalSets(ex) - 1 && currentPos.e + 1 < day.exercises.length
          ? day.exercises[currentPos.e + 1]
          : ex;
      markSetDone({
        exerciseIndex: currentPos.e,
        setIndex: currentPos.s,
        exerciseName: ex.name,
        setLabel: setLbl,
        isWarmup,
        restSeconds: restDuration,
      });
      recordSetValues({
        exerciseIndex: currentPos.e,
        setIndex: currentPos.s,
        weight: 0,
        reps: 0,
        toFailure: false,
        timeSeconds: elapsedSeconds,
        unit: 'lb',
      });
      startRest(restDuration, nextEx?.name);
      live.onSetDone(
        ex,
        currentPos.e,
        currentPos.s,
        restDuration,
        setLbl,
        (activeSession?.entries?.length ?? 0) + 1,
      );
    },
    [day, currentPos, activeSession, markSetDone, recordSetValues, startRest, live],
  );

  const handleSetTimerAutoFinish = useCallback(() => {
    if (!day || !currentPos) return;
    const ex = day.exercises[currentPos.e];
    live.onSetTimerFinish(ex, currentPos.e, currentPos.s, activeSession?.entries?.length ?? 0);
  }, [day, currentPos, activeSession, live]);

  const setTimer = useSetTimer({
    onComplete: finalizeTimedSet,
    onAutoFinish: handleSetTimerAutoFinish,
  });

  useEffect(() => {
    if (!isDayDone || !activeSession || activeSession.completedAt || finishedSnapshot) return;
    // Snapshot first — once `completeSession` runs the session leaves the
    // active slot, so we render the recap from this captured copy.
    setFinishedSnapshot({
      ...activeSession,
      completedAt: new Date().toISOString(),
    });
    completeSession();
    live.onEnd();
    skipRest();
    setTimer.cancel();
    setLogSheet(null);
    setHistoryExercise(null);
  }, [isDayDone, activeSession, finishedSnapshot, completeSession, live, skipRest, setTimer]);

  const handleStartSetTimer = useCallback(() => {
    if (!currentEx || !currentPos) return;
    const duration = currentEx.durationSeconds || 60;
    setTimer.start(duration, currentEx.name);
    live.onSetTimerStart(currentEx, currentPos.e, currentPos.s, duration, activeSession?.entries?.length ?? 0);
  }, [currentEx, currentPos, activeSession, setTimer, live]);

  const handleStopSetTimer = useCallback(() => setTimer.stopEarly(), [setTimer]);
  const handleAcknowledgeSetTimer = useCallback(() => setTimer.acknowledge(), [setTimer]);

  const handleDone = useCallback(() => {
    if (!currentPos || !day) return;
    const ex = day.exercises[currentPos.e];
    const isWarmup = ex.warmup && currentPos.s === 0;
    const setLbl = getSetLabel(ex, currentPos.s);
    const restDuration = restDurationFor(day, ex, currentPos.e, currentPos.s);
    const nextEx =
      currentPos.s === exerciseTotalSets(ex) - 1 && currentPos.e + 1 < day.exercises.length
        ? day.exercises[currentPos.e + 1]
        : ex;

    markSetDone({
      exerciseIndex: currentPos.e,
      setIndex: currentPos.s,
      exerciseName: ex.name,
      setLabel: setLbl,
      isWarmup,
      restSeconds: restDuration,
    });
    startRest(restDuration, nextEx?.name);
    live.onSetDone(
      ex,
      currentPos.e,
      currentPos.s,
      restDuration,
      setLbl,
      (activeSession?.entries?.length ?? 0) + 1,
    );

    const tracksWeight = ex.tracksWeight !== false;
    const tracksReps = ex.tracksReps !== false;
    if (tracksWeight || tracksReps) {
      // Defaults pull from the average of the last 5 working sets of this
      // exercise (including any already logged in the current session — see
      // `suggestSetDefaults`). The trend chip below shows the prior two
      // working-set pairs from previous sessions only, so the user can see
      // both "what the picker is suggesting" and "what I actually did last
      // time".
      const suggested = suggestSetDefaults(sessions, ex.name, 5);
      const trendPairs = lastTwoWorkingSets(sessions, ex.name, activeSession?.id);
      const trend = trendPairs
        .map(({ entry }) => `${Math.round(fromLb(entry.weight, unitSystem) * 10) / 10}×${entry.reps}`)
        .join(' · ');
      setLogSheet({
        exerciseIndex: currentPos.e,
        setIndex: currentPos.s,
        exerciseName: ex.name,
        setLabel: setLbl,
        isWarmup,
        defaultWeight: tracksWeight && suggested ? suggested.weight : 0,
        defaultReps: tracksReps && suggested ? suggested.reps : 0,
        defaultsSampleSize: suggested?.sampleSize ?? 0,
        tracksWeight,
        tracksReps,
        trendHint: trend ? `last ${trend}` : null,
      });
    } else {
      recordSetValues({
        exerciseIndex: currentPos.e,
        setIndex: currentPos.s,
        weight: 0,
        reps: 0,
        toFailure: false,
        unit: 'lb',
      });
    }
  }, [
    currentPos,
    day,
    sessions,
    activeSession,
    markSetDone,
    recordSetValues,
    startRest,
    live,
    unitSystem,
  ]);

  const handleSaveLog = useCallback(
    ({ weight, reps, toFailure }: { weight: number; reps: number; toFailure: boolean }) => {
      if (!logSheet) return;
      recordSetValues({
        exerciseIndex: logSheet.exerciseIndex,
        setIndex: logSheet.setIndex,
        weight,
        reps,
        toFailure,
        unit: 'lb',
      });
      setLogSheet(null);
    },
    [logSheet, recordSetValues],
  );

  const handleSkipRest = useCallback(() => {
    pushUndo({ type: 'skip', restSeconds: totalSeconds });
    skipRest();
    live.onSkipRest();
  }, [totalSeconds, skipRest, pushUndo, live]);

  const handleUndo = useCallback(() => {
    const popped = popUndo();
    if (!popped) return;
    if (popped.type === 'skip' && popped.restSeconds) startRest(popped.restSeconds);
    else if (popped.type === 'done') skipRest();
  }, [popUndo, startRest, skipRest]);

  const handleBack = useCallback(() => {
    pauseSession();
    skipRest();
    setTimer.cancel();
    live.onEnd();
    router.back();
  }, [pauseSession, skipRest, setTimer, router, live]);

  const handleComplete = useCallback(() => {
    if (!activeSession?.completedAt) completeSession();
    live.onEnd();
    router.back();
  }, [activeSession, completeSession, router, live]);

  const handleFinishedDone = useCallback(() => {
    setFinishedSnapshot(null);
    router.back();
  }, [router]);

  const handleSkipExercise = useCallback(() => {
    if (!currentEx || !day || currentPos == null) return;
    confirm({
      title: `Skip ${currentEx.name}?`,
      message:
        'Marks all remaining sets of this exercise as done with empty entries. The workout advances to the next exercise.',
      confirmLabel: 'Skip',
      destructive: true,
      onConfirm: () => {
        skipExercise(day, currentPos.e);
        skipRest();
        setTimer.cancel();
      },
    });
  }, [currentEx, day, currentPos, skipExercise, skipRest, setTimer]);

  if (day && finishedSnapshot) {
    return (
      <WorkoutCompleteView
        session={finishedSnapshot}
        day={day}
        unitSystem={unitSystem}
        onDone={handleFinishedDone}
      />
    );
  }

  if (!day || !activeSession) {
    // Reachable when the user pauses/abandons mid-session and then navigates
    // back to this route, or when the route is opened with a stale dayIndex.
    // Render an explicit "no session" state instead of a blank screen.
    return (
      <SafeAreaView style={[s.container, s.noSession]} edges={['top', 'bottom']}>
        <EmptyState
          title={day ? 'No active session' : 'Workout not found'}
          subtitle={
            day
              ? 'This day has no workout in progress. Start one from the day card.'
              : 'The day this session belonged to is no longer in your program.'
          }
          action={<Button label="Back to Days" onPress={() => router.back()} />}
        />
      </SafeAreaView>
    );
  }

  const undoEnabled = (activeSession.undoStack?.length ?? 0) > 0;
  const canShowSecondary = !isDayDone && !isResting && !setTimer.isRunning && !setTimer.isFinished;
  const primary = resolvePrimaryAction({
    isDayDone,
    isResting,
    setTimerFinished: setTimer.isFinished,
    setTimerRunning: setTimer.isRunning,
    isTimed,
    currentEx,
    handlers: {
      onComplete: handleComplete,
      onSkipRest: handleSkipRest,
      onAcknowledgeSetTimer: handleAcknowledgeSetTimer,
      onStopSetTimer: handleStopSetTimer,
      onStartSetTimer: handleStartSetTimer,
      onDone: handleDone,
    },
  });

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <SessionTopBar day={day} canUndo={undoEnabled} onBack={handleBack} onUndo={handleUndo} />

      <ScrollView
        style={s.listScroll}
        contentContainerStyle={{ flexGrow: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <ExerciseList
          day={day}
          session={activeSession}
          currentExIndex={isDayDone ? -1 : currentPos?.e ?? -1}
          onPressExercise={(i: number) => setHistoryExercise(day.exercises[i].name)}
        />
      </ScrollView>

      <View style={s.divider} />

      <View style={[s.mainContent, { minHeight: mainContentMinHeight }]}>
        <SessionStage
          day={day}
          doneSets={doneSets}
          isDayDone={isDayDone}
          isResting={isResting}
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          setTimerRunning={setTimer.isRunning}
          setTimerFinished={setTimer.isFinished}
          setTimerSecondsLeft={setTimer.secondsLeft}
          setTimerTotalSeconds={setTimer.totalSeconds}
          currentEx={currentEx}
          currentPos={currentPos}
          recentAvg={recentAvg}
          timerSize={timerSize}
          isSmall={isSmall}
          nameFontSize={nameFontSize}
          onSkipExercise={canShowSecondary ? handleSkipExercise : undefined}
        />
      </View>

      <SessionFooter doneSets={doneSets} totalSets={totalSets} dayColor={day.color} primary={primary} />

      <ExerciseHistorySheet
        visible={!!historyExercise}
        exerciseName={historyExercise}
        dayColor={day.color}
        onClose={() => setHistoryExercise(null)}
      />

      <SetLogSheet
        visible={!!logSheet}
        exerciseName={logSheet?.exerciseName ?? ''}
        setLabel={logSheet?.setLabel ?? ''}
        isWarmup={logSheet?.isWarmup ?? false}
        dayColor={day.color}
        defaultWeight={logSheet?.defaultWeight ?? 0}
        defaultReps={logSheet?.defaultReps ?? 0}
        defaultsSampleSize={logSheet?.defaultsSampleSize ?? 0}
        tracksWeight={logSheet?.tracksWeight ?? true}
        tracksReps={logSheet?.tracksReps ?? true}
        trendHint={logSheet?.trendHint}
        onSave={handleSaveLog}
        onDismiss={() => setLogSheet(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  noSession: { padding: spacing.lg, justifyContent: 'center' },
  listScroll: { flexShrink: 1, flexGrow: 0 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: 2,
  },
  mainContent: {
    flexGrow: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});
