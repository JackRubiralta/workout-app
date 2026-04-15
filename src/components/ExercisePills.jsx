import React, { useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '../constants/theme';
import { SETS_PER_EXERCISE } from '../constants/workout';

// ─── Single Pill ─────────────────────────────────────────────────────────────

function Pill({ name, isDone, isCurrent, setsCompleted, dayColor }) {
  const bgColor = isDone
    ? colors.successBg
    : isCurrent
    ? `${dayColor}22`
    : colors.surfaceElevated;

  const borderColor = isDone
    ? colors.success
    : isCurrent
    ? dayColor
    : colors.border;

  const nameColor = isDone
    ? colors.success
    : isCurrent
    ? colors.text
    : colors.textSecondary;

  return (
    <View style={[styles.pill, { backgroundColor: bgColor, borderColor }]}>
      {isDone ? (
        <Text style={[styles.pillIcon, { color: colors.success }]}>✓</Text>
      ) : isCurrent ? (
        <Text style={[styles.pillIcon, { color: dayColor }]}>●</Text>
      ) : null}
      <Text style={[styles.pillName, { color: nameColor }]} numberOfLines={1}>
        {name}
      </Text>
      {isCurrent && (
        <View style={[styles.pillBadge, { backgroundColor: dayColor + '44' }]}>
          <Text style={[styles.pillBadgeText, { color: dayColor }]}>
            {setsCompleted}/{SETS_PER_EXERCISE}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Pills List ──────────────────────────────────────────────────────────────

/**
 * Horizontal scrollable row of exercise pills.
 *
 * @param {object} day            - Day definition from DAYS
 * @param {object} dayProgress    - Progress object for this day
 * @param {number} currentExIndex - Index of the current (active) exercise, or -1
 */
export function ExercisePills({ day, dayProgress, currentExIndex }) {
  const scrollRef = useRef(null);
  const pillXRefs = useRef({});

  const onPillLayout = useCallback((index, event) => {
    pillXRefs.current[index] = event.nativeEvent.layout.x;
  }, []);

  // Auto-scroll to current pill when it changes
  const onScrollViewLayout = useCallback(() => {
    if (currentExIndex >= 0 && pillXRefs.current[currentExIndex] !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, pillXRefs.current[currentExIndex] - spacing.lg),
        animated: true,
      });
    }
  }, [currentExIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      onLayout={onScrollViewLayout}
      style={styles.scrollView}
    >
      {day.exercises.map((name, index) => {
        const exSets = dayProgress.sets[index] ?? [];
        const isDone = exSets.every(Boolean);
        const isCurrent = index === currentExIndex;
        const setsCompleted = exSets.filter(Boolean).length;

        return (
          <View
            key={index}
            onLayout={e => onPillLayout(index, e)}
          >
            <Pill
              name={name}
              isDone={isDone}
              isCurrent={isCurrent}
              setsCompleted={setsCompleted}
              dayColor={day.color}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Fixed height so it never pushes other layout elements
  scrollView: {
    height: 50,
    flexGrow: 0,
    flexShrink: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 5,
  },
  pillIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillName: {
    fontSize: fontSize.footnote,
    fontWeight: '500',
    maxWidth: 130,
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
