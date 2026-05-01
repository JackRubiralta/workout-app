import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '../theme';

/**
 * Small rounded pill — `[icon?] [label]` — used wherever the app needs a
 * lightweight tap-target that isn't a primary button. Centralised so the
 * five places that previously rolled their own (BodyWeightCard "Log",
 * DayPreStartScreen "Edit day", TrackingScreen "Show more",
 * SessionStage "Skip this exercise", ExerciseHero AVG hint) stay in
 * lockstep.
 *
 * Variants:
 *   • default — quiet surface chrome, secondary text. Tappable.
 *   • strong  — primary text colour, slight emphasis. Tappable.
 *   • static  — same chrome but renders as a non-interactive `View`. For
 *               the eyebrow+value information chips that aren't actions.
 *
 * @param {object} props
 * @param {string} props.label - Pill text. For `static` chips with an eyebrow, pass the value here and the eyebrow via `eyebrow`.
 * @param {string} [props.eyebrow] - Small uppercase prefix shown before the label (only rendered for `static` variant).
 * @param {React.ReactNode} [props.icon] - Optional leading icon.
 * @param {() => void} [props.onPress] - Tap handler. Required for the tappable variants; ignored for `static`.
 * @param {'default'|'strong'|'static'} [props.variant='default']
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style] - Style override on the outer pill.
 *
 * @example
 *   <Chip label="Log" icon={<PlusIcon />} onPress={onLog} variant="strong" />
 *   <Chip label="Show 12 older sessions" onPress={onToggle} />
 *   <Chip eyebrow="AVG · LAST 5" label="80 lb × 8" variant="static" />
 */
export function Chip({ label, eyebrow, icon, onPress, variant = 'default', style }) {
  const isStatic = variant === 'static';
  const isStrong = variant === 'strong';
  const Wrapper = isStatic ? View : TouchableOpacity;
  const wrapperProps = isStatic
    ? {}
    : {
        activeOpacity: 0.7,
        hitSlop: 8,
        onPress: () => {
          Haptics.selectionAsync().catch(() => {});
          onPress?.();
        },
      };
  return (
    <Wrapper style={[styles.chip, style]} {...wrapperProps}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.label, isStrong && styles.labelStrong]} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
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
  eyebrow: { ...text.eyebrowSmall, color: colors.textTertiary, letterSpacing: 1.4 },
  label: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    letterSpacing: 0.2,
  },
  labelStrong: { color: colors.text, fontWeight: '700' },
});
