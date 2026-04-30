import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, radius, spacing } from '../../theme';
import { exerciseTotalSets } from '../../utils/exercise';
import { isSetDone } from '../../features/workout/logic/progress';

function ExerciseRow({ name, index, sets, total, hasWarmup, isCurrent, isDone, dayColor, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, isCurrent && { backgroundColor: dayColor + '14', borderColor: dayColor + '35' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.badge,
          isDone
            ? { backgroundColor: dayColor, borderColor: dayColor }
            : isCurrent
            ? { borderColor: dayColor }
            : styles.badgeDefault,
        ]}
      >
        <Text style={[styles.badgeText, isDone ? { color: '#fff' } : isCurrent ? { color: dayColor } : { color: colors.textTertiary }]}>
          {isDone ? '✓' : index + 1}
        </Text>
      </View>
      <Text
        style={[styles.name, isDone ? styles.nameDone : isCurrent ? styles.nameCurrent : styles.nameUpcoming]}
        numberOfLines={1}
      >
        {name}
      </Text>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, s) => (
          <View
            key={s}
            style={[
              styles.dot,
              s === 0 && hasWarmup && styles.dotWarmup,
              sets[s] ? { backgroundColor: dayColor } : isCurrent ? { backgroundColor: dayColor + '40' } : null,
            ]}
          />
        ))}
      </View>
    </Wrapper>
  );
}

export function ExerciseList({ day, session, currentExIndex, onPressExercise }) {
  return (
    <View style={styles.container}>
      {day.exercises.map((ex, index) => {
        const total = exerciseTotalSets(ex);
        const sets = Array.from({ length: total }, (_, si) => isSetDone(session, index, si));
        const isDone = sets.every(Boolean);
        return (
          <ExerciseRow
            key={index}
            name={ex.name}
            index={index}
            sets={sets}
            total={total}
            hasWarmup={ex.warmup}
            isCurrent={index === currentExIndex}
            isDone={isDone}
            dayColor={day.color}
            onPress={onPressExercise ? () => onPressExercise(index) : null}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  badge: { width: 22, height: 22, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeDefault: { borderColor: colors.hairline },
  badgeText: { fontSize: 9, fontWeight: '700', fontFamily: fonts.mono },
  name: { flex: 1, fontSize: fontSize.footnote, fontFamily: fonts.mono, letterSpacing: 0.2 },
  nameDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  nameCurrent: { color: colors.text, fontWeight: '500' },
  nameUpcoming: { color: colors.textSecondary },
  dots: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  dot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.border },
  dotWarmup: { width: 5, height: 5, borderRadius: 1, marginTop: 1 },
});
