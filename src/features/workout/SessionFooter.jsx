import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../../theme';
import { Button } from '../../components/primitives';

/**
 * Bottom of the active session screen — progress bar + count, primary CTA
 * (label/handler/variant chosen by the parent based on state).
 *
 * The "Skip this exercise" secondary action lives inside `<SessionStage>`
 * (under the exercise hero), not down here, so the user's eye doesn't
 * have to bounce between the hero and the bottom of the screen to make
 * the call.
 *
 * @param {object} props
 * @param {number} props.doneSets
 * @param {number} props.totalSets
 * @param {string} props.dayColor - Used for both the progress fill and the primary button accent.
 * @param {{ label: string, onPress: () => void, variant: 'filled'|'outline' }} props.primary
 */
export function SessionFooter({ doneSets, totalSets, dayColor, primary }) {
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
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  track: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  count: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, width: 40, textAlign: 'right', fontFamily: fonts.mono },
});
