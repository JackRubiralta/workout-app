import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, spacing } from '../../theme';
import { useWorkoutData, useSessionData } from '../../shell/store';
import { useRestTimer } from './hooks/useRestTimer';
import { useSetTimer } from './hooks/useSetTimer';
import { useLiveActivity } from './hooks/useLiveActivity';
import { ExerciseList } from '../../components/workout/ExerciseList';
import { SetLogSheet } from '../../components/workout/SetLogSheet';
import { ExerciseHistorySheet } from './ExerciseHistorySheet';
import { SessionTopBar } from './SessionTopBar';
import { SessionStage } from './SessionStage';
import { SessionFooter } from './SessionFooter';
import { findNextSet, isDayComplete, dayProgress, restDurationFor } from './logic/progress';
import { lastTwoWorkingSets, averageOfLastN } from './logic/suggestions';
import { exerciseTotalSets, getSetLabel, formatDuration } from '../../utils/exercise';
import { confirm } from '../../utils/confirm';

// Layout-derived sizing pulled into a hook so the screen reads cleanly.
// `timerSize` keeps the circle visible on small phones; `nameFontSize`
// shrinks the exercise hero on shorter viewports.
function useResponsiveLayout() {
  const { height } = useWindowDimensions();
  const timerSize = Math.round(Math.min(180, height * 0.22));
  const nameFontSize = Math.round(Math.min(34, height * 0.046));
  const isSmall = height < 700;
  const mainContentMinHeight = timerSize + (isSmall ? 80 : 110);
  return { timerSize, nameFontSize, isSmall, mainContentMinHeight };
}

// Picks the primary CTA based on which mode the session is in. Returning a
// {label, onPress, variant} keeps the JSX below tidy.
function resolvePrimaryAction({ isDayDone, isResting, setTimerRunning, isTimed, currentEx, handlers }) {
  if (isDayDone) return { label: 'Back to Days', onPress: handlers.onComplete, variant: 'filled' };
  if (isResting) return { label: 'Skip Rest', onPress: handlers.onSkipRest, variant: 'outline' };
  if (setTimerRunning) return { label: 'Stop & Save', onPress: handlers.onStopSetTimer, variant: 'outline' };
  if (isTimed) return { label: `Start ${formatDuration(currentEx.durationSeconds)}`, onPress: handlers.onStartSetTimer, variant: 'filled' };
  return { label: 'Done', onPress: handlers.onDone, variant: 'filled' };
}

