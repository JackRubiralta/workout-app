import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useBodyWeightData,
  useNutritionData,
  useSessionData,
  useSettingsData,
  useWorkoutData,
} from '@/shared/state/store';
import { makeId } from '@/shared/utils/ids';
import { askCoach } from '../services/coachService';
import type {
  CoachMessage,
  CoachTurnResult,
} from '../types/coachTypes';

// State machine:
//
//   send(text)
//     ↓ append user msg, mark thinking
//     ↓ call service
//     ↓ on success → append coach msg (maybe with proposals)
//     ↓ on error   → append coach error msg
//
//   applyWorkout(messageId)  → replaceConfig() + flip workoutStatus to "applied"
//   discardWorkout(messageId) → flip workoutStatus to "discarded"
//   applyGoals(messageId)    → setGoals() + flip goalsStatus to "applied"
//   discardGoals(messageId)  → flip goalsStatus to "discarded"

export type UseCoach = {
  messages: CoachMessage[];
  isThinking: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  applyWorkout: (messageId: string) => void;
  discardWorkout: (messageId: string) => void;
  applyGoals: (messageId: string) => void;
  discardGoals: (messageId: string) => void;
  reset: () => void;
  cancel: () => void;
};

export function useCoach(): UseCoach {
  const { config, replaceConfig } = useWorkoutData();
  const { sessions } = useSessionData();
  const { goals, logsByDate, setGoals } = useNutritionData();
  const { entries: weightEntries, latest: latestWeight } = useBodyWeightData();
  const { unitSystem, profile } = useSettingsData();

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

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

      const userMsg: CoachMessage = {
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

      let result: CoachTurnResult;
      try {
        result = await askCoach({
          history: nextHistory,
          profile,
          latestWeight,
          weightEntries,
          config,
          sessions,
          goals,
          logsByDate,
          unitSystem,
          signal: controller.signal,
        });
      } catch (e) {
        if (controller.signal.aborted) return;
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        setMessages(prev => [
          ...prev,
          {
            id: makeId('m'),
            role: 'assistant',
            text: `Couldn’t reach the coach. ${message}`,
            error: message,
          },
        ]);
        return;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsThinking(false);
      }

      const coachMsg: CoachMessage = {
        id: makeId('m'),
        role: 'assistant',
        text: result.reply,
        proposals: result.proposals,
        proposalSummary: result.proposalSummary,
        workoutStatus: result.proposals?.workoutConfig ? 'pending' : undefined,
        goalsStatus: result.proposals?.macroGoals ? 'pending' : undefined,
      };
      setMessages(prev => [...prev, coachMsg]);
    },
    [
      messages,
      isThinking,
      profile,
      latestWeight,
      weightEntries,
      config,
      sessions,
      goals,
      logsByDate,
      unitSystem,
    ],
  );

  // Apply / discard helpers share the same pattern: locate the message,
  // commit the persisted change, then flip the per-proposal status.
  // Inlining the side-effect inside the setState updater would re-run
  // it on every React strict-mode double-invocation; doing it before
  // the state flip keeps both calls deterministic.
  const applyWorkout = useCallback(
    (messageId: string) => {
      const msg = messages.find(m => m.id === messageId);
      if (!msg?.proposals?.workoutConfig || msg.workoutStatus !== 'pending') return;
      replaceConfig(msg.proposals.workoutConfig);
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, workoutStatus: 'applied' } : m)),
      );
    },
    [messages, replaceConfig],
  );

  const discardWorkout = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId && m.workoutStatus === 'pending'
          ? { ...m, workoutStatus: 'discarded' }
          : m,
      ),
    );
  }, []);

  const applyGoals = useCallback(
    (messageId: string) => {
      const msg = messages.find(m => m.id === messageId);
      if (!msg?.proposals?.macroGoals || msg.goalsStatus !== 'pending') return;
      setGoals(msg.proposals.macroGoals);
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, goalsStatus: 'applied' } : m)),
      );
    },
    [messages, setGoals],
  );

  const discardGoals = useCallback((messageId: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId && m.goalsStatus === 'pending'
          ? { ...m, goalsStatus: 'discarded' }
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
    setIsThinking(prev => (prev ? false : prev));
    setError(prev => (prev != null ? null : prev));
    setMessages(prev => (prev.length === 0 ? prev : []));
  }, []);

  return useMemo(
    () => ({
      messages,
      isThinking,
      error,
      send,
      applyWorkout,
      discardWorkout,
      applyGoals,
      discardGoals,
      reset,
      cancel,
    }),
    [
      messages,
      isThinking,
      error,
      send,
      applyWorkout,
      discardWorkout,
      applyGoals,
      discardGoals,
      reset,
      cancel,
    ],
  );
}
