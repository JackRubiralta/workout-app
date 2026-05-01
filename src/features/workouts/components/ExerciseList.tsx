import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/shared/theme';
import { NumberedListRow } from '@/shared/components';
import { exerciseTotalSets } from '../constants/exerciseDefaults';
import { isSetDone } from '../utils/progressUtils';
import type { DayTemplate, WorkoutSession } from '../types/workoutTypes';

function rowState({ isDone, isCurrent }: { isDone: boolean; isCurrent: boolean }) {
  if (isDone) return 'done' as const;
  if (isCurrent) return 'current' as const;
  return 'default' as const;
}

type ProgressDotsProps = {
  sets: boolean[];
  total: number;
  hasWarmup: boolean;
  dayColor: string;
  isCurrent: boolean;
};

function ProgressDots({ sets, total, hasWarmup, dayColor, isCurrent }: ProgressDotsProps) {
  return (
    <View style={s.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === 0 && hasWarmup && s.dotWarmup,
            sets[i]
              ? { backgroundColor: dayColor }
              : isCurrent
                ? { backgroundColor: dayColor + '40' }
                : null,
          ]}
        />
      ))}
    </View>
  );
}

export type ExerciseListProps = {
  day: DayTemplate;
  session: WorkoutSession | null;
  currentExIndex: number;
  onPressExercise?: (index: number) => void;
};

export function ExerciseList({ day, session, currentExIndex, onPressExercise }: ExerciseListProps) {
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
