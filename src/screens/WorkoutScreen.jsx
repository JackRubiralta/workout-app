import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { exerciseTotalSets, getSetLabel, getRepsGuide } from '../utils/exercise';

// ─── Layout ───────────────────────────────────────────────────────────────────

function useLayout() {
  const { height } = useWindowDimensions();
  const timerSize = Math.round(Math.min(175, height * 0.21));
  const nameFontSize = Math.round(Math.min(34, height * 0.046));
  const isSmall = height < 700;
  return { timerSize, nameFontSize, isSmall };
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function ExerciseView({ day, exIndex, setIndex, nameFontSize, isSmall }) {
  const exercise = day.exercises[exIndex];
  const isWarmupSet = exercise.warmup && setIndex === 0;
  const setLabel = getSetLabel(exercise, setIndex);
  const repsGuide = getRepsGuide(exercise, setIndex);

  return (
    <View style={styles.exerciseView}>
      <Text style={styles.exerciseCounter}>
        {exIndex + 1} of {day.exercises.length}
      </Text>

      <Text style={[styles.setLabel, { color: isWarmupSet ? colors.textSecondary : day.color }]}>
        {setLabel.toUpperCase()}
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
            <Text style={styles.nextUpExercise} numberOfLines={1}>
              {nextExercise.name}
            </Text>
            <Text style={[styles.nextUpSet, { color: day.color }]}>
              {nextSetLabel.toUpperCase()}
            </Text>
          </>
        ) : (
          <Text style={styles.nextUpLabel}>Last set — almost there!</Text>
        )}
      </View>
    </View>
  );
}

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
      <Text style={styles.completionStats}>
        {doneSets} sets · {day.exercises.length} exercises
      </Text>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

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

// ─── Plain Action Button (tap) ────────────────────────────────────────────────

function ActionButton({ label, onPress, color, variant = 'filled' }) {
  const isFilled = variant === 'filled';
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isFilled
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionButtonText, { color: isFilled ? '#fff' : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Hold Circle Button (press-and-hold for small circular icon buttons) ─────

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
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdDuration,
      useNativeDriver: true,
    });
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
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.text, opacity: overlayOpacity, borderRadius: radius.full },
          ]}
        />
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Hold Button (press-and-hold to confirm) ──────────────────────────────────

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
    // Mid-hold haptic escalation
    midTimer.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, holdDuration * 0.55);
    // Action is driven by a plain timer — no dependency on animation's finished flag,
    // which races with onPressOut's stop() call when useNativeDriver: true.
    holdTimer.current = setTimeout(fire, holdDuration);
    // Animation is purely visual from here on.
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdDuration,
      useNativeDriver: true,
    });
    animRef.current.start();
  }, [progress, holdDuration, fire]);

  const onPressOut = useCallback(() => {
    if (fired.current) return; // already completed — don't reverse
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
        {/* Fill sweep from left to right while holding */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isFilled ? 'rgba(255,255,255,0.22)' : color + '28',
              transform: [{
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-420, 0],
                }),
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

// ─── Screen ──────────────────────────────────────────────────────────────────

export function WorkoutScreen({ dayIndex, onBack, progress, doneDays, markSetDone, unmarkSetDone, getNextSet, days }) {
  useKeepAwake();

  const { timerSize, nameFontSize, isSmall } = useLayout();
  const day = days[dayIndex];
  const { isResting, secondsLeft, totalSeconds, startRest, skipRest } = useRestTimer();

  const isDayDone = doneDays[dayIndex];
  const currentPos = getNextSet(dayIndex);

  // Stack of reversible actions — allows undoing all the way back to set 1
  const [actionHistory, setActionHistory] = useState([]);
  const undoKey = `@workout_undo_v1_day${dayIndex}`;

  // Load persisted undo history when the screen opens
  useEffect(() => {
    AsyncStorage.getItem(undoKey)
      .then(raw => { if (raw) try { setActionHistory(JSON.parse(raw)); } catch {} })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // dayIndex never changes within a mounted WorkoutScreen

  // Persist every change so undo survives app restarts
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

  // Fires when the user holds the Done button long enough
  const handleDone = useCallback(() => {
    if (!currentPos) return;
    const ex = day.exercises[currentPos.e];
    markSetDone(dayIndex, currentPos.e, currentPos.s);
    startRest(ex.restSeconds);
    setActionHistory(prev => [...prev, { type: 'done', exIndex: currentPos.e, setIndex: currentPos.s, restSeconds: ex.restSeconds }]);
  }, [currentPos, day, dayIndex, markSetDone, startRest]);

  // Fires when the user holds Skip Rest long enough
  const handleSkipRest = useCallback(() => {
    setActionHistory(prev => [...prev, { type: 'skip', restSeconds: totalSeconds }]);
    skipRest();
  }, [totalSeconds, skipRest]);

  // Undo: pops and reverses the most recent action — can be pressed repeatedly
  const handleUndo = useCallback(() => {
    if (actionHistory.length === 0) return;
    const action = actionHistory[actionHistory.length - 1];
    if (action.type === 'done') {
      unmarkSetDone(dayIndex, action.exIndex, action.setIndex);
      skipRest(); // cancel rest timer if running
    } else if (action.type === 'skip') {
      startRest(action.restSeconds); // restart the skipped rest
    }
    setActionHistory(prev => prev.slice(0, -1));
  }, [actionHistory, dayIndex, unmarkSetDone, skipRest, startRest]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  if (!progress) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* ── Header ── */}
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
        {/* Undo button lives in the header's right slot */}
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

      {/* ── Exercise list ── */}
      <ExerciseList
        day={day}
        dayProgress={progress[dayIndex]}
        currentExIndex={isDayDone ? -1 : (currentPos?.e ?? -1)}
      />

      <View style={styles.divider} />

      {/* ── Main content ── */}
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

      {/* ── Bottom ── */}
      <View style={styles.bottomArea}>
        <WorkoutProgressBar done={doneSets} total={totalSets} color={day.color} />
        {isDayDone ? (
          <HoldButton label="Back to Home" onHoldComplete={handleBack} color={day.color} holdDuration={550} />
        ) : isResting ? (
          <HoldButton
            label="Skip Rest"
            onHoldComplete={handleSkipRest}
            color={day.color}
            variant="outline"
            holdDuration={450}
          />
        ) : (
          <HoldButton
            label="Done"
            onHoldComplete={handleDone}
            color={day.color}
            holdDuration={650}
          />
        )}
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
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

  // Main
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
  restView: {
    alignItems: 'center',
  },
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
  completionView: {
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  completionCheck: {
    fontSize: 32,
    color: colors.success,
    fontWeight: '700',
  },
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
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
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
