// Bottom-anchored input row plus inline error text. Multiline auto-grow
// is capped so the composer can never push the transcript off-screen.
//
// Metric arithmetic, kept here because the composer breaks the moment any
// of these values drift apart:
//
//   INPUT_VPAD * 2 + INPUT_LINE_HEIGHT === INPUT_HEIGHT === MIN_INPUT_HEIGHT
//
// That equality is what makes the empty-state caret + placeholder land on
// the same baseline as a single line of typed text. Bumping the line height
// or padding without re-balancing the others reintroduces the misalignment
// we used to ship with.
//
// The send button uses BUTTON_SIZE (44) — independent of INPUT_HEIGHT — to
// meet the iOS hit-target guideline. The row uses `alignItems: 'flex-end'`
// so the larger button stays bottom-aligned with the single-line input.

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
const INPUT_HEIGHT = INPUT_VPAD * 2 + INPUT_LINE_HEIGHT; // 38

const MIN_INPUT_HEIGHT = INPUT_HEIGHT;
const MAX_INPUT_HEIGHT = MIN_INPUT_HEIGHT + INPUT_LINE_HEIGHT * 4; // ~5 visible lines

// Native iOS hit-target floor. Decoupled from INPUT_HEIGHT so the input row
// stays compact while the tap surface remains comfortable.
const BUTTON_SIZE = 44;

// Pill-input horizontal padding. Kept explicit (not derived from `spacing`)
// because the visual "the caret starts where the placeholder starts" rhythm
// depends on this exact value — see the metric arithmetic note above.
const INPUT_HPAD = 14;

const WRAP_VPAD = spacing.sm; // 8 — top + bottom breathing room around the row.

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
  /** Called when the user taps the trailing button while a request is in
   *  flight. The button silently no-ops if `onCancel` isn't provided. */
  onCancel?: () => void;
  isThinking: boolean;
  errorText?: string | null;
  placeholder?: string;
};

export function CoachComposer({
  value,
  onChangeText,
  onSend,
  onCancel,
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
  const showCancel = isThinking && onCancel != null;

  const handlePressTrailing = useCallback(() => {
    if (showCancel) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onCancel?.();
      return;
    }
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInputHeight(prev => {
      if (prev === null) return prev;
      LayoutAnimation.configureNext(GROW_ANIMATION);
      return null;
    });
    onSend();
  }, [canSend, onSend, onCancel, showCancel]);

  const trailingDisabled = !showCancel && !canSend;
  const trailingA11yLabel = showCancel ? 'Stop generating' : 'Send message';

  return (
    <View style={s.wrap}>
      {errorText ? (
        <View style={s.errorRow}>
          <View style={s.errorDot} />
          <Text style={s.errorText} numberOfLines={3}>
            {errorText}
          </Text>
        </View>
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
          accessibilityLabel="Message"
        />
        <TouchableOpacity
          onPress={handlePressTrailing}
          disabled={trailingDisabled}
          style={[s.sendBtn, trailingDisabled && s.sendBtnDisabled]}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={trailingA11yLabel}
          accessibilityState={{ disabled: trailingDisabled }}
        >
          {showCancel ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <ArrowUp color={canSend ? '#000' : colors.textTertiary} size={14} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: WRAP_VPAD,
    paddingBottom: WRAP_VPAD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: WRAP_VPAD,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    // Centre the dot on the first line of error copy.
    marginTop: 7,
  },
  errorText: {
    ...(text.bodyTertiary as TextStyle),
    color: colors.danger,
    flex: 1,
    lineHeight: 18,
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
    paddingHorizontal: INPUT_HPAD,
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
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceHigh },
});