export function ActiveSessionScreen({ navigation, route }) {
  useKeepAwake();
  const dayIndex = route.params?.dayIndex ?? 0;
  const { config } = useWorkoutData();
  const day = config.days[dayIndex];
  const {
    activeSession, sessions, markSetDone, recordSetValues, popUndo, pushUndo,
    completeSession, pauseSession, skipExercise,
  } = useSessionData();

  const { timerSize, nameFontSize, isSmall, mainContentMinHeight } = useResponsiveLayout();
  const { isResting, secondsLeft, totalSeconds, startRest, skipRest } = useRestTimer();
  const [logSheet, setLogSheet] = useState(null);
  const [historyExercise, setHistoryExercise] = useState(null);

  const isDayDone = useMemo(() => isDayComplete(activeSession, day), [activeSession, day]);
  const currentPos = useMemo(() => (isDayDone ? null : findNextSet(activeSession, day)), [activeSession, day, isDayDone]);
  const { done: doneSets } = useMemo(() => dayProgress(activeSession, day), [activeSession, day]);
  const currentEx = day && currentPos ? day.exercises[currentPos.e] : null;
  const isTimed = !!(currentEx && currentEx.tracksTime);
  const recentAvg = useMemo(
    () => (currentEx ? averageOfLastN(sessions, currentEx.name, 5, activeSession?.id) : null),
    [sessions, currentEx, activeSession?.id],
  );
  const totalSets = useMemo(
    () => day ? day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0) : 0,
    [day],
  );

  // ─── Set logging ─────────────────────────────────────────────────────────
  const handleSetTimerComplete = useCallback((elapsedSeconds) => {
    if (!day || !currentPos) return;
    const ex = day.exercises[currentPos.e];
    const isWarmup = ex.warmup && currentPos.s === 0;
    const setLbl = getSetLabel(ex, currentPos.s);
    const restDuration = restDurationFor(day, ex, currentPos.e, currentPos.s);
    const nextEx = currentPos.s === exerciseTotalSets(ex) - 1 && currentPos.e + 1 < day.exercises.length
      ? day.exercises[currentPos.e + 1]
      : ex;
    markSetDone({ exerciseIndex: currentPos.e, setIndex: currentPos.s, exerciseName: ex.name, setLabel: setLbl, isWarmup, restSeconds: restDuration });
    recordSetValues({ exerciseIndex: currentPos.e, setIndex: currentPos.s, weight: 0, reps: 0, toFailure: false, timeSeconds: elapsedSeconds, unit: 'lb' });
    startRest(restDuration, nextEx?.name);
    live.onSetDone(ex, currentPos.e, currentPos.s, restDuration, setLbl, (activeSession?.entries?.length ?? 0) + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, currentPos, activeSession, markSetDone, recordSetValues, startRest]);

  const setTimer = useSetTimer({ onComplete: handleSetTimerComplete });
  const live = useLiveActivity({ day, session: activeSession, isResting, isDayDone, currentPos });

  useEffect(() => {
    if (isDayDone && activeSession && !activeSession.completedAt) {
      completeSession();
      live.onEnd();
    }
  }, [isDayDone, activeSession, completeSession, live]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleStartSetTimer = useCallback(() => {
    if (currentEx) setTimer.start(currentEx.durationSeconds || 60);
  }, [currentEx, setTimer]);

  const handleStopSetTimer = useCallback(() => setTimer.stopEarly(), [setTimer]);

  const handleDone = useCallback(() => {
    if (!currentPos || !day) return;
    const ex = day.exercises[currentPos.e];
    const isWarmup = ex.warmup && currentPos.s === 0;
    const setLbl = getSetLabel(ex, currentPos.s);
    const restDuration = restDurationFor(day, ex, currentPos.e, currentPos.s);
    const nextEx = currentPos.s === exerciseTotalSets(ex) - 1 && currentPos.e + 1 < day.exercises.length
      ? day.exercises[currentPos.e + 1]
      : ex;

    markSetDone({ exerciseIndex: currentPos.e, setIndex: currentPos.s, exerciseName: ex.name, setLabel: setLbl, isWarmup, restSeconds: restDuration });
    startRest(restDuration, nextEx?.name);
    live.onSetDone(ex, currentPos.e, currentPos.s, restDuration, setLbl, (activeSession?.entries?.length ?? 0) + 1);

    const tracksWeight = ex.tracksWeight !== false;
    const tracksReps = ex.tracksReps !== false;
    if (tracksWeight || tracksReps) {
      const avg = averageOfLastN(sessions, ex.name, 5, activeSession?.id);
      const trend = lastTwoWorkingSets(sessions, ex.name, activeSession?.id)
        .map(({ entry }) => `${entry.weight}×${entry.reps}`).join(' · ');
      setLogSheet({
        exerciseIndex: currentPos.e, setIndex: currentPos.s, exerciseName: ex.name, setLabel: setLbl, isWarmup,
        defaultWeight: tracksWeight && avg ? avg.weight : 0,
        defaultReps: tracksReps && avg ? avg.reps : 0,
        tracksWeight, tracksReps,
        trendHint: trend ? `last ${trend}` : null,
      });
    } else {
      // Nothing to log — finalize the entry right away so it's not a placeholder.
      recordSetValues({ exerciseIndex: currentPos.e, setIndex: currentPos.s, weight: 0, reps: 0, toFailure: false, unit: 'lb' });
    }
  }, [currentPos, day, sessions, activeSession, markSetDone, recordSetValues, startRest, live]);

  const handleSaveLog = useCallback(({ weight, reps, toFailure }) => {
    if (!logSheet) return;
    recordSetValues({ exerciseIndex: logSheet.exerciseIndex, setIndex: logSheet.setIndex, weight, reps, toFailure, unit: 'lb' });
    setLogSheet(null);
  }, [logSheet, recordSetValues]);

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
    navigation.goBack();
  }, [pauseSession, skipRest, setTimer, navigation, live]);

  const handleComplete = useCallback(() => {
    if (!activeSession?.completedAt) completeSession();
    live.onEnd();
    navigation.goBack();
  }, [activeSession, completeSession, navigation, live]);

  const handleSkipExercise = useCallback(() => {
    if (!currentEx || !day || currentPos == null) return;
    confirm({
      title: `Skip ${currentEx.name}?`,
      message: 'Marks all remaining sets of this exercise as done with empty entries. The workout advances to the next exercise.',
      confirmLabel: 'Skip',
      destructive: true,
      onConfirm: () => {
        skipExercise(day, currentPos.e);
        skipRest();
        setTimer.cancel();
      },
    });
  }, [currentEx, day, currentPos, skipExercise, skipRest, setTimer]);

  if (!day || !activeSession) {
    return <SafeAreaView style={s.container} edges={['top', 'bottom']} />;
  }

  const undoEnabled = (activeSession.undoStack?.length ?? 0) > 0;
  const canShowSecondary = !isDayDone && !isResting && !setTimer.isRunning;
  const primary = resolvePrimaryAction({
    isDayDone, isResting, setTimerRunning: setTimer.isRunning, isTimed, currentEx,
    handlers: {
      onComplete: handleComplete, onSkipRest: handleSkipRest,
      onStopSetTimer: handleStopSetTimer, onStartSetTimer: handleStartSetTimer, onDone: handleDone,
    },
  });

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <SessionTopBar day={day} canUndo={undoEnabled} onBack={handleBack} onUndo={handleUndo} />

      <ScrollView style={s.listScroll} contentContainerStyle={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
        <ExerciseList
          day={day}
          session={activeSession}
          currentExIndex={isDayDone ? -1 : (currentPos?.e ?? -1)}
          onPressExercise={(i) => setHistoryExercise(day.exercises[i].name)}
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
          setTimerSecondsLeft={setTimer.secondsLeft}
          setTimerTotalSeconds={setTimer.totalSeconds}
          currentEx={currentEx}
          currentPos={currentPos}
          recentAvg={recentAvg}
          timerSize={timerSize}
          isSmall={isSmall}
          nameFontSize={nameFontSize}
        />
      </View>

      <SessionFooter
        doneSets={doneSets}
        totalSets={totalSets}
        dayColor={day.color}
        primary={primary}
        canSkipExercise={canShowSecondary}
        onSkipExercise={handleSkipExercise}
      />

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
  listScroll: { flexShrink: 1, flexGrow: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md, marginTop: 2 },
  mainContent: {
    flexGrow: 1, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
});
