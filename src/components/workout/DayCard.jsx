import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, shadow, spacing, text } from '../../theme';

function ChevronRight({ color, size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircle({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DayCard({ day, doneSets, totalSets, exerciseCount, isDone, isInProgress, onPress }) {
  const accent = isDone ? colors.success : day.color;
  const pct = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <TouchableOpacity
      style={[styles.card, isInProgress && { borderColor: day.color, ...shadow.glow(day.color, 0.4) }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      activeOpacity={0.85}
    >
      <View style={[styles.tint, { backgroundColor: accent + '12' }]} pointerEvents="none" />

      <View style={[styles.numBubble, { backgroundColor: accent, ...shadow.glow(accent, 0.55) }]}>
        <Text style={styles.numText}>{day.day}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {day.title}
        </Text>
        {day.focus ? (
          <Text style={styles.focus} numberOfLines={1}>{day.focus}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{exerciseCount} ex</Text>
          <View style={styles.metaDot} />
          <Text style={styles.meta}>{totalSets} sets</Text>
          {isInProgress && (
            <>
              <View style={styles.metaDot} />
              <Text style={[styles.meta, { color: day.color }]}>{doneSets}/{totalSets} done</Text>
            </>
          )}
        </View>
        {isInProgress && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: day.color }]} />
          </View>
        )}
      </View>

      <View style={styles.right}>
        {isDone ? (
          <CheckCircle color={colors.success} />
        ) : (
          <ChevronRight color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 84,
    overflow: 'hidden',
    ...shadow.sm,
  },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  numBubble: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 18, fontWeight: '800', color: '#fff', fontFamily: 'System' },
  body: { flex: 1, gap: 3 },
  title: { ...text.title2, fontSize: 19 },
  focus: { ...text.bodySecondary, fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { ...text.monoCaption, fontWeight: '600' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  track: { height: 3, backgroundColor: colors.border, borderRadius: radius.full, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  right: { paddingHorizontal: 4 },
});
