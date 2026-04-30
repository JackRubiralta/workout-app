import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing, fonts, text } from '../../theme';
import { CircularTimer } from '../../components/workout/CircularTimer';
import { getRepsGuide, getSetLabel } from '../../utils/exercise';

export function ExerciseHero({ day, exIndex, setIndex, nameFontSize, isSmall }) {
  const exercise = day.exercises[exIndex];
  const isWarmup = exercise.warmup && setIndex === 0;
  return (
    <View style={s.hero}>
      <Text style={s.counter}>{exIndex + 1} of {day.exercises.length}</Text>
      <Text style={[s.label, { color: isWarmup ? colors.textSecondary : day.color }]}>
        {getSetLabel(exercise, setIndex).toUpperCase()}
      </Text>
      <Text
        style={[s.name, { fontSize: nameFontSize, lineHeight: nameFontSize * 1.2 }]}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={2}
      >
        {exercise.name}
      </Text>
      <Text style={[s.guide, isSmall && { fontSize: fontSize.footnote }]}>
        {getRepsGuide(exercise, setIndex)}
      </Text>
    </View>
  );
}

export function RestHero({ secondsLeft, totalSeconds, nextPos, day, timerSize, isSmall }) {
  const nextEx = nextPos ? day.exercises[nextPos.e] : null;
  const nextLabel = nextEx ? getSetLabel(nextEx, nextPos.s) : null;
  return (
    <View style={[s.restHero, { gap: isSmall ? spacing.lg : spacing.xl }]}>
      <CircularTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} size={timerSize} />
      <View style={s.nextUp}>
        {nextEx ? (
          <>
            <Text style={s.upNextLabel}>UP NEXT</Text>
            <Text style={s.upNextEx} numberOfLines={1}>{nextEx.name}</Text>
            <Text style={[s.upNextSet, { color: day.color }]}>{nextLabel.toUpperCase()}</Text>
          </>
        ) : (
          <Text style={s.upNextLabel}>LAST SET — ALMOST THERE</Text>
        )}
      </View>
    </View>
  );
}

export function CompletionHero({ day, doneSets }) {
  return (
    <View style={s.completion}>
      <View style={s.completionBadge}>
        <Text style={s.completionCheck}>✓</Text>
      </View>
      <Text style={s.completionTitle}>Day {day.day} Complete</Text>
      <Text style={s.completionSubtitle}>{day.title}{day.focus ? ` · ${day.focus}` : ''}</Text>
      <Text style={s.completionStats}>{doneSets} sets · {day.exercises.length} exercises</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { width: '100%', alignItems: 'center', gap: spacing.sm },
  counter: { ...text.eyebrow, color: colors.textSecondary, letterSpacing: 1 },
  label: { ...text.setLabel },
  name: { ...text.exerciseName },
  guide: { fontSize: fontSize.callout, color: colors.textSecondary, fontFamily: fonts.mono, marginTop: 2 },

  restHero: { alignItems: 'center' },
  nextUp: { alignItems: 'center', gap: 4, minHeight: 52 },
  upNextLabel: { ...text.eyebrow, color: colors.textTertiary, letterSpacing: 1.2 },
  upNextEx: { ...text.title3, fontWeight: '600', textAlign: 'center' },
  upNextSet: { ...text.monoSubhead, fontWeight: '600', letterSpacing: 0.3 },

  completion: { alignItems: 'center', gap: spacing.sm },
  completionBadge: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.successBg, borderWidth: 2, borderColor: colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  completionCheck: { fontSize: 32, color: colors.success, fontWeight: '700' },
  completionTitle: { ...text.title2 },
  completionSubtitle: { ...text.monoSubhead, fontSize: fontSize.callout },
  completionStats: { ...text.monoSubhead, color: colors.textTertiary },
});
