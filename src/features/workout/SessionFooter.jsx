import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, text } from '../../theme';
import { Button } from '../../components/primitives';

/**
 * Bottom of the active session screen — progress bar + count, primary CTA
 * (label/handler/variant chosen by the parent based on state), and an
 * optional secondary "Skip this exercise" link.
 *
 * @param {object} props
 * @param {number} props.doneSets
 * @param {number} props.totalSets
 * @param {string} props.dayColor - Used for both the progress fill and the primary button accent.
 * @param {{ label: string, onPress: () => void, variant: 'filled'|'outline' }} props.primary
 * @param {boolean} props.canSkipExercise
 * @param {() => void} props.onSkipExercise
 */
export function SessionFooter({ doneSets, totalSets, dayColor, primary, canSkipExercise, onSkipExercise }) {
  const pct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;
  return (
    <View style={s.wrap}>
      <View style={s.progressRow}>
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct}%`, backgroundColor: dayColor }]} />
        </View>
        <Text style={s.count}>{doneSets}/{totalSets}</Text>
      </View>

      <Button label={primary.label} onPress={primary.onPress} color={dayColor} variant={primary.variant} />

      {canSkipExercise && (
        <TouchableOpacity onPress={onSkipExercise} style={s.skipBtn} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip this exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  track: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  count: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, width: 40, textAlign: 'right', fontFamily: fonts.mono },

  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 8, paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  skipText: { ...text.buttonSmall, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
});
