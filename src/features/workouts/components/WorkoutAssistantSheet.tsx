import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';
import { Sheet, SheetHeader, PulseDots } from '@/shared/components';
import { ArrowUp } from '@/shared/components/icons';
import { useWorkoutAssistant } from '../hooks/useWorkoutAssistant';
import { WorkoutProposalCard } from './WorkoutProposalCard';
import type { AssistantMessage } from '../types/assistantTypes';

const SUGGESTIONS = [
  'How is my chest volume looking lately?',
  'Make my legs day a bit harder',
  'Replace my push day with a 4-exercise version',
  'Wipe everything and give me a 4-day upper/lower split',
  'Should I deload this week?',
] as const;

const MAX_INPUT_HEIGHT = 120;

export type WorkoutAssistantSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function WorkoutAssistantSheet({ visible, onClose }: WorkoutAssistantSheetProps) {
  const assistant = useWorkoutAssistant();
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const scrollRef = useRef<ScrollView>(null);

  // Reset transcript whenever the sheet is dismissed. Each open is a fresh
  // conversation — predictable for the user, and avoids leaking stale
  // proposals after they re-open the sheet.
  //
  // `assistant` is intentionally kept out of deps: the hook returns a fresh
  // object every render (its useMemo deps include `messages`, which churns
  // during a conversation), so depending on it would re-fire this effect
  // every render and infinite-loop the reset path.
  const assistantRef = useRef(assistant);
  assistantRef.current = assistant;
  useEffect(() => {
    if (!visible) {
      assistantRef.current.reset();
      setDraft('');
      setInputHeight(40);
    }
  }, [visible]);

  // Auto-scroll to bottom when a new message arrives or thinking starts.
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [assistant.messages.length, assistant.isThinking, visible]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || assistant.isThinking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDraft('');
    setInputHeight(40);
    void assistant.send(text);
  }, [draft, assistant]);

  const handleSuggestionPress = useCallback(
    (s: string) => {
      if (assistant.isThinking) return;
      Haptics.selectionAsync().catch(() => {});
      void assistant.send(s);
    },
    [assistant],
  );

  const handleInputContentSize = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = Math.min(MAX_INPUT_HEIGHT, Math.max(40, Math.round(e.nativeEvent.contentSize.height)));
      setInputHeight(h);
    },
    [],
  );

  const canSend = draft.trim().length > 0 && !assistant.isThinking;
  const isEmpty = assistant.messages.length === 0 && !assistant.isThinking;

  return (
    <Sheet visible={visible} onClose={onClose} height="92%" flex>
      <SheetHeader
        eyebrow="WORKOUT"
        title="Coach"
        onClose={onClose}
        right={
          assistant.messages.length > 0 ? (
            <TouchableOpacity onPress={assistant.reset} hitSlop={8} activeOpacity={0.7}>
              <Text style={s.resetText}>New chat</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isEmpty ? (
            <EmptyTranscript onPickSuggestion={handleSuggestionPress} />
          ) : (
            <View style={s.transcript}>
              {assistant.messages.map(m => (
                <MessageRow
                  key={m.id}
                  message={m}
                  onApply={() => assistant.applyProposal(m.id)}
                  onDiscard={() => assistant.discardProposal(m.id)}
                />
              ))}
              {assistant.isThinking ? <ThinkingRow /> : null}
            </View>
          )}
        </ScrollView>

        <View style={s.composerWrap}>
          {assistant.error ? (
            <Text style={s.errorText} numberOfLines={2}>
              {assistant.error}
            </Text>
          ) : null}
          <View style={s.composer}>
            <TextInput
              style={[s.input, { height: inputHeight }]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask anything about your training…"
              placeholderTextColor={colors.textTertiary}
              multiline
              onContentSizeChange={handleInputContentSize}
              editable={!assistant.isThinking}
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
      </KeyboardAvoidingView>
    </Sheet>
  );
}

// ─── Sub-components (private) ────────────────────────────────────────────────

function EmptyTranscript({ onPickSuggestion }: { onPickSuggestion: (s: string) => void }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>Ask your coach</Text>
      <Text style={s.emptySub}>
        I can see your current program and recent sessions. Ask questions, request tweaks, or have me
        rebuild your plan from scratch.
      </Text>
      <View style={s.suggestionList}>
        {SUGGESTIONS.map(text => (
          <TouchableOpacity
            key={text}
            style={s.suggestion}
            activeOpacity={0.7}
            onPress={() => onPickSuggestion(text)}
          >
            <Text style={s.suggestionText}>{text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

type MessageRowProps = {
  message: AssistantMessage;
  onApply: () => void;
  onDiscard: () => void;
};

function MessageRow({ message, onApply, onDiscard }: MessageRowProps) {
  const isUser = message.role === 'user';
  return (
    <View style={[s.row, isUser ? s.rowUser : s.rowAssistant]}>
      <View
        style={[
          s.bubble,
          isUser ? s.bubbleUser : s.bubbleAssistant,
          message.error ? s.bubbleError : null,
        ]}
      >
        <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>{message.text}</Text>
      </View>
      {message.proposedConfig ? (
        <View style={s.proposalWrap}>
          <WorkoutProposalCard
            config={message.proposedConfig}
            summary={message.proposalSummary ?? null}
            status={message.proposalStatus}
            onApply={onApply}
            onDiscard={onDiscard}
          />
        </View>
      ) : null}
    </View>
  );
}

function ThinkingRow() {
  return (
    <View style={[s.row, s.rowAssistant]}>
      <View style={[s.bubble, s.bubbleAssistant, s.thinkingBubble]}>
        <PulseDots />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },

  resetText: {
    ...(text.monoCaption as TextStyle),
    color: colors.textSecondary,
    fontWeight: '700',
    paddingHorizontal: spacing.xs,
  },

  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },

  // ── Empty state ──
  empty: { flex: 1, paddingTop: spacing.lg, gap: spacing.md },
  emptyTitle: { ...(text.title2 as TextStyle), textAlign: 'center' },
  emptySub: {
    ...(text.bodySecondary as TextStyle),
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  suggestionList: { gap: spacing.sm, marginTop: spacing.md },
  suggestion: {
    ...surfaces.row,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  suggestionText: {
    ...(text.callout as TextStyle),
    color: colors.text,
  },

  // ── Transcript ──
  transcript: { gap: spacing.md, paddingBottom: spacing.lg },
  row: { gap: spacing.xs },
  rowUser: { alignItems: 'flex-end' },
  rowAssistant: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.text,
    borderTopRightRadius: radius.sm,
  },
  bubbleAssistant: {
    ...surfaces.row,
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.sm,
  },
  bubbleError: { borderColor: colors.danger + '70' },
  bubbleText: { ...(text.callout as TextStyle), lineHeight: 22 },
  bubbleTextUser: { color: '#000' },
  thinkingBubble: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },

  proposalWrap: { width: '100%', marginTop: spacing.xs },

  // ── Composer ──
  composerWrap: {
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
  composer: {
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
