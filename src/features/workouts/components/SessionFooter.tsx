import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '@/shared/theme';
import { Button, type ButtonVariant } from '@/shared/components';

export type SessionPrimaryAction = {
  label: string;
  onPress: () => void;
  variant: ButtonVariant;
};

export type SessionFooterProps = {
  doneSets: number;
  totalSets: number;
  dayColor: string;
  primary: SessionPrimaryAction;
};

export function SessionFooter({ doneSets, totalSets, dayColor, primary }: SessionFooterProps) {
  const pct = totalSets > 0 ? (doneSets / totalSets) * 100 : 0;
  return (
    <View style={s.wrap}>
      <View style={s.progressRow}>
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct}%`, backgroundColor: dayColor }]} />
        </View>
        <Text style={s.count}>
          {doneSets}/{totalSets}
        </Text>
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
  count: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
    fontFamily: fonts.mono,
  },
});
