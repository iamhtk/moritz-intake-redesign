'use client';

import type { ReactNode } from 'react';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';

/**
 * Gates the homepage social-proof sections (trust bar + "Meet your legal team")
 * behind the `useHomepageSocialProof` design flag. The server-rendered children
 * are passed in and only mounted when the flag is on, mirroring the
 * `IntakeEntry` gate pattern so async server components stay on the server.
 */
export function SocialProofGate({ children }: { children: ReactNode }) {
  const { flags } = useDesignFlags();
  if (!flags.useHomepageSocialProof) return null;
  return <>{children}</>;
}
