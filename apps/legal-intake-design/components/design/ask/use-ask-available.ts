'use client';

import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { askOffered } from '@/lib/ask/availability';
import type { Role } from '@/lib/types';

/**
 * Whether Ask Nora is offered here. The only way a component may ask.
 *
 * The rule itself lives in `lib/ask/availability.ts` (`askOffered`) — this is
 * the React half: read the flag off the design-flags context, hand it over.
 * Both `TopNav` (the ⌘J trigger) and `DashboardOverlays` (the panel, and the
 * command palette's *Ask Nora* row) call this and nothing else, so the trigger
 * cannot end up on the opposite side of a condition from the panel it opens.
 * That mismatch is what made Nora inert on the intake screen, and then made
 * her absent from it. See the long note on `askOffered`.
 */
export function useAskAvailable(role: Role): boolean {
  const { flags } = useDesignFlags();
  /*
   * `!== false`, not a truthiness check, and this is the third way Ask could
   * have gone missing.
   *
   * `DesignFlagsState` is a `Record<string, boolean>`, so reading a key that
   * is not there gives `undefined`. The provider does merge the registry
   * defaults under whatever `localStorage` holds, so in practice the key is
   * always present — but "in practice" is doing real work in that sentence,
   * and the failure mode is the one this whole arrangement exists to stop: a
   * flag that is merely *absent* reading as a flag somebody switched off, and
   * Nora vanishing with no one having chosen that.
   *
   * So absence means on. Only an explicit `false`, which a reviewer can only
   * produce by toggling the flag on the design-flags screen, turns Ask off.
   */
  return askOffered(role, flags.useAskNora !== false);
}
