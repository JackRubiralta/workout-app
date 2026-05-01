import React, { type ReactNode } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow, text } from '@/shared/theme';

export type ButtonVariant = 'filled' | 'outline';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  color?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  onPress,
  color,
  variant = 'filled',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isFilled = variant === 'filled';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
    >
      <View
        style={[
          styles.button,
          isFilled
            ? { backgroundColor: color ?? colors.text }
            : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
          disabled && { opacity: 0.45 },
          style,
        ]}
      >
        <Text style={[text.button as TextStyle, { color: isFilled ? '#fff' : colors.textSecondary }, textStyle]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export type IconButtonVariant = 'default' | 'danger';

export type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: IconButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  children,
  onPress,
  disabled,
  variant = 'default',
  style,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={8}
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
    >
      <View
        style={[
          styles.iconButton,
          variant === 'danger' && styles.iconButtonDanger,
          disabled && { opacity: 0.4 },
          style,
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    ...shadow.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDanger: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger + '70',
  },
});
