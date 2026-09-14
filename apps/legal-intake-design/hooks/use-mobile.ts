import * as React from 'react';

import { MOBILE_BREAKPOINT, MOBILE_QUERY } from '@/lib/breakpoints';

/**
 * Whether the viewport is a phone.
 *
 * The threshold is shared rather than declared here — see `lib/breakpoints.ts`
 * for why three components used to answer this question three different ways.
 *
 * Returns `false` until the first effect runs, which is deliberate: there is
 * no viewport on the server, and guessing "phone" would flash a bottom sheet
 * on a desktop. Every caller is an overlay that starts closed, so the one
 * render before the measurement lands is never on screen.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
