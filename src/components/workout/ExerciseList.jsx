import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { NumberedListRow } from '../primitives';
import { exerciseTotalSets } from '../../utils/exercise';
import { isSetDone } from '../../features/workout/logic/progress';

// Compact ordered list of exercises shown above the active session stage.
// Each row reflects per-exercise progress (current → done → upcoming) and
// renders the per-set status as colored dots on the trailing edge.
//
// The structural composition (badge + name + trailing) is delegated to the
// shared <NumberedListRow>; this file owns the active-session chrome
// (transparent border, tight padding, tap-to-open-history affordance) plus
// the per-set dot visualization.

function rowState({ isDone, isCurrent }) {
  if (isDone) return 'done';
  if (isCurrent) return 'current';
  return 'default';
}

function ProgressDots({ sets, total, hasWarmup, dayColor, isCurrent }) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === 0 && hasWarmup && s.dotWarmup,
            sets[i] ? { backgroundColor: dayColor } : isCurrent ? { backgroundColor: dayColor + '40' } : null,
          ]}
        />
      ))}
    </View>
  );
}

export function ExerciseList({ day, session, currentExIndex, onPressExercise }) {
  return (
    <View style={s.container}>
      {day.exercises.map((ex, index) => {
        const total = exerciseTotalSets(ex);
        const sets = Array.from({ length: total }, (_, si) => isSetDone(session, index, si));
        const isDone = sets.every(Boolean);
        const isCurrent = index === currentExIndex;
        return (
          <NumberedListRow
            key={index}
            number={index + 1}
            name={ex.name}
            accent={day.color}
            badge={isDone ? 'filled' : isCurrent ? 'outline' : 'muted'}
            nameStyle={rowState({ isDone, isCurrent })}
            highlight={isCurrent}
            compact
            style={s.row}
            trailing={
              <ProgressDots
                sets={sets}
                total={total}
                hasWarmup={ex.warmup}
                dayColor={day.color}
                isCurrent={isCurrent}
              />
            }
            onPress={onPressExercise ? () => onPressExercise(index) : undefined}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: 2 },
  row: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.md },
  dots: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  dot: { width: 7, height: 7, borderRadius: radius.full, backgroundColor: colors.border },
  dotWarmup: { width: 5, height: 5, borderRadius: 1, marginTop: 1 },
});
