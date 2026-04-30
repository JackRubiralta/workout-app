import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow, text } from '../../theme';

// Single-tap primary button. No hold-to-confirm.
// `variant`: 'filled' (color background) | 'outline' (transparent)
//
// Color is the day color or accent. On press: light haptic + onPress.

export function Button({ label, onPress, color, variant = 'filled', disabled = false, style, textStyle }) {
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
        <Text style={[text.button, { color: isFilled ? '#fff' : colors.textSecondary }, textStyle]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Small round icon button (used in the active session header for back / undo).
export function IconButton({ children, onPress, disabled, style }) {
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
      <View style={[styles.iconButton, disabled && { opacity: 0.4 }, style]}>
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
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
