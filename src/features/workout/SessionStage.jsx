import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, text } from '../../theme';
import { CircularTimer } from '../../components/workout/CircularTimer';
import { ExerciseHero, RestHero, CompletionHero } from './SessionHeroes';

/**
 * The big middle area of the active session screen. Renders one of four
 * states based on the props (in priority order):
 *   1. Day complete       → <CompletionHero />
 *   2. Resting             → <RestHero />
 *   3. Set timer running   → exercise name + <CircularTimer label="WORK" />
 *   4. Working through a set → <ExerciseHero /> + last-set hint
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
        <LastSetHint recent={recentAvg} />
      </View>
    );
  }
  return null;
}

// "AVG · LAST 5: 80 lb × 8" reference shown under the hero so the user has
// a quick sense of where they're at without opening the history sheet.
function LastSetHint({ recent }) {
  if (!recent) return null;
  return (
    <View style={hint.row}>
      <Text style={hint.label}>AVG · LAST {recent.count}</Text>
      <Text style={hint.value}>{recent.weight} lb × {recent.reps}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  timedWrap: { alignItems: 'center', gap: spacing.md },
  workingWrap: { alignItems: 'center', gap: spacing.sm },
  timedExName: { ...text.title2, fontSize: 22, textAlign: 'center', paddingHorizontal: spacing.lg },
  timedHint: { ...text.bodySecondary, color: colors.textTertiary, fontSize: 13, textAlign: 'center' },
});

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
