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
import { colors, fonts, fontSize, radius, text } from '@/shared/theme';

export type NumberedBadgeVariant = 'outline' | 'filled' | 'muted';
export type NumberedNameStyle = 'default' | 'done' | 'current';

export type NumberedListRowProps = {
  number: number;
  name: string;
  meta?: string;
  accent: string;
  badge?: NumberedBadgeVariant;
  nameStyle?: NumberedNameStyle;
  trailing?: ReactNode;
  onPress?: () => void;
  highlight?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

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
}: NumberedListRowProps) {
  const inner = (
    <>
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
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );

  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    highlight && { backgroundColor: accent + '14', borderColor: accent + '35' },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={rowStyle} activeOpacity={0.75} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={rowStyle}>{inner}</View>;
}

export type NumberedBadgeSize = 'sm' | 'md';

export type NumberedBadgeProps = {
  number: number;
  accent: string;
  variant?: NumberedBadgeVariant;
  size?: NumberedBadgeSize;
};

export function NumberedBadge({
  number,
  accent,
  variant = 'outline',
  size = 'md',
}: NumberedBadgeProps) {
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
  name: {
    ...(text.title3 as TextStyle),
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.2,
  },
  nameCompact: {
    fontSize: fontSize.footnote,
    fontFamily: fonts.mono,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  nameDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  nameCurrent: { color: colors.text, fontWeight: '500' },
  meta: { ...(text.bodySecondary as TextStyle), fontSize: 12, color: colors.textSecondary },

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
