import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, radius, spacing, text } from '../../theme';
import { useWorkoutData, useSessionData } from '../../shell/store';
import { ChevronLeft } from '../../shell/icons';
import { useRestTimer } from './hooks/useRestTimer';
import { useSetTimer } from './hooks/useSetTimer';
import { useLiveActivity } from './hooks/useLiveActivity';
import { ExerciseList } from '../../components/workout/ExerciseList';
import { SetLogSheet } from '../../components/workout/SetLogSheet';
import { Button, IconButton } from '../../components/primitives/Button';
import { CircularTimer } from '../../components/workout/CircularTimer';
import { ExerciseHero, RestHero, CompletionHero } from './SessionHeroes';
import { ExerciseHistorySheet } from './ExerciseHistorySheet';
import { findNextSet, isDayComplete, dayProgress } from './logic/progress';
import { lastTwoWorkingSets, averageOfLastN } from './logic/suggestions';
import { exerciseTotalSets, getSetLabel, formatDuration } from '../../utils/exercise';
import { confirm } from '../../utils/confirm';

function useLayout() {
  const { height } = useWindowDimensions();
  const timerSize = Math.round(Math.min(180, height * 0.22));
  const nameFontSize = Math.round(Math.min(34, height * 0.046));
  const isSmall = height < 700;
  const mainContentMinHeight = timerSize + (isSmall ? 80 : 110);
  return { timerSize, nameFontSize, isSmall, mainContentMinHeight };
}

function getRestDuration(day, exercise, exIndex, setIndex) {
  const isLastSet = setIndex === exerciseTotalSets(exercise) - 1;
  const isLastEx = exIndex === day.exercises.length - 1;
  if (isLastSet && !isLastEx) {
    return exercise.nextRestSeconds ?? day.exerciseRestSeconds ?? 180;
  }
  return exercise.restSeconds;
}

function UndoIcon({ color }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" fill={color} />
    </Svg>
  );
}


// "Avg of last 5: 80 lb × 8" reference shown under the rep guide so the user
// has a quick sense of where they're at without opening the history sheet.
function LastSetHint({ recent }) {
  if (!recent) return null;
  const detail = `${recent.weight} lb × ${recent.reps}`;
  return (
    <View style={hint.row}>
      <Text style={hint.label}>AVG · LAST {recent.count}</Text>
      <Text style={hint.value}>{detail}</Text>
    </View>
  );
}

const hint = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    alignSelf: 'center',
  },
  label: { ...text.eyebrowSmall, color: colors.textTertiary, letterSpacing: 1.6 },
  value: { ...text.monoSubhead, fontWeight: '700', color: colors.text },
});

