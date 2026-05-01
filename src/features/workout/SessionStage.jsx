import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, text } from '../../theme';
import { Chip } from '../../components/primitives';
import { CircularTimer } from '../../components/workout/CircularTimer';
import { ExerciseHero, RestHero, CompletionHero } from './SessionHeroes';

/**
 * The big middle area of the active session screen. Renders one of four
 * states based on the props (in priority order):
 *   1. Day complete       → <CompletionHero />
 *   2. Resting             → <RestHero />
 *   3. Set timer running   → exercise name + <CircularTimer label="WORK" />
 *   4. Working through a set → <ExerciseHero /> + last-set hint + skip-this-exercise pill
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
  setTimerSecondsLeft,
  setTimerTotalSeconds,
  currentEx,
  currentPos,
  recentAvg,
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
            label={`${recentAvg.weight} lb × ${recentAvg.reps}`}
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
