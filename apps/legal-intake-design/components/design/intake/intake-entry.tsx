'use client';

import type { ReactNode } from 'react';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { EngagementRequired } from '@/components/design/engagement-letter/engagement-required';
import { useClientEngagement } from '@/components/design/engagement-letter/engagement-letter-context';
import { ConversationalIntakeFlow } from '@/components/design/new-case/conversational-intake-flow';

type IntakeEntryProps = {
  /** Rendered when the intake flag is off. */
  fallback: ReactNode;
};

/**
 * Gates the `/client/new` entry point:
 * - `useSimplifiedMatterIntake` (when on) shows the Moritz-style conversational
 *   case intake (chat + suggestion chips + live brief panel).
 * - otherwise we fall back to the form-based case intake.
 */
export function IntakeEntry({ fallback }: IntakeEntryProps) {
  const { flags } = useDesignFlags();
  const { enabled, isPending } = useClientEngagement();

  if (enabled && isPending) {
    return <EngagementRequired />;
  }

  if (flags.useSimplifiedMatterIntake) {
    return <ConversationalIntakeFlow />;
  }
  return <>{fallback}</>;
}
