import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors, spacing, surfaces, text } from '../theme';

/**
 * Card-style empty state — shown inside a content scroll when a section
 * has no data yet. Carries optional icon + title + subtitle + action slot.
 *
 * For a full-page empty state (e.g., a search returns nothing), wrap this
 * in a `<View style={{ flex: 1, justifyContent: 'center' }}>` — the
 * primitive itself does not stretch, so it composes cleanly inside both
 * scrollable card lists and centered viewports.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Optional icon to render above the title.
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.action] - Slot for a CTA chip / button below the subtitle.
 */
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <View style={s.card}>
      {icon ? <View style={s.icon}>{icon}</View> : null}
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      {action ? <View style={s.action}>{action}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    ...surfaces.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: { marginBottom: spacing.xs },
  title: { ...text.title3, color: colors.text, textAlign: 'center' },
  sub: { ...text.bodySecondary, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, fontSize: 14 },
  action: { marginTop: spacing.md },
});
