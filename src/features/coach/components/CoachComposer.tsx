// Bottom-anchored input row plus inline error text. Multiline auto-grow
// is capped so the composer can never push the transcript off-screen.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, text } from '@/shared/theme';
import { ArrowUp } from '@/shared/components/icons';

const MAX_INPUT_HEIGHT = 120;
const MIN_INPUT_HEIGHT = 40;

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
  placeholder = 'Ask anything about your training or nutrition…',
}: CoachComposerProps) {
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);

  const handleContentSize = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = Math.min(
        MAX_INPUT_HEIGHT,
        Math.max(MIN_INPUT_HEIGHT, Math.round(e.nativeEvent.contentSize.height)),
      );
      setInputHeight(h);
    },
    [],
  );

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isThinking;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInputHeight(MIN_INPUT_HEIGHT);
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
          style={[s.input, { height: inputHeight }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          onContentSizeChange={handleContentSize}
          editable={!isThinking}
          selectionColor={colors.success}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          activeOpacity={0.85}
          hitSlop={6}
        >
          <ArrowUp color={canSend ? '#000' : colors.textTertiary} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: fontSize.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.sans,
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceHigh },
});
