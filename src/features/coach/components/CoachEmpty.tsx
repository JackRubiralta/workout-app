// Pre-conversation panel: greets the user by name, lists what the coach
// can do, and offers a starter set of suggestion chips. The suggestions
// are bucketed by domain so they read like a real menu rather than an
// undifferentiated wall.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, surfaces, text } from '@/shared/theme';

const SUGGESTIONS = [
  { eyebrow: 'PROGRAM', text: 'Make my legs day a bit harder' },
  { eyebrow: 'PROGRAM', text: 'Wipe everything and give me a 4-day upper/lower split' },
  { eyebrow: 'NUTRITION', text: 'Tighten my macros for a recomp' },
  { eyebrow: 'CHECK-IN', text: 'How is my chest volume looking lately?' },
  { eyebrow: 'CHECK-IN', text: 'Should I deload this week?' },
] as const;

export type CoachEmptyProps = {
  name: string | null;
  onPickSuggestion: (text: string) => void;
};

export function CoachEmpty({ name, onPickSuggestion }: CoachEmptyProps) {
  const greeting = name ? `Hey ${name.split(/\s+/)[0]}` : 'Hey there';
  return (
    <View style={s.wrap}>
      <Text style={s.title}>{greeting}.</Text>
      <Text style={s.sub}>
        I can see your program, recent sessions, body weight, and nutrition. Ask anything,
        request tweaks, or have me rebuild your plan from scratch.
      </Text>
      <View style={s.list}>
        {SUGGESTIONS.map(({ eyebrow, text: copy }) => (
          <TouchableOpacity
            key={copy}
            style={s.row}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onPickSuggestion(copy);
            }}
          >
            <Text style={s.rowEyebrow}>{eyebrow}</Text>
            <Text style={s.rowText}>{copy}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, paddingTop: spacing.lg, gap: spacing.md },
  title: { ...(text.title1 as TextStyle), textAlign: 'left' },
  sub: {
    ...(text.bodySecondary as TextStyle),
    color: colors.textSecondary,
    lineHeight: 22,
  },
  list: { gap: spacing.sm, marginTop: spacing.md },
  row: {
    ...surfaces.row,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  rowEyebrow: {
    ...(text.eyebrowSmall as TextStyle),
    color: colors.textTertiary,
    letterSpacing: 1.6,
  },
  rowText: {
    ...(text.callout as TextStyle),
    color: colors.text,
  },
});
