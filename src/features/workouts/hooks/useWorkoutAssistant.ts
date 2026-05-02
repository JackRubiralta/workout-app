import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkoutData, useSessionData, useSettingsData } from '@/shared/state/store';
import { makeId } from '@/shared/utils/ids';
import { askWorkoutAssistant } from '../services/workoutAssistantService';
import type {
  AssistantMessage,
  AssistantTurnResult,
} from '../types/assistantTypes';
import type { WorkoutConfig } from '../types/workoutTypes';

// Owns the assistant transcript, the in-flight network state, and the
// proposal-acceptance handlers. Encapsulating it here keeps
// `WorkoutAssistantSheet` declarative and lets tests/Storybook drive the
// hook directly without rendering the sheet.
//
// State machine:
//
//   send(text)
//     ↓ append user msg, mark thinking
//     ↓ call service
//     ↓ on success → append assistant msg (maybe with proposal)
//     ↓ on error   → append assistant error msg
//
//   applyProposal(messageId)
//     ↓ replaceConfig() and flip status to "applied"
//
//   discardProposal(messageId)
//     ↓ flip status to "discarded"

export type UseWorkoutAssistant = {
  messages: AssistantMessage[];
  isThinking: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  applyProposal: (messageId: string) => void;
  discardProposal: (messageId: string) => void;
  reset: () => void;
  cancel: () => void;
};

export function useWorkoutAssistant(): UseWorkoutAssistant {
  const { config, replaceConfig } = useWorkoutData();
  const { sessions } = useSessionData();
  const { unitSystem } = useSettingsData();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Always cancel any in-flight request when this hook unmounts. Prevents a
  // late response from setState-ing into an unmounted tree.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isThinking) return;

      const userMsg: AssistantMessage = {
        id: makeId('m'),
        role: 'user',
        text,
      };
      const nextHistory = [...messages, userMsg];

      setError(null);
      setMessages(nextHistory);
      setIsThinking(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let result: AssistantTurnResult;
      try {
        result = await askWorkoutAssistant({
          history: nextHistory,
          config,
          recentSessions: sessions,
          unitSystem,
          signal: controller.signal,
        });
      } catch (e) {
        if (controller.signal.aborted) {
          // User cancelled or unmounted; do not write any state.
          return;
        }
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        setMessages(prev => [
          ...prev,
          {
            id: makeId('m'),
            role: 'assistant',
            text: `Couldn’t reach Claude. ${message}`,
            error: message,
          },
        ]);
        return;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsThinking(false);
      }

      const assistantMsg: AssistantMessage = {
        id: makeId('m'),
        role: 'assistant',
        text: result.reply,
        proposedConfig: result.proposedConfig,
        proposalSummary: result.proposalSummary,
        proposalStatus: result.proposedConfig ? 'pending' : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    },
    [messages, isThinking, config, sessions, unitSystem],
  );

  const applyProposal = useCallback(
    (messageId: string) => {
      let applied: WorkoutConfig | null = null;
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== messageId || !m.proposedConfig || m.proposalStatus !== 'pending') return m;
          applied = m.proposedConfig;
          return { ...m, proposalStatus: 'applied' };
        }),
      );
      if (applied) replaceConfig(applied);
    },
    [replaceConfig],
  );

  const discardProposal = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId && m.proposalStatus === 'pending'
          ? { ...m, proposalStatus: 'discarded' }
          : m,
      ),
    );
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsThinking(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsThinking(false);
    setError(null);
    setMessages([]);
  }, []);

  return useMemo(
    () => ({ messages, isThinking, error, send, applyProposal, discardProposal, reset, cancel }),
    [messages, isThinking, error, send, applyProposal, discardProposal, reset, cancel],
  );
}
