'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Bridges the onboarding right panel (rendered in the layout) with the
 * customer-type chosen inside the client `OnboardingWalkthrough`. The walkthrough
 * pushes a variant; the branded panel reads it to pick its gradient.
 *
 * Defaults to `neutral` so the server render and the client's first render match
 * (hydration-safe) — the walkthrough updates it after mount.
 */
export type OnboardingPanelVariant =
  | 'neutral'
  | 'client'
  | 'legal'
  | 'waitlist';

type OnboardingPanelContextValue = {
  variant: OnboardingPanelVariant;
  setVariant: (variant: OnboardingPanelVariant) => void;
  // Whether the playground-only walkthrough chrome (step badge + Back/Next) is
  // shown. Hidden by default so the playground opens in production preview mode.
  devChromeVisible: boolean;
  toggleDevChrome: () => void;
  // Whether the header wordmark (rendered in the layout) is shown. Hidden on the
  // first step, where the "Welcome to Moritz" heading already carries the brand.
  headerLogoVisible: boolean;
  setHeaderLogoVisible: (visible: boolean) => void;
};

const OnboardingPanelContext =
  createContext<OnboardingPanelContextValue | null>(null);

export function OnboardingPanelProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<OnboardingPanelVariant>('neutral');
  const [devChromeVisible, setDevChromeVisible] = useState(false);
  // Hidden by default so the first step's server render matches the client (the
  // walkthrough always lands on the customer-type step, where the logo is off).
  const [headerLogoVisible, setHeaderLogoVisible] = useState(false);

  const value = useMemo(
    () => ({
      variant,
      setVariant,
      devChromeVisible,
      toggleDevChrome: () => setDevChromeVisible((visible) => !visible),
      headerLogoVisible,
      setHeaderLogoVisible,
    }),
    [variant, devChromeVisible, headerLogoVisible],
  );

  return (
    <OnboardingPanelContext.Provider value={value}>
      {children}
    </OnboardingPanelContext.Provider>
  );
}

export function useOnboardingPanelVariant(): OnboardingPanelVariant {
  const ctx = useContext(OnboardingPanelContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingPanelVariant must be used within OnboardingPanelProvider',
    );
  }
  return ctx.variant;
}

export function useSetOnboardingPanelVariant(): (
  variant: OnboardingPanelVariant,
) => void {
  const ctx = useContext(OnboardingPanelContext);
  if (!ctx) {
    throw new Error(
      'useSetOnboardingPanelVariant must be used within OnboardingPanelProvider',
    );
  }
  return ctx.setVariant;
}

export function useOnboardingDevChrome(): {
  visible: boolean;
  toggle: () => void;
} {
  const ctx = useContext(OnboardingPanelContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingDevChrome must be used within OnboardingPanelProvider',
    );
  }
  return { visible: ctx.devChromeVisible, toggle: ctx.toggleDevChrome };
}

export function useOnboardingHeaderLogo(): {
  visible: boolean;
  setVisible: (visible: boolean) => void;
} {
  const ctx = useContext(OnboardingPanelContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingHeaderLogo must be used within OnboardingPanelProvider',
    );
  }
  return {
    visible: ctx.headerLogoVisible,
    setVisible: ctx.setHeaderLogoVisible,
  };
}
