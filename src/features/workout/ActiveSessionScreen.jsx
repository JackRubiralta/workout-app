import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, spacing } from '../../theme';
import { useWorkoutData, useSessionData, useSettingsData } from '../../shell/store';
import { useRestTimer } from './hooks/useRestTimer';
import { useSetTimer } from './hooks/useSetTimer';
import { useLiveActivity } from './hooks/useLiveActivity';
import { ExerciseList } from './components/ExerciseList';
import { SetLogSheet } from './components/SetLogSheet';
import { ExerciseHistorySheet } from './ExerciseHistorySheet';
import { SessionTopBar } from './SessionTopBar';
import { SessionStage } from './SessionStage';
import { SessionFooter } from './SessionFooter';
import { findNextSet, isDayComplete, dayProgress, restDurationFor } from './logic/progress';
import { lastTwoWorkingSets, averageOfLastN } from './logic/suggestions';
import { exerciseTotalSets, getSetLabel, formatDuration } from './logic/exercise';
import { fromLb, unitLabel } from '../../utils/units';
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
// {label, onPress, variant} keeps the JSX below tidy. Order matters —
// "set timer finished" wins over "running" because the timer transitions
// running → finished on natural completion.
function resolvePrimaryAction({
  isDayDone, isResting, setTimerFinished, setTimerRunning, isTimed, currentEx, handlers,
}) {
  if (isDayDone) return { label: 'Back to Days', onPress: handlers.onComplete, variant: 'filled' };
  if (isResting) return { label: 'Skip Rest', onPress: handlers.onSkipRest, variant: 'outline' };
  if (setTimerFinished) return { label: 'Done', onPress: handlers.onAcknowledgeSetTimer, variant: 'filled' };
  if (setTimerRunning) return { label: 'Stop & Save', onPress: handlers.onStopSetTimer, variant: 'outline' };
  if (isTimed) return { label: `Start ${formatDuration(currentEx.durationSeconds)}`, onPress: handlers.onStartSetTimer, variant: 'filled' };
  return { label: 'Done', onPress: handlers.onDone, variant: 'filled' };
}

export function ActiveSessionScreen({ navigation, route }) {
  useKeepAwake();
  const dayIndex = route.params?.dayIndex ?? 0;
  const { config } = useWorkoutData();
  const { unitSystem } = useSettingsData();
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
  const totalSets = useMemo(
    () => day ? day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0) : 0,
    [day],
  );

  // Recent-average chip displayed under the exercise hero. Pre-formatted
  // here (not in SessionStage) so the conversion lives in one place; the
  // stage stays a dumb presentational component.
  const recentAvg = useMemo(() => {
    if (!currentEx) return null;
    const avg = averageOfLastN(sessions, currentEx.name, 5, activeSession?.id);
    if (!avg) return null;
    const w = Math.round(fromLb(avg.weight, unitSystem) * 10) / 10;
    return { count: avg.count, label: `${w} ${unitLabel(unitSystem)} × ${avg.reps}` };
  }, [sessions, currentEx, activeSession?.id, unitSystem]);

  // ── Set logging ─────────────────────────────────────────────────────────
  // Shared persistence for both natural-acknowledged AND stop-early
  // completions of a timed exercise. Stores the elapsed time on the
  // entry, marks done, advances to rest. (Was inlined into onComplete
  // in the old single-callback flow.)
  const finalizeTimedSet = useCallback((elapsedSeconds) => {
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

  // Natural finish (timer hit 0) — keep the user on the set screen and
  // flash the LA "GO" banner. They have to acknowledge with Done before
  // we save anything.
  const handleSetTimerAutoFinish = useCallback(() => {
    if (!day || !currentPos) return;
    const ex = day.exercises[currentPos.e];
    live.onSetTimerFinish(ex, currentPos.e, currentPos.s, activeSession?.entries?.length ?? 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, currentPos, activeSession]);

  const setTimer = useSetTimer({
    onComplete: finalizeTimedSet,         // fires from acknowledge() AND stopEarly()
    onAutoFinish: handleSetTimerAutoFinish, // fires only on natural hit-zero
  });
  const live = useLiveActivity({ day, session: activeSession, isResting, isDayDone, currentPos });

  useEffect(() => {
    if (isDayDone && activeSession && !activeSession.completedAt) {
      completeSession();
      live.onEnd();
    }
  }, [isDayDone, activeSession, completeSession, live]);

  // ─── Handlers ────────────────────────────────────────────────────────────
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
      const trendPairs = lastTwoWorkingSets(sessions, ex.name, activeSession?.id);
      // Trend hint shows the last 1–2 working sets in the user's unit.
      const trend = trendPairs
        .map(({ entry }) => `${Math.round(fromLb(entry.weight, unitSystem) * 10) / 10}×${entry.reps}`)
        .join(' · ');
      setLogSheet({
        exerciseIndex: currentPos.e, setIndex: currentPos.s, exerciseName: ex.name, setLabel: setLbl, isWarmup,
        // SetLogSheet stores these as lb internally, then the picker
        // converts to the display unit. Pass lb here.
        defaultWeight: tracksWeight && avg ? avg.weight : 0,
        defaultReps: tracksReps && avg ? avg.reps : 0,
        tracksWeight, tracksReps,
        trendHint: trend ? `last ${trend}` : null,
      });
    } else {
      // Nothing to log — finalize the entry right away so it's not a placeholder.
      recordSetValues({ exerciseIndex: currentPos.e, setIndex: currentPos.s, weight: 0, reps: 0, toFailure: false, unit: 'lb' });
    }
  }, [currentPos, day, sessions, activeSession, markSetDone, recordSetValues, startRest, live, unitSystem]);

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
  const canShowSecondary = !isDayDone && !isResting && !setTimer.isRunning && !setTimer.isFinished;
  const primary = resolvePrimaryAction({
    isDayDone, isResting,
    setTimerFinished: setTimer.isFinished,
    setTimerRunning: setTimer.isRunning,
    isTimed, currentEx,
    handlers: {
      onComplete: handleComplete, onSkipRest: handleSkipRest,
      onAcknowledgeSetTimer: handleAcknowledgeSetTimer,
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

      <SessionFooter
        doneSets={doneSets}
        totalSets={totalSets}
        dayColor={day.color}
        primary={primary}
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
