import React from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { colors, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';

export type WorkoutAssistantTriggerProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

// Card-style row that opens the workout assistant sheet. Sits in the
// settings stack on the workout list, immediately above the unit-system
// segmented control. Visually it's a slightly elevated surface with a
// sparkle glyph so it reads as "AI / try me" without shouting.
export function WorkoutAssistantTrigger({ onPress, style }: WorkoutAssistantTriggerProps) {
  return (
    <TouchableOpacity
      style={[s.wrap, style]}
      activeOpacity={0.85}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
    >
      <View style={s.iconWrap}>
        <SparkleIcon />
      </View>
      <View style={s.body}>
        <Text style={s.title}>Ask your coach</Text>
        <Text style={s.sub} numberOfLines={2}>
          Tweak a day, plan a deload, or rebuild your program. Claude has your history.
        </Text>
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function SparkleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"
        stroke={colors.text}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z"
        stroke={colors.text}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...surfaces.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: {
    ...(text.callout as TextStyle),
    fontWeight: '700',
    color: colors.text,
  },
  sub: {
    ...(text.bodySecondary as TextStyle),
    color: colors.textSecondary,
    fontSize: fontSize.footnote,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 22,
    color: colors.textTertiary,
    paddingHorizontal: spacing.xs,
  },
});
