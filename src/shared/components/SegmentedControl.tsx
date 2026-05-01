import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces } from '@/shared/theme';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  style,
}: SegmentedControlProps<T>) {
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
