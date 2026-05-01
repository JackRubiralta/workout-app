import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, radius, text } from '../theme';

/**
 * Shared structural backbone for the numbered exercise rows in
 * `ExerciseList` (compact, in-active-session) and `DayPreStartScreen`
 * (editable card form). Renders:
 *
 *     [badge] [ name (and optional meta line) ]  [optional trailing slot]
 *
 * Outer chrome (surface vs transparent, padding, border) is the caller's
 * responsibility — pass it through `style`. The primitive owns the
 * structural composition + the numbered/checkmark/colored badge variants.
 *
 * @param {object} props
 * @param {number} props.number - 1-based row index (rendered in the badge for the default variant).
 * @param {string} props.name - Primary line.
 * @param {string} [props.meta] - Optional secondary line under the name.
 * @param {string} props.accent - Day / theme color used to tint the badge.
 * @param {'outline'|'filled'|'muted'} [props.badge='outline'] - Badge style.
 *   `outline` = ring with accent text; `filled` = solid accent + ✓; `muted` = neutral border + tertiary text.
 * @param {'default'|'done'|'current'} [props.nameStyle='default'] - Name styling.
 *   `done` = strikethrough; `current` = bumped weight.
 * @param {React.ReactNode} [props.trailing] - Slot at the end of the row (progress dots, pencil icon).
 * @param {() => void} [props.onPress] - Tap handler. If omitted the row is a non-interactive `View`.
 * @param {boolean} [props.highlight=false] - When true, draws a subtle accent-tinted background + border (used for the "current exercise" state in ExerciseList).
 * @param {boolean} [props.compact=false] - When true, smaller badge (22px) and smaller name font — the in-active-session list density. Default is the editable card density.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style] - Outer chrome (surface mixin, padding, etc.).
 */
export function NumberedListRow({
  number,
  name,
  meta,
  accent,
  badge = 'outline',
  nameStyle = 'default',
  trailing,
  onPress,
  highlight = false,
  compact = false,
  style,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.75 } : {};
  return (
    <Wrapper
      style={[
        styles.row,
        highlight && { backgroundColor: accent + '14', borderColor: accent + '35' },
        style,
      ]}
      {...wrapperProps}
    >
      <NumberedBadge number={number} accent={accent} variant={badge} size={compact ? 'sm' : 'md'} />
      <View style={styles.body}>
        <Text
          style={[
            compact ? styles.nameCompact : styles.name,
            nameStyle === 'done' && styles.nameDone,
            nameStyle === 'current' && styles.nameCurrent,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {trailing}
    </Wrapper>
  );
}

// Numbered/check badge with three visual modes. Pulled out so callers can
// reuse it standalone (e.g. inside an exercise hero) without dragging in
// the row layout.
export function NumberedBadge({ number, accent, variant = 'outline', size = 'md' }) {
  const dims = size === 'sm' ? styles.badgeSm : styles.badgeMd;
  if (variant === 'filled') {
    return (
      <View style={[dims, styles.badgeBase, { backgroundColor: accent, borderColor: accent }]}>
        <Text style={[styles.badgeText, { color: '#fff' }]}>✓</Text>
      </View>
    );
  }
  if (variant === 'muted') {
    return (
      <View style={[dims, styles.badgeBase, { borderColor: colors.hairline }]}>
        <Text style={[styles.badgeText, { color: colors.textTertiary }]}>{number}</Text>
      </View>
    );
  }
  // outline (default)
  return (
    <View style={[dims, styles.badgeBase, { borderColor: accent }]}>
      <Text style={[styles.badgeText, { color: accent }]}>{number}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  body: { flex: 1, gap: 1 },
  name: { ...text.title3, fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.2 },
  nameCompact: { fontSize: fontSize.footnote, fontFamily: fonts.mono, letterSpacing: 0.2, color: colors.textSecondary },
  nameDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  nameCurrent: { color: colors.text, fontWeight: '500' },
  meta: { ...text.bodySecondary, fontSize: 12, color: colors.textSecondary },

  badgeBase: {
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeSm: { width: 22, height: 22 },
  badgeMd: { width: 28, height: 28 },
  badgeText: { fontSize: fontSize.caption, fontWeight: '700', fontFamily: fonts.mono },
});
