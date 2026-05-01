import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, spacing, text } from '@/shared/theme';
import { Chip } from '@/shared/components';
import { CircularTimer } from './CircularTimer';
import { ExerciseHero, RestHero, CompletionHero } from './SessionHeroes';
import type { DayTemplate, ExerciseTemplate, SetPosition } from '../types/workoutTypes';

export type SessionStageProps = {
  day: DayTemplate;
  doneSets: number;
  isDayDone: boolean;
  isResting: boolean;
  secondsLeft: number;
  totalSeconds: number;
  setTimerRunning: boolean;
  setTimerFinished: boolean;
  setTimerSecondsLeft: number;
  setTimerTotalSeconds: number;
  currentEx: ExerciseTemplate | null;
  currentPos: SetPosition | null;
  recentAvg: { count: number; label: string } | null;
  timerSize: number;
  isSmall: boolean;
  nameFontSize: number;
  onSkipExercise?: () => void;
};

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
  recentAvg,
  timerSize,
  isSmall,
  nameFontSize,
  onSkipExercise,
}: SessionStageProps) {
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
        <Text style={s.timedExName} numberOfLines={1}>
          {currentEx?.name}
        </Text>
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
        <Text style={s.timedExName} numberOfLines={1}>
          {currentEx?.name}
        </Text>
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
  timedExName: { ...(text.title2 as TextStyle), fontSize: 22, textAlign: 'center', paddingHorizontal: spacing.lg },
  timedHint: {
    ...(text.bodySecondary as TextStyle),
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
  },

  hintChip: { alignSelf: 'center' },
  skipChip: { alignSelf: 'center', marginTop: spacing.xs },
});
