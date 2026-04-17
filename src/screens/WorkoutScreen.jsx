import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, shadow, fontSize, fonts } from '../constants/theme';
import { useRestTimer } from '../hooks/useRestTimer';
import { CircularTimer } from '../components/CircularTimer';
import { ExerciseList } from '../components/ExerciseList';
import { SetLogModal } from '../components/SetLogModal';
import { exerciseTotalSets, getSetLabel, getRepsGuide } from '../utils/exercise';
import { startLiveActivity, updateLiveActivity, endLiveActivity } from '../modules/liveActivity';

// ─── Layout ───────────────────────────────────────────────────────────────────

function useLayout() {
  const { height } = useWindowDimensions();
  const timerSize = Math.round(Math.min(175, height * 0.21));
  const nameFontSize = Math.round(Math.min(34, height * 0.046));
  const isSmall = height < 700;
  return { timerSize, nameFontSize, isSmall };
}

// ─── Day Selection Card ──────────────────────────────────────────────────────

function DaySelectCard({ day, dayProgress, isDone, onPress }) {
  const totalSets = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
  const doneSets = dayProgress
    ? dayProgress.sets.reduce((acc, exSets, ei) => {
        const exTotal = exerciseTotalSets(day.exercises[ei] ?? { sets: 1, warmup: false });
        return acc + exSets.slice(0, exTotal).filter(Boolean).length;
      }, 0)
    : 0;
  const pct = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <TouchableOpacity
      style={[styles.dayCard, isDone && styles.dayCardDone]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.dayColorBar, { backgroundColor: isDone ? colors.success : day.color }]} />
      <View style={[styles.dayBubble, { backgroundColor: (isDone ? colors.success : day.color) + '1A' }]}>
        <Text style={[styles.dayNumber, { color: isDone ? colors.success : day.color }]}>{day.day}</Text>
      </View>
      <View style={styles.dayCardContent}>
        <View style={styles.dayCardTop}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={[styles.dayCardTitle, isDone && styles.dayCardTitleDone]} numberOfLines={1}>
              {day.title}
            </Text>
            {day.focus ? <Text style={styles.dayCardFocus} numberOfLines={1}>{day.focus}</Text> : null}
          </View>
          {isDone ? (
            <View style={styles.checkBadge}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          ) : (
            <Text style={[styles.dayProgressText, doneSets > 0 && { color: day.color }]}>
              {doneSets}/{totalSets}
            </Text>
          )}
        </View>
        {!isDone && doneSets > 0 && (
          <View style={styles.dayProgressTrack}>
            <View style={[styles.dayProgressFill, { width: `${pct * 100}%`, backgroundColor: day.color }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Day Selection View ──────────────────────────────────────────────────────

function DaySelectionView({ days, progress, doneDays, allDone, onSelectDay, onResetAll }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.selectionHeader}>
        <View>
          <Text style={styles.selectionTitle}>Workout</Text>
          <Text style={styles.selectionSubtitle}>Choose a day</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.selectionList}
        showsVerticalScrollIndicator={false}
      >
        {days.map((day, index) => (
          <DaySelectCard
            key={`${day.day}-${index}`}
            day={day}
            dayProgress={progress?.[index]}
            isDone={doneDays[index]}
            onPress={() => onSelectDay(index)}
          />
        ))}

        {allDone && (
          <View style={styles.allDoneBanner}>
            <Text style={styles.allDoneText}>Week complete!</Text>
            <Text style={styles.allDoneSubtext}>
              Great work. Start the next cycle whenever you're ready.
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Exercise View ───────────────────────────────────────────────────────────

function ExerciseView({ day, exIndex, setIndex, nameFontSize, isSmall }) {
  const exercise = day.exercises[exIndex];
  const isWarmupSet = exercise.warmup && setIndex === 0;
  const setLbl = getSetLabel(exercise, setIndex);
  const repsGuide = getRepsGuide(exercise, setIndex);

  return (
    <View style={styles.exerciseView}>
      <Text style={styles.exerciseCounter}>
        {exIndex + 1} of {day.exercises.length}
      </Text>
      <Text style={[styles.setLabel, { color: isWarmupSet ? colors.textSecondary : day.color }]}>
        {setLbl.toUpperCase()}
      </Text>
      <Text
        style={[styles.exerciseName, { fontSize: nameFontSize, lineHeight: nameFontSize * 1.2 }]}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={2}
      >
        {exercise.name}
      </Text>
      <Text style={[styles.repsGuide, isSmall && { fontSize: fontSize.footnote }]}>
        {repsGuide}
      </Text>
    </View>
  );
}

// ─── Rest View ───────────────────────────────────────────────────────────────

function RestView({ secondsLeft, totalSeconds, nextPos, day, timerSize, isSmall }) {
  const hasNext = nextPos !== null;
  const nextExercise = hasNext ? day.exercises[nextPos.e] : null;
  const nextSetLabel = hasNext ? getSetLabel(nextExercise, nextPos.s) : null;

  return (
    <View style={[styles.restView, { gap: isSmall ? spacing.lg : spacing.xl }]}>
      <CircularTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} size={timerSize} />
      <View style={styles.nextUpContainer}>
        {hasNext ? (
          <>
            <Text style={styles.nextUpLabel}>Up next</Text>
            <Text style={styles.nextUpExercise} numberOfLines={1}>{nextExercise.name}</Text>
            <Text style={[styles.nextUpSet, { color: day.color }]}>{nextSetLabel.toUpperCase()}</Text>
          </>
        ) : (
          <Text style={styles.nextUpLabel}>Last set — almost there!</Text>
        )}
      </View>
    </View>
  );
}

// ─── Completion View ─────────────────────────────────────────────────────────

function CompletionView({ day, doneSets }) {
  const totalSets = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
  return (
    <View style={styles.completionView}>
      <View style={[styles.completionBadge, { borderColor: colors.success }]}>
        <Text style={styles.completionCheck}>✓</Text>
      </View>
      <Text style={styles.completionTitle}>Day {day.day} Complete</Text>
      <Text style={styles.completionSubtitle}>
        {day.title}{day.focus ? ` · ${day.focus}` : ''}
      </Text>
      <Text style={styles.completionStats}>{doneSets} sets · {day.exercises.length} exercises</Text>
    </View>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function WorkoutProgressBar({ done, total, color }) {
  const pct = total > 0 ? done / total : 0;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressLabel}>{done}/{total}</Text>
    </View>
  );
}

// ─── Hold Circle Button ──────────────────────────────────────────────────────

function HoldCircleButton({ children, onHoldComplete, holdDuration = 550, buttonStyle }) {
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const midTimer = useRef(null);
  const holdTimer = useRef(null);
  const fired = useRef(false);

  const fire = useCallback(() => {
    fired.current = true;
    progress.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onHoldComplete();
  }, [onHoldComplete, progress]);

  const onPressIn = useCallback(() => {
    fired.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    midTimer.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, holdDuration * 0.55);
    holdTimer.current = setTimeout(fire, holdDuration);
    animRef.current = Animated.timing(progress, { toValue: 1, duration: holdDuration, useNativeDriver: true });
    animRef.current.start();
  }, [progress, holdDuration, fire]);

  const onPressOut = useCallback(() => {
    if (fired.current) return;
    clearTimeout(midTimer.current);
    clearTimeout(holdTimer.current);
    animRef.current?.stop();
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] });
  const overlayOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={16}>
      <Animated.View style={[buttonStyle, { transform: [{ scale }], overflow: 'hidden' }]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.text, opacity: overlayOpacity, borderRadius: radius.full }]}
        />
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Hold Button ─────────────────────────────────────────────────────────────

function HoldButton({ label, onHoldComplete, color, variant = 'filled', holdDuration = 650 }) {
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const midTimer = useRef(null);
  const holdTimer = useRef(null);
  const fired = useRef(false);

  const fire = useCallback(() => {
    fired.current = true;
    progress.setValue(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onHoldComplete();
  }, [onHoldComplete, progress]);

  const onPressIn = useCallback(() => {
    fired.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    midTimer.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, holdDuration * 0.55);
    holdTimer.current = setTimeout(fire, holdDuration);
    animRef.current = Animated.timing(progress, { toValue: 1, duration: holdDuration, useNativeDriver: true });
    animRef.current.start();
  }, [progress, holdDuration, fire]);

  const onPressOut = useCallback(() => {
    if (fired.current) return;
    clearTimeout(midTimer.current);
    clearTimeout(holdTimer.current);
    animRef.current?.stop();
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [progress]);

  const isFilled = variant === 'filled';

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <View
        style={[
          styles.actionButton,
          isFilled
            ? { backgroundColor: color }
            : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
          { overflow: 'hidden' },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isFilled ? 'rgba(255,255,255,0.22)' : color + '28',
              transform: [{
                translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-420, 0] }),
              }],
            },
          ]}
        />
        <Text style={[styles.actionButtonText, { color: isFilled ? '#fff' : colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Active Workout View ─────────────────────────────────────────────────────

function ActiveWorkoutView({
  dayIndex, day, progress, doneDays, markSetDone, unmarkSetDone, getNextSet,
  onBack, logSet, getLastWeight, getLastReps, startSession, completeSession,
}) {
  useKeepAwake();

  const { timerSize, nameFontSize, isSmall } = useLayout();
  const { isResting, secondsLeft, totalSeconds, startRest, skipRest } = useRestTimer();

  const isDayDone = doneDays[dayIndex];
  const currentPos = getNextSet(dayIndex);

  // Undo history
  const [actionHistory, setActionHistory] = useState([]);
  const undoKey = `@workout_undo_v1_day${dayIndex}`;

  // Set log modal state
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logModalData, setLogModalData] = useState(null);

  // Start a session and Live Activity when the workout begins
  const sessionStarted = useRef(false);
  useEffect(() => {
    if (!sessionStarted.current) {
      sessionStarted.current = true;
      startSession(day, dayIndex);

      const firstEx = day.exercises[0];
      const total = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
      startLiveActivity({
        dayTitle: day.title,
        exerciseName: firstEx?.name ?? '',
        setLabel: firstEx ? getSetLabel(firstEx, 0) : '',
        totalSets: total,
        exSetNum: 1,
        exSetTotal: firstEx ? exerciseTotalSets(firstEx) : 1,
      });
    }
  }, [day, dayIndex, startSession]);

  // Complete session when day is done
  useEffect(() => {
    if (isDayDone && sessionStarted.current) {
      completeSession();
      endLiveActivity();
    }
  }, [isDayDone, completeSession]);

  // When rest ends → show "LOG SET" state on Live Activity, then transition to READY
  const prevIsResting = useRef(false);
  useEffect(() => {
    if (prevIsResting.current && !isResting && !isDayDone && currentPos) {
      const nextEx = day.exercises[currentPos.e];
      // First show "timer done / log set" state
      updateLiveActivity({
        dayTitle: day.title,
        exerciseName: nextEx?.name ?? '',
        secondsRemaining: 0,
        setsCompleted: doneSets,
        totalSets,
        isResting: true,
        timerDone: true,
        exSetNum: currentPos.s + 1,
        exSetTotal: nextEx ? exerciseTotalSets(nextEx) : 1,
      });
      // After 5 seconds, transition to READY state
      const t = setTimeout(() => {
        updateLiveActivity({
          dayTitle: day.title,
          exerciseName: nextEx?.name ?? '',
          secondsRemaining: 0,
          setsCompleted: doneSets,
          totalSets,
          isResting: false,
          timerDone: false,
          exSetNum: currentPos.s + 1,
          exSetTotal: nextEx ? exerciseTotalSets(nextEx) : 1,
        });
      }, 5000);
      return () => clearTimeout(t);
    }
    prevIsResting.current = isResting;
  }, [isResting, isDayDone, currentPos, day, doneSets, totalSets]);

  // Load persisted undo history
  useEffect(() => {
    AsyncStorage.getItem(undoKey)
      .then(raw => { if (raw) try { setActionHistory(JSON.parse(raw)); } catch {} })
      .catch(() => {});
  }, [undoKey]);

  // Persist undo history
  useEffect(() => {
    AsyncStorage.setItem(undoKey, JSON.stringify(actionHistory)).catch(() => {});
  }, [actionHistory, undoKey]);

  const { doneSets, totalSets } = useMemo(() => {
    if (!progress) return { doneSets: 0, totalSets: 0 };
    let done = 0, total = 0;
    progress[dayIndex].sets.forEach((exSets, ei) => {
      const exTotal = exerciseTotalSets(day.exercises[ei]);
      exSets.slice(0, exTotal).forEach(v => { total++; if (v) done++; });
    });
    return { doneSets: done, totalSets: total };
  }, [progress, dayIndex, day]);

  // Determine rest duration based on whether we're moving between exercises
  const getRestDuration = useCallback((exercise, exIndex, setIndex) => {
    const isLastSetOfExercise = setIndex === exerciseTotalSets(exercise) - 1;
    const isLastExercise = exIndex === day.exercises.length - 1;

    if (isLastSetOfExercise && !isLastExercise) {
      // Moving to next exercise — use exercise rest time
      return day.exerciseRestSeconds ?? 180;
    }
    // Same exercise, between sets
    return exercise.restSeconds;
  }, [day]);

  // Done button handler
  const handleDone = useCallback(() => {
    if (!currentPos) return;
    const ex = day.exercises[currentPos.e];
    const isWarmup = ex.warmup && currentPos.s === 0;
    const setLbl = getSetLabel(ex, currentPos.s);
    const restDuration = getRestDuration(ex, currentPos.e, currentPos.s);

    // Figure out what's next (for the notification message)
    const isLastSetOfEx = currentPos.s === exerciseTotalSets(ex) - 1;
    const nextExName = isLastSetOfEx && currentPos.e + 1 < day.exercises.length
      ? day.exercises[currentPos.e + 1].name
      : ex.name;

    // Mark set done and start rest
    markSetDone(dayIndex, currentPos.e, currentPos.s);
    startRest(restDuration, nextExName);

    // Record undo action
    setActionHistory(prev => [...prev, {
      type: 'done',
      exIndex: currentPos.e,
      setIndex: currentPos.s,
      restSeconds: restDuration,
    }]);

    // Show set log modal
    const lastWeight = getLastWeight(ex.name);
    const lastReps = getLastReps(ex.name);
    setLogModalData({
      exerciseName: ex.name,
      exerciseIndex: currentPos.e,
      setIndex: currentPos.s,
      setLabel: setLbl,
      isWarmup,
      defaultWeight: lastWeight?.weight ?? 0,
      defaultReps: lastReps ?? 0,
    });
    setLogModalVisible(true);

    // Update live activity — pass restEndTime so the native timer counts down
    updateLiveActivity({
      dayTitle: day.title,
      exerciseName: ex.name,
      setLabel: setLbl,
      secondsRemaining: restDuration,
      setsCompleted: doneSets + 1,
      totalSets,
      isResting: true,
      exSetNum: currentPos.s + 1,
      exSetTotal: exerciseTotalSets(ex),
    });
  }, [currentPos, day, dayIndex, markSetDone, startRest, getRestDuration, getLastWeight, getLastReps, doneSets, totalSets]);

  // Save set log
  const handleSaveLog = useCallback(({ weight, reps, toFailure }) => {
    if (!logModalData) return;
    logSet({
      exerciseName: logModalData.exerciseName,
      exerciseIndex: logModalData.exerciseIndex,
      setIndex: logModalData.setIndex,
      setLabel: logModalData.setLabel,
      isWarmup: logModalData.isWarmup,
      weight,
      unit: 'lb',
      reps,
      toFailure,
    });
    setLogModalVisible(false);
    setLogModalData(null);
  }, [logModalData, logSet]);

  const handleDismissLog = useCallback(() => {
    setLogModalVisible(false);
    setLogModalData(null);
  }, []);

  // Skip rest
  const handleSkipRest = useCallback(() => {
    setActionHistory(prev => [...prev, { type: 'skip', restSeconds: totalSeconds }]);
    skipRest();
    const nextEx = currentPos ? day.exercises[currentPos.e] : null;
    updateLiveActivity({
      dayTitle: day.title,
      exerciseName: nextEx?.name ?? '',
      setLabel: nextEx ? getSetLabel(nextEx, currentPos.s) : '',
      secondsRemaining: 0,
      setsCompleted: doneSets,
      totalSets,
      isResting: false,
      exSetNum: currentPos ? currentPos.s + 1 : 1,
      exSetTotal: nextEx ? exerciseTotalSets(nextEx) : 1,
    });
  }, [totalSeconds, skipRest, currentPos, day, doneSets, totalSets]);

  // Undo
  const handleUndo = useCallback(() => {
    if (actionHistory.length === 0) return;
    const action = actionHistory[actionHistory.length - 1];
    if (action.type === 'done') {
      unmarkSetDone(dayIndex, action.exIndex, action.setIndex);
      skipRest();
    } else if (action.type === 'skip') {
      startRest(action.restSeconds);
    }
    setActionHistory(prev => prev.slice(0, -1));
  }, [actionHistory, dayIndex, unmarkSetDone, skipRest, startRest]);

  const handleBack = useCallback(() => {
    endLiveActivity();
    onBack();
  }, [onBack]);

  if (!progress) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <HoldCircleButton onHoldComplete={handleBack} buttonStyle={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </HoldCircleButton>
        <View style={styles.headerCenter}>
          <Text style={styles.headerDayLabel} numberOfLines={1}>
            Day {day.day}{'  '}
            <Text style={{ color: day.color }}>{day.title}</Text>
          </Text>
          {day.focus ? <Text style={styles.headerFocus}>{day.focus}</Text> : null}
        </View>
        {actionHistory.length > 0 ? (
          <HoldCircleButton onHoldComplete={handleUndo} buttonStyle={styles.undoButton}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"
                fill={colors.textSecondary}
              />
            </Svg>
          </HoldCircleButton>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Exercise list */}
      <ExerciseList
        day={day}
        dayProgress={progress[dayIndex]}
        currentExIndex={isDayDone ? -1 : (currentPos?.e ?? -1)}
      />

      <View style={styles.divider} />

      {/* Main content */}
      <View style={styles.mainContent}>
        {isDayDone ? (
          <CompletionView day={day} doneSets={doneSets} />
        ) : isResting ? (
          <RestView
            secondsLeft={secondsLeft}
            totalSeconds={totalSeconds}
            nextPos={currentPos}
            day={day}
            timerSize={timerSize}
            isSmall={isSmall}
          />
        ) : currentPos ? (
          <ExerciseView
            day={day}
            exIndex={currentPos.e}
            setIndex={currentPos.s}
            nameFontSize={nameFontSize}
            isSmall={isSmall}
          />
        ) : null}
      </View>

      {/* Bottom */}
      <View style={styles.bottomArea}>
        <WorkoutProgressBar done={doneSets} total={totalSets} color={day.color} />
        {isDayDone ? (
          <HoldButton label="Back to Days" onHoldComplete={handleBack} color={day.color} holdDuration={550} />
        ) : isResting ? (
          <HoldButton label="Skip Rest" onHoldComplete={handleSkipRest} color={day.color} variant="outline" holdDuration={450} />
        ) : (
          <HoldButton label="Done" onHoldComplete={handleDone} color={day.color} holdDuration={650} />
        )}
      </View>

      {/* Set Log Modal */}
      <SetLogModal
        visible={logModalVisible}
        exerciseName={logModalData?.exerciseName ?? ''}
        setLabel={logModalData?.setLabel ?? ''}
        isWarmup={logModalData?.isWarmup ?? false}
        dayColor={day.color}
        defaultWeight={logModalData?.defaultWeight ?? 0}
        defaultReps={logModalData?.defaultReps ?? 0}
        onSave={handleSaveLog}
        onDismiss={handleDismissLog}
      />
    </SafeAreaView>
  );
}

// ─── Screen (handles day selection vs active workout) ────────────────────────

export function WorkoutScreen({
  days, progress, doneDays, allDone, resetAll, markSetDone, unmarkSetDone, getNextSet,
  logSet, getLastWeight, getLastReps, startSession, completeSession,
}) {
  const [activeDayIndex, setActiveDayIndex] = useState(null);

  const handleSelectDay = useCallback((index) => {
    setActiveDayIndex(index);
  }, []);

  const handleBack = useCallback(() => {
    setActiveDayIndex(null);
  }, []);

  if (activeDayIndex !== null && days[activeDayIndex]) {
    return (
      <ActiveWorkoutView
        key={activeDayIndex}
        dayIndex={activeDayIndex}
        day={days[activeDayIndex]}
        progress={progress}
        doneDays={doneDays}
        markSetDone={markSetDone}
        unmarkSetDone={unmarkSetDone}
        getNextSet={getNextSet}
        onBack={handleBack}
        logSet={logSet}
        getLastWeight={getLastWeight}
        getLastReps={getLastReps}
        startSession={startSession}
        completeSession={completeSession}
      />
    );
  }

  return (
    <DaySelectionView
      days={days}
      progress={progress}
      doneDays={doneDays}
      allDone={allDone}
      onSelectDay={handleSelectDay}
      onResetAll={resetAll}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Day selection
  selectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  selectionTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
    fontFamily: fonts.serif,
  },
  selectionSubtitle: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    fontFamily: fonts.mono,
  },
  selectionList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },

  // Day cards
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    ...shadow.sm,
  },
  dayCardDone: { opacity: 0.6 },
  dayColorBar: {
    width: 4,
    height: 40,
    borderRadius: radius.full,
  },
  dayBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  dayCardContent: { flex: 1, gap: spacing.xs },
  dayCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayCardTitle: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    fontFamily: fonts.mono,
  },
  dayCardTitleDone: { color: colors.textSecondary },
  dayCardFocus: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 1,
    fontFamily: fonts.mono,
  },
  dayProgressText: {
    fontSize: fontSize.footnote,
    fontWeight: '600',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  checkMark: { fontSize: 12, color: colors.success, fontWeight: '700' },
  dayProgressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  dayProgressFill: { height: '100%', borderRadius: radius.full },

  allDoneBanner: {
    marginTop: spacing.xl,
    backgroundColor: colors.successBg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success + '40',
    gap: spacing.xs,
  },
  allDoneText: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.success,
    fontFamily: fonts.serif,
  },
  allDoneSubtext: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: fonts.mono,
  },

  // Active workout header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '300',
    lineHeight: 28,
    marginTop: -2,
  },
  headerSpacer: { width: 36 },
  undoButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerDayLabel: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
    fontFamily: fonts.mono,
  },
  headerFocus: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: 1,
    fontFamily: fonts.mono,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: 2,
  },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Exercise view
  exerciseView: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseCounter: {
    fontSize: fontSize.footnote,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: fonts.mono,
  },
  setLabel: {
    fontSize: fontSize.subhead,
    fontWeight: '800',
    letterSpacing: 2.5,
    fontFamily: fonts.mono,
  },
  exerciseName: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    fontFamily: fonts.serif,
  },
  repsGuide: {
    fontSize: fontSize.callout,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fonts.mono,
  },

  // Rest view
  restView: { alignItems: 'center' },
  nextUpContainer: {
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
  },
  nextUpLabel: {
    fontSize: fontSize.caption,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: fonts.mono,
  },
  nextUpExercise: {
    fontSize: fontSize.title3,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    fontFamily: fonts.serif,
  },
  nextUpSet: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: fonts.mono,
  },

  // Completion view
  completionView: { alignItems: 'center', gap: spacing.sm },
  completionBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  completionCheck: { fontSize: 32, color: colors.success, fontWeight: '700' },
  completionTitle: {
    fontSize: fontSize.title2,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.serif,
  },
  completionSubtitle: {
    fontSize: fontSize.callout,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
  },
  completionStats: {
    fontSize: fontSize.subhead,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
  },

  // Bottom
  bottomArea: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 36,
    textAlign: 'right',
    fontFamily: fonts.mono,
  },
  actionButton: {
    height: 58,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  actionButtonText: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: fonts.mono,
  },
});
