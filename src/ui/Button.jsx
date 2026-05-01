import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow, text } from '../theme';

/**
 * Primary single-tap button used for the main action on a screen
 * (Start Workout, Save Goals, Log Food). Light haptic on press.
 *
 * @param {object} props
 * @param {string} props.label - Button text.
 * @param {() => void} props.onPress - Tap handler.
 * @param {string} [props.color] - Accent colour for the filled background (defaults to `colors.text`). Day color or macro color.
 * @param {'filled'|'outline'} [props.variant='filled'] - Visual style.
 * @param {boolean} [props.disabled=false] - Greyed out + non-interactive.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style] - Style override on the outer view.
 * @param {import('react-native').StyleProp<import('react-native').TextStyle>} [props.textStyle] - Style override on the label text.
 */
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

/**
 * Small round icon button (36×36) — back, undo, delete, etc.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The icon SVG (DON'T pass color — the caller usually picks the colour to match `variant`).
 * @param {() => void} props.onPress - Tap handler.
 * @param {boolean} [props.disabled] - Greyed out + non-interactive.
 * @param {'default'|'danger'} [props.variant='default'] - 'default' = transparent surface + neutral border; 'danger' = red-tinted background + border (delete, abandon, remove).
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style] - Style override on the outer view.
 */
export function IconButton({ children, onPress, disabled, variant = 'default', style }) {
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
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconButtonDanger: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger + '70',
  },
});
