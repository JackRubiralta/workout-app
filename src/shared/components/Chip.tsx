import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';

export type ChipVariant = 'default' | 'strong' | 'static';

export type ChipProps = {
  label: string;
  eyebrow?: string;
  icon?: ReactNode;
  onPress?: () => void;
  variant?: ChipVariant;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, eyebrow, icon, onPress, variant = 'default', style }: ChipProps) {
  const isStatic = variant === 'static';
  const isStrong = variant === 'strong';
  if (isStatic) {
    return (
      <View style={[styles.chip, style]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={[styles.label, isStrong && styles.labelStrong]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={[styles.chip, style]}
      activeOpacity={0.7}
      hitSlop={8}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.label, isStrong && styles.labelStrong]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    ...surfaces.row,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  icon: { marginLeft: -2 },
  eyebrow: { ...(text.eyebrowSmall as TextStyle), color: colors.textTertiary, letterSpacing: 1.4 },
  label: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    letterSpacing: 0.2,
  },
  labelStrong: { color: colors.text, fontWeight: '700' },
});
