// Renders the chat transcript: user/assistant bubbles plus inline
// proposal cards for whichever proposal types the assistant returned.
// Stays a pure presentation component — every action is delegated to
// the parent so the screen owns the persistence side-effects.

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, surfaces, text } from '@/shared/theme';
import { PulseDots } from '@/shared/components';
import type { MacroGoals } from '@/features/nutrition/types/nutritionTypes';
import {
  MacroGoalsProposalCard,
  WorkoutProposalCard,
} from './proposals';
import type { CoachMessage } from '../types/coachTypes';

export type CoachTranscriptProps = {
  messages: CoachMessage[];
  isThinking: boolean;
  currentGoals: MacroGoals;
  onApplyWorkout: (id: string) => void;
  onDiscardWorkout: (id: string) => void;
  onApplyGoals: (id: string) => void;
  onDiscardGoals: (id: string) => void;
};

export function CoachTranscript({
  messages,
  isThinking,
  currentGoals,
  onApplyWorkout,
  onDiscardWorkout,
  onApplyGoals,
  onDiscardGoals,
}: CoachTranscriptProps) {
  return (
    <View style={s.transcript}>
      {messages.map(m => (
        <MessageRow
          key={m.id}
          message={m}
          currentGoals={currentGoals}
          onApplyWorkout={() => onApplyWorkout(m.id)}
          onDiscardWorkout={() => onDiscardWorkout(m.id)}
          onApplyGoals={() => onApplyGoals(m.id)}
          onDiscardGoals={() => onDiscardGoals(m.id)}
        />
      ))}
      {isThinking ? <ThinkingRow /> : null}
    </View>
  );
}

type MessageRowProps = {
  message: CoachMessage;
  currentGoals: MacroGoals;
  onApplyWorkout: () => void;
  onDiscardWorkout: () => void;
  onApplyGoals: () => void;
  onDiscardGoals: () => void;
};

function MessageRow({
  message,
  currentGoals,
  onApplyWorkout,
  onDiscardWorkout,
  onApplyGoals,
  onDiscardGoals,
}: MessageRowProps) {
  const isUser = message.role === 'user';
  const proposals = message.proposals ?? null;
  return (
    <EntryAnimated style={[s.row, isUser ? s.rowUser : s.rowAssistant]}>
      <View
        style={[
          s.bubble,
          isUser ? s.bubbleUser : s.bubbleAssistant,
          message.error ? s.bubbleError : null,
        ]}
      >
        <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>{message.text}</Text>
      </View>
      {proposals?.workoutConfig ? (
        <View style={s.proposalWrap}>
          <WorkoutProposalCard
            config={proposals.workoutConfig}
            summary={message.proposalSummary ?? null}
            status={message.workoutStatus}
            onApply={onApplyWorkout}
            onDiscard={onDiscardWorkout}
          />
        </View>
      ) : null}
      {proposals?.macroGoals ? (
        <View style={s.proposalWrap}>
          <MacroGoalsProposalCard
            next={proposals.macroGoals}
            current={currentGoals}
            // Hide the summary on the macro card if the workout card already showed it,
            // so a combined turn doesn't repeat the same line twice.
            summary={proposals.workoutConfig ? null : message.proposalSummary ?? null}
            status={message.goalsStatus}
            onApply={onApplyGoals}
            onDiscard={onDiscardGoals}
          />
        </View>
      ) : null}
    </EntryAnimated>
  );
}

function ThinkingRow() {
  return (
    <EntryAnimated style={[s.row, s.rowAssistant]}>
      <View style={[s.bubble, s.bubbleAssistant, s.thinkingBubble]}>
        <PulseDots />
      </View>
    </EntryAnimated>
  );
}

// Mount-only fade + lift. The component is keyed by message id upstream,
// so reused rows skip the animation entirely — only freshly appended turns
// (and the thinking indicator each time it shows) play it.
type EntryAnimatedProps = {
  style?: ViewStyle | ViewStyle[] | (ViewStyle | false | null | undefined)[];
  children: React.ReactNode;
};

function EntryAnimated({ style, children }: EntryAnimatedProps) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
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
});
