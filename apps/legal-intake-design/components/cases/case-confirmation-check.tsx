'use client';

import { useEffect, useState } from 'react';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * Success medallion for the case-confirmation screen. The card itself fades in
 * via `mz-animate-step` (0.5s); we hold the ring/draw animations until that
 * entrance finishes so the icon reveals *after* the content has settled, then
 * replays each time the user lands here via client navigation.
 */
const STEP_FADE_MS = 500;

export function CaseConfirmationCheck() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), STEP_FADE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span
      className={cn(
        'border-border text-foreground flex size-12 items-center justify-center rounded-full border',
        show ? 'mz-animate-reveal' : 'opacity-0',
      )}
    >
      <Check
        aria-hidden="true"
        className={cn('size-5', show && 'mz-animate-check')}
        strokeWidth={1.75}
      />
    </span>
  );
}
