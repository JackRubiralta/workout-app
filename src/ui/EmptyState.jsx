import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, text } from '../../theme';

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  icon: { marginBottom: spacing.sm },
  title: { ...text.title3, color: colors.textSecondary, marginTop: spacing.sm },
  sub: { ...text.bodySecondary, color: colors.textTertiary, textAlign: 'center', lineHeight: 22 },
  action: { marginTop: spacing.md },
});
