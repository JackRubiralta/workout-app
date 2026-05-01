import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius } from '@/shared/theme';

export type StepperProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (next: number) => void;
  accent?: string;
};

export function Stepper({
  value,
  min = 0,
  max = 999,
  step = 1,
  onChange,
  accent,
}: StepperProps) {
  const dec = () => {
    if (value <= min) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(Math.max(min, value - step));
  };
  const inc = () => {
    if (value >= max) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(Math.min(max, value + step));
  };
  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={[styles.btn, value <= min && styles.off]} onPress={dec} hitSlop={8}>
        <Text style={[styles.btnText, value <= min && styles.offText]}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.value, { color: accent ?? colors.text }]}>{value}</Text>
      <TouchableOpacity style={[styles.btn, value >= max && styles.off]} onPress={inc} hitSlop={8}>
        <Text style={[styles.btnText, value >= max && styles.offText]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  btn: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.3 },
  btnText: { fontSize: 20, color: colors.text, fontWeight: '300', lineHeight: 24 },
  offText: { color: colors.textTertiary },
  value: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.title3,
    fontWeight: '700',
    fontFamily: fonts.mono,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    height: 44,
    lineHeight: 44,
  },
});
