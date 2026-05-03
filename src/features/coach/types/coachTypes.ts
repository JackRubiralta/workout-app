// Domain types for the cross-feature AI coach. The coach reads from the
// workouts, nutrition, and tracking slices and can propose changes to the
// program and the macro goals. Profile (name + height) and starting body
// weight are gathered up-front via onboarding rather than via mid-chat
// proposals — that keeps the model's output schema small and the apply
// path predictable.

import type { MacroGoals } from '@/features/nutrition/types/nutritionTypes';
import type { WorkoutConfig } from '@/features/workouts/types/workoutTypes';

export type CoachRole = 'user' | 'assistant';

/**
 * A proposal the coach attached to an assistant turn. Either field may
 * be present; both can land in the same turn (e.g. "build me a new
 * program and tighten my macros").
 */
export type CoachProposals = {
  workoutConfig: WorkoutConfig | null;
  macroGoals: MacroGoals | null;
};

export type ProposalStatus = 'pending' | 'applied' | 'discarded';

export type CoachMessage = {
  id: string;
  role: CoachRole;
  text: string;
  /** Coach turns only. `null` when no change was suggested. */
  proposals?: CoachProposals | null;
  /** One-line plain-English summary of the proposed change(s). */
  proposalSummary?: string | null;
  /** Per-proposal disposition so the UI can grey out applied/discarded cards. */
  workoutStatus?: ProposalStatus;
  goalsStatus?: ProposalStatus;
  /** Set on coach turns that failed (network/parse error). */
  error?: string;
};

export type CoachTurnResult = {
  reply: string;
  proposals: CoachProposals | null;
  proposalSummary: string | null;
};
