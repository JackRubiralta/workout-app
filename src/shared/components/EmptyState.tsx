import React, { type ReactNode } from 'react';
import { View, StyleSheet, Text, type TextStyle } from 'react-native';
import { colors, spacing, surfaces, text } from '@/shared/theme';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...surfaces.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: { marginBottom: spacing.xs },
  title: { ...(text.title3 as TextStyle), color: colors.text, textAlign: 'center' },
  sub: {
    ...(text.bodySecondary as TextStyle),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
  },
  action: { marginTop: spacing.md },
});
