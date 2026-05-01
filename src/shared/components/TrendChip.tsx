import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/shared/theme';
import { ArrowUp, ArrowDown } from './icons';

export type TrendChipProps = {
  delta: number | null | undefined;
  suffix?: string;
  downColor?: string;
  flatThreshold?: number;
};

export function TrendChip({
  delta,
  suffix = '%',
  downColor = colors.danger,
  flatThreshold = 3,
}: TrendChipProps) {
  if (delta == null) return null;
  const flat = Math.abs(delta) < flatThreshold;
  const up = delta > 0;
  const accent = flat ? colors.textSecondary : up ? colors.success : downColor;
  const bg = flat ? colors.surfaceElevated : accent + '22';
  const border = flat ? colors.border : accent + '50';
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      {!flat && (up ? <ArrowUp color={accent} /> : <ArrowDown color={accent} />)}
      <Text style={[styles.text, { color: accent }]}>
        {up && !flat ? '+' : ''}
        {delta}
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: 0.4 },
});
