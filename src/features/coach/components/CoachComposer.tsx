// Bottom-anchored input row plus inline error text. Multiline auto-grow
// is capped so the composer can never push the transcript off-screen.
//
// Metric arithmetic, kept here because the composer breaks the moment any
// of these values drift apart:
//
//   INPUT_VPAD * 2 + INPUT_LINE_HEIGHT === BAR_HEIGHT === MIN_INPUT_HEIGHT
//
// That equality is what makes the empty-state caret + placeholder land on
// the same baseline as a single line of typed text. Bumping the line height
// or padding without re-balancing the others reintroduces the misalignment
// we used to ship with.

import React, { useCallback, useState } from 'react';
import {
  LayoutAnimation,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputContentSizeChangeEvent,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, text } from '@/shared/theme';
import { ArrowUp } from '@/shared/components/icons';

const INPUT_VPAD = 8;
const INPUT_LINE_HEIGHT = 22;
const BAR_HEIGHT = INPUT_VPAD * 2 + INPUT_LINE_HEIGHT; // 38

const MIN_INPUT_HEIGHT = BAR_HEIGHT;
const MAX_INPUT_HEIGHT = MIN_INPUT_HEIGHT + INPUT_LINE_HEIGHT * 4; // ~5 visible lines

// iOS occasionally measures the empty content box 1–2pt above the floor.
// Treat anything within this window as "still single-line" so we don't
// flip into explicit-height mode and break placeholder centering.
const SINGLE_LINE_TOLERANCE = 4;

// Short, eased transition for input growth. Matches the iOS keyboard
// curve closely enough that wrapping a second line in mid-type doesn't
// feel like a separate animation from the keyboard rise.
const GROW_ANIMATION = {
  duration: 180,
  update: { type: LayoutAnimation.Types.easeInEaseOut },
} as const;

export type CoachComposerProps = {
  value: string;
  onChangeText: (next: string) => void;
  onSend: () => void;
  isThinking: boolean;
  errorText?: string | null;
  placeholder?: string;
};

export function CoachComposer({
  value,
  onChangeText,
  onSend,
  isThinking,
  errorText,
  placeholder = 'Ask anything',
}: CoachComposerProps) {
  // null = use the stylesheet's minHeight. We only force an explicit height
  // once the user's text has grown past one line. Setting `height` while the
  // input is empty makes iOS multiline TextInput pin the caret to the top of
  // the box while the placeholder sits centered, creating the misaligned look.
  const [inputHeight, setInputHeight] = useState<number | null>(null);

  const handleContentSize = useCallback(
    (e: TextInputContentSizeChangeEvent) => {
      const measured = Math.round(e.nativeEvent.contentSize.height);
      const next =
        measured <= MIN_INPUT_HEIGHT + SINGLE_LINE_TOLERANCE
          ? null
          : Math.min(MAX_INPUT_HEIGHT, measured);
      setInputHeight(prev => {
        if (prev === next) return prev;
        // Ease the height change so wrapping into a second line — and
        // collapsing back after send — reads as one continuous motion
        // alongside the rest of the layout instead of a hard step.
        LayoutAnimation.configureNext(GROW_ANIMATION);
        return next;
      });
    },
    [],
  );

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isThinking;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInputHeight(prev => {
      if (prev === null) return prev;
      LayoutAnimation.configureNext(GROW_ANIMATION);
      return null;
    });
    onSend();
  }, [canSend, onSend]);

  return (
    <View style={s.wrap}>
      {errorText ? (
        <Text style={s.errorText} numberOfLines={2}>
          {errorText}
        </Text>
      ) : null}
      <View style={s.row}>
        <TextInput
          style={[s.input, inputHeight != null && { height: inputHeight }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          onContentSizeChange={handleContentSize}
          selectionColor={colors.success}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          activeOpacity={0.85}
          hitSlop={6}
        >
          <ArrowUp color={canSend ? '#000' : colors.textTertiary} size={14} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  errorText: {
    ...(text.monoCaption as TextStyle),
    color: colors.danger,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: INPUT_VPAD,
    fontSize: fontSize.body,
    lineHeight: INPUT_LINE_HEIGHT,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.sans,
    minHeight: MIN_INPUT_HEIGHT,
  },
  sendBtn: {
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceHigh },
});
