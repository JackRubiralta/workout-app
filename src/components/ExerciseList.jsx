import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fonts } from '../constants/theme';
<<<<<<< HEAD
import { SETS_PER_EXERCISE } from '../constants/workout';

// ─── Single Row ───────────────────────────────────────────────────────────────

function ExerciseRow({ name, index, sets, isCurrent, isDone, dayColor }) {
=======
import { exerciseTotalSets } from '../utils/exercise';

// ─── Single Row ───────────────────────────────────────────────────────────────

function ExerciseRow({ name, index, sets, hasWarmup, isCurrent, isDone, dayColor }) {
>>>>>>> 1f5a396 (s)
  return (
    <View
      style={[
        styles.row,
        isCurrent && { backgroundColor: dayColor + '14', borderColor: dayColor + '35' },
      ]}
    >
      {/* Number badge / checkmark */}
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
        <Text
          style={[
            styles.badgeText,
<<<<<<< HEAD
            isDone
              ? { color: '#fff' }
              : isCurrent
              ? { color: dayColor }
              : { color: colors.textTertiary },
=======
            isDone ? { color: '#fff' } : isCurrent ? { color: dayColor } : { color: colors.textTertiary },
>>>>>>> 1f5a396 (s)
          ]}
        >
          {isDone ? '✓' : index + 1}
        </Text>
      </View>

      {/* Exercise name */}
      <Text
        style={[
          styles.name,
          isDone ? styles.nameDone : isCurrent ? styles.nameCurrent : styles.nameUpcoming,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Set completion dots */}
      <View style={styles.dots}>
        {sets.map((done, s) => (
          <View
            key={s}
            style={[
              styles.dot,
<<<<<<< HEAD
=======
              // Warm-up dot is slightly smaller and diamond-ish via borderRadius
              s === 0 && hasWarmup && styles.dotWarmup,
>>>>>>> 1f5a396 (s)
              done
                ? { backgroundColor: dayColor }
                : isCurrent
                ? { backgroundColor: dayColor + '40' }
                : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function ExerciseList({ day, dayProgress, currentExIndex }) {
  return (
    <View style={styles.container}>
<<<<<<< HEAD
      {day.exercises.map((name, index) => {
        const sets = dayProgress.sets[index] ?? Array(SETS_PER_EXERCISE).fill(false);
        return (
          <ExerciseRow
            key={index}
            name={name}
            index={index}
            sets={sets}
            isCurrent={index === currentExIndex}
            isDone={sets.every(Boolean)}
=======
      {day.exercises.map((ex, index) => {
        const total = exerciseTotalSets(ex);
        const sets = (dayProgress.sets[index] ?? []).slice(0, total);
        // Pad with false if shorter (guards against brief normalization lag)
        const paddedSets = Array.from({ length: total }, (_, i) => sets[i] ?? false);

        return (
          <ExerciseRow
            key={index}
            name={ex.name}
            index={index}
            sets={paddedSets}
            hasWarmup={ex.warmup}
            isCurrent={index === currentExIndex}
            isDone={paddedSets.every(Boolean)}
>>>>>>> 1f5a396 (s)
            dayColor={day.color}
          />
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 2,
  },
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
  badge: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
<<<<<<< HEAD
    borderColor: colors.border,
=======
>>>>>>> 1f5a396 (s)
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeDefault: {
    borderColor: colors.borderSubtle,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  name: {
    flex: 1,
    fontSize: fontSize.footnote,
    fontFamily: fonts.mono,
    letterSpacing: 0.2,
  },
  nameDone: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  nameCurrent: {
    color: colors.text,
    fontWeight: '500',
  },
  nameUpcoming: {
    color: colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
<<<<<<< HEAD
=======
  // Warm-up dot: slightly smaller square-ish shape to visually distinguish
  dotWarmup: {
    width: 5,
    height: 5,
    borderRadius: 1,
    marginTop: 1,
  },
>>>>>>> 1f5a396 (s)
});
