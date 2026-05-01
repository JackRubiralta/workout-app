import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces } from '../theme';

/**
 * iOS-style segmented control. Pass an array of `{ value, label }` and
 * the currently-selected `value`. Selecting a different segment fires
 * `onChange(value)` with a light haptic.
 *
 * Visually the selected segment lifts up to `colors.surfaceHigh` while
 * the rest stay flush with the underlying surface — same active treatment
 * as the AddFood TabSwitcher used to use, lifted into a primitive so any
 * future segmented control (rep range, period selector, etc.) gets it
 * for free.
 *
 * @template T
 * @param {object} props
 * @param {T} props.value - Currently-selected value.
 * @param {Array<{ value: T, label: string }>} props.options
 * @param {(next: T) => void} props.onChange
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style]
 */
export function SegmentedControl({ value, options, onChange, style }) {
  return (
    <View style={[styles.outer, style]}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.seg, active && styles.segActive]}
            onPress={() => {
              if (active) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(opt.value);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    ...surfaces.inset,
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.lg,
  },
  seg: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  segActive: { backgroundColor: colors.surfaceHigh },
  label: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    letterSpacing: 0.3,
  },
  labelActive: { color: colors.text, fontWeight: '700' },
});
