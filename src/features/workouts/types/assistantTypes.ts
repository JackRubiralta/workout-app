// Types shared between the workout-assistant service, sheet UI, and
// callers. Kept as a separate file because both UI code and pure service
// code consume them — putting them in either of those creates a
// circular import risk.

import type { WorkoutConfig } from './workoutTypes';

export type AssistantRole = 'user' | 'assistant';

export type AssistantMessage = {
  id: string;
  role: AssistantRole;
  text: string;
  /** Set on assistant turns that propose a config replacement. */
  proposedConfig?: WorkoutConfig | null;
  /** One-line description of the proposal, used in the UI summary card. */
  proposalSummary?: string | null;
  /** Tracks user disposition so we can grey out applied/discarded proposals. */
  proposalStatus?: 'pending' | 'applied' | 'discarded';
  /** Set on assistant turns that failed (network/parse error). */
  error?: string;
};

export type AssistantTurnResult = {
  reply: string;
  proposedConfig: WorkoutConfig | null;
  proposalSummary: string | null;
};