export function ActiveSessionScreen({ navigation, route }) {
  useKeepAwake();
  const dayIndex = route.params?.dayIndex ?? 0;
  const { config } = useWorkoutData();
  const day = config.days[dayIndex];
  const sessionData = useSessionData();
  const {
    activeSession, sessions, markSetDone, recordSetValues, popUndo, pushUndo,
    completeSession, pauseSession, skipExercise,
  } = sessionData;

  const { timerSize, nameFontSize, isSmall, mainContentMinHeight } = useLayout();
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

  const handleSetTimerComplete = useCallback((elapsedSeconds) => {
    if (!day || !currentPos) return;
    const ex = day.exercises[currentPos.e];
    const isWarmup = ex.warmup && currentPos.s === 0;
    const setLbl = getSetLabel(ex, currentPos.s);
    const restDuration = getRestDuration(day, ex, currentPos.e, currentPos.s);
    const nextEx = currentPos.s === exerciseTotalSets(ex) - 1 && currentPos.e + 1 < day.exercises.length
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

  const handleStartSetTimer = useCallback(() => {
    if (!currentEx) return;
    setTimer.start(currentEx.durationSeconds || 60);
  }, [currentEx, setTimer]);

  const handleStopSetTimer = useCallback(() => {
    setTimer.stopEarly();
  }, [setTimer]);

  const handleDone = useCallback(() => {
    if (!currentPos || !day) return;
    const ex = day.exercises[currentPos.e];
    const isWarmup = ex.warmup && currentPos.s === 0;
    const setLbl = getSetLabel(ex, currentPos.s);
    const restDuration = getRestDuration(day, ex, currentPos.e, currentPos.s);
    const nextEx = currentPos.s === exerciseTotalSets(ex) - 1 && currentPos.e + 1 < day.exercises.length
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
    live.onSetDone(ex, currentPos.e, currentPos.s, restDuration, setLbl, (activeSession?.entries?.length ?? 0) + 1);

    const tracksWeight = ex.tracksWeight !== false;
    const tracksReps = ex.tracksReps !== false;
    if (tracksWeight || tracksReps) {
      const avg = averageOfLastN(sessions, ex.name, 5, activeSession?.id);
      const trend = lastTwoWorkingSets(sessions, ex.name, activeSession?.id)
        .map(({ entry }) => `${entry.weight}×${entry.reps}`)
        .join(' · ');
      setLogSheet({
        exerciseIndex: currentPos.e,
        setIndex: currentPos.s,
        exerciseName: ex.name,
        setLabel: setLbl,
        isWarmup,
        defaultWeight: tracksWeight && avg ? avg.weight : 0,
        defaultReps: tracksReps && avg ? avg.reps : 0,
        tracksWeight,
        tracksReps,
        trendHint: trend ? `last ${trend}` : null,
      });
    } else {
      // Nothing to log — finalize the entry right away so it's not a placeholder.
      recordSetValues({
        exerciseIndex: currentPos.e,
        setIndex: currentPos.s,
        weight: 0, reps: 0, toFailure: false, unit: 'lb',
      });
    }
  }, [currentPos, day, sessions, activeSession, markSetDone, recordSetValues, startRest, live]);

  const handleSaveLog = useCallback(({ weight, reps, toFailure }) => {
    if (!logSheet) return;
    recordSetValues({
      exerciseIndex: logSheet.exerciseIndex,
      setIndex: logSheet.setIndex,
      weight, reps, toFailure, unit: 'lb',
    });
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

  const totalSetsForDay = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
  const undoEnabled = (activeSession.undoStack?.length ?? 0) > 0;
  const canShowSecondary = !isDayDone && !isResting && !setTimer.isRunning;

  // Primary action button label/handler/variant
  let primary;
  if (isDayDone) primary = { label: 'Back to Days', onPress: handleComplete, variant: 'filled' };
  else if (isResting) primary = { label: 'Skip Rest', onPress: handleSkipRest, variant: 'outline' };
  else if (setTimer.isRunning) primary = { label: 'Stop & Save', onPress: handleStopSetTimer, variant: 'outline' };
  else if (isTimed) primary = { label: `Start ${formatDuration(currentEx.durationSeconds)}`, onPress: handleStartSetTimer, variant: 'filled' };
  else primary = { label: 'Done', onPress: handleDone, variant: 'filled' };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.header}>
        <IconButton onPress={handleBack}>
          <ChevronLeft color={colors.text} />
        </IconButton>
        <View style={s.headerCenter}>
          <Text style={s.headerDay} numberOfLines={1}>
            Day {day.day}{'  '}
            <Text style={{ color: day.color }}>{day.title}</Text>
          </Text>
          {day.focus ? <Text style={s.headerFocus}>{day.focus}</Text> : null}
        </View>
        {undoEnabled ? (
          <IconButton onPress={handleUndo}>
            <UndoIcon color={colors.textSecondary} />
          </IconButton>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}
      </View>

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
        {isDayDone ? (
          <CompletionHero day={day} doneSets={doneSets} />
        ) : isResting ? (
          <RestHero secondsLeft={secondsLeft} totalSeconds={totalSeconds} nextPos={currentPos} day={day} timerSize={timerSize} isSmall={isSmall} />
        ) : setTimer.isRunning ? (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <Text style={s.timedExName} numberOfLines={1}>{currentEx?.name}</Text>
            <CircularTimer secondsLeft={setTimer.secondsLeft} totalSeconds={setTimer.totalSeconds} size={timerSize} label="WORK" />
            <Text style={s.timedHint}>Hold steady — auto-finishes at 0:00</Text>
          </View>
        ) : currentPos ? (
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <ExerciseHero day={day} exIndex={currentPos.e} setIndex={currentPos.s} nameFontSize={nameFontSize} isSmall={isSmall} />
            <LastSetHint recent={recentAvg} />
          </View>
        ) : null}
      </View>

      <View style={s.bottom}>
        <View style={s.progressContainer}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${totalSetsForDay > 0 ? (doneSets / totalSetsForDay) * 100 : 0}%`, backgroundColor: day.color }]} />
          </View>
          <Text style={s.progressLabel}>{doneSets}/{totalSetsForDay}</Text>
        </View>

        <Button label={primary.label} onPress={primary.onPress} color={day.color} variant={primary.variant} />

        {canShowSecondary && (
          <TouchableOpacity onPress={handleSkipExercise} style={s.skipExBtn} activeOpacity={0.7}>
            <Text style={s.skipExText}>Skip this exercise</Text>
          </TouchableOpacity>
        )}
      </View>

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

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, height: 48, gap: spacing.sm },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  headerDay: { ...text.title3, fontSize: fontSize.headline, color: colors.text, fontWeight: '700' },
  headerFocus: { ...text.bodySecondary, fontSize: 12, marginTop: 1 },

  listScroll: { flexShrink: 1, flexGrow: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md, marginTop: 2 },

  mainContent: {
    flexGrow: 1, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },

  bottom: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  progressTrack: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, width: 40, textAlign: 'right', fontFamily: fonts.mono },

  skipExBtn: {
    alignSelf: 'center',
    paddingVertical: 8, paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  skipExText: { ...text.buttonSmall, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  timedExName: { ...text.title2, fontSize: 22, textAlign: 'center', paddingHorizontal: spacing.lg },
  timedHint: { ...text.bodySecondary, color: colors.textTertiary, fontSize: 13, textAlign: 'center' },
});
