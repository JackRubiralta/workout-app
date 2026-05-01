import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { ArrowUp, ArrowDown } from './icons';

/**
 * Up/down/flat trend pill. Pass a numeric `delta` and the chip picks
 * the right arrow + colour. Returns null when delta is null/undefined
 * so callers can render unconditionally.
 *
 * Anything within `flatThreshold` of zero renders as a flat "0%" tag
 * without an arrow.
 *
 * @param {object} props
 * @param {number|null|undefined} props.delta - Signed delta. null/undefined → renders nothing.
 * @param {string} [props.suffix='%'] - Unit suffix appended to the value (e.g. '%', 'g', 'lb').
 * @param {string} [props.downColor] - Negative-direction accent. Use `colors.danger` for bad-when-down (volume), `colors.warning` for neutral-when-down (macros). Defaults to danger.
 * @param {number} [props.flatThreshold=3] - Absolute delta below which the chip renders flat (no arrow).
 *
 * @example
 *   <TrendChip delta={+12} downColor={colors.danger} />              // "+12%" green-up
 *   <TrendChip delta={-8}  downColor={colors.warning} suffix="g" /> // "-8g" amber-down
 */
export function TrendChip({ delta, suffix = '%', downColor = colors.danger, flatThreshold = 3 }) {
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
        {up && !flat ? '+' : ''}{delta}{suffix}
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
