import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, text } from '../../theme';
import { Chip } from '../../ui';
import { CircularTimer } from './components/CircularTimer';
import { ExerciseHero, RestHero, CompletionHero } from './SessionHeroes';

/**
 * The big middle area of the active session screen. Renders one of five
 * states based on the props (in priority order):
 *   1. Day complete             → <CompletionHero />
 *   2. Resting                   → <RestHero />
 *   3. Set timer FINISHED        → green DONE ring + "Tap Done to log" hint
 *   4. Set timer running         → exercise name + <CircularTimer label="WORK" />
 *   5. Working through a set     → <ExerciseHero /> + last-set hint + skip pill
 *
 * Pure presentational — every value comes from props. Keeps
 * ActiveSessionScreen focused on state + handlers.
 */
export function SessionStage({
  day,
  doneSets,
  isDayDone,
  isResting,
  secondsLeft,
  totalSeconds,
  setTimerRunning,
  setTimerFinished,
  setTimerSecondsLeft,
  setTimerTotalSeconds,
  currentEx,
  currentPos,
  recentAvg, // { count: number, label: string } already formatted in the user's unit
  timerSize,
  isSmall,
  nameFontSize,
  onSkipExercise,
}) {
  if (isDayDone) {
    return <CompletionHero day={day} doneSets={doneSets} />;
  }
  if (isResting) {
    return (
      <RestHero
        secondsLeft={secondsLeft}
        totalSeconds={totalSeconds}
        nextPos={currentPos}
        day={day}
        timerSize={timerSize}
        isSmall={isSmall}
      />
    );
  }
  if (setTimerFinished) {
    return (
      <View style={s.timedWrap}>
        <Text style={s.timedExName} numberOfLines={1}>{currentEx?.name}</Text>
        <CircularTimer
          secondsLeft={0}
          totalSeconds={setTimerTotalSeconds || 1}
          size={timerSize}
          label="DONE"
          color={colors.success}
        />
        <Text style={[s.timedHint, { color: colors.success }]}>Tap Done to log this set</Text>
      </View>
    );
  }
  if (setTimerRunning) {
    return (
      <View style={s.timedWrap}>
        <Text style={s.timedExName} numberOfLines={1}>{currentEx?.name}</Text>
        <CircularTimer
          secondsLeft={setTimerSecondsLeft}
          totalSeconds={setTimerTotalSeconds}
          size={timerSize}
          label="WORK"
        />
        <Text style={s.timedHint}>Hold steady — auto-finishes at 0:00</Text>
      </View>
    );
  }
  if (currentPos) {
    return (
      <View style={s.workingWrap}>
        <ExerciseHero
          day={day}
          exIndex={currentPos.e}
          setIndex={currentPos.s}
          nameFontSize={nameFontSize}
          isSmall={isSmall}
        />
        {recentAvg ? (
          <Chip
            variant="static"
            eyebrow={`AVG · LAST ${recentAvg.count}`}
            label={recentAvg.label}
            style={s.hintChip}
          />
        ) : null}
        {onSkipExercise ? (
          <Chip label="Skip this exercise" onPress={onSkipExercise} style={s.skipChip} />
        ) : null}
      </View>
    );
  }
  return null;
}

const s = StyleSheet.create({
  timedWrap: { alignItems: 'center', gap: spacing.md },
  workingWrap: { alignItems: 'center', gap: spacing.sm },
  timedExName: { ...text.title2, fontSize: 22, textAlign: 'center', paddingHorizontal: spacing.lg },
  timedHint: { ...text.bodySecondary, color: colors.textTertiary, fontSize: 13, textAlign: 'center' },

  hintChip: { alignSelf: 'center' },
  // A small extra top margin so the pill reads as "secondary action below
  // the hero" rather than another stat row stacked tight against the AVG
  // chip above it.
  skipChip: { alignSelf: 'center', marginTop: spacing.xs },
});
