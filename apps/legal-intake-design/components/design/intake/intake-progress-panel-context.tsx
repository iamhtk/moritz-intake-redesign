'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

type IntakeProgressPanelContextValue = {
  /**
   * `true` while an intake flow is mounted and has registered itself. The
   * `SiteHeader` uses this to decide whether to render the toggle button.
   */
  isAvailable: boolean;
  /** Current open state of the intake progress panel. */
  isOpen: boolean;
  /**
   * `true` once the user has toggled the panel at least once. Used by the
   * docked Sheet to suppress the slide-in animation on first render.
   */
  hasInteracted: boolean;
  /** Toggle the panel open/closed. */
  toggle: () => void;
  /** Imperatively set the panel state (used by the panel's onOpenChange). */
  setOpen: (next: boolean) => void;
  /**
   * Register a panel as available. Returns an unregister callback. The
   * intake flow calls this from a `useEffect` so the header button only
   * shows while the flow is mounted.
   */
  registerPanel: () => () => void;
};

const IntakeProgressPanelContext =
  createContext<IntakeProgressPanelContextValue | null>(null);

type IntakeProgressPanelProviderProps = {
  children: ReactNode;
  /** Initial open state. Defaults to `true` so the desktop panel docks open. */
  defaultOpen?: boolean;
};

export function IntakeProgressPanelProvider({
  children,
  defaultOpen = true,
}: IntakeProgressPanelProviderProps) {
  const isMobile = useIsMobile();
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isOpen, setIsOpenState] = useState(defaultOpen);
  const [hasInteracted, setHasInteracted] = useState(false);

  // On mobile the panel is a modal Drawer that dims and covers the whole
  // screen, so it must not be open by default — the user opens it deliberately
  // via the header toggle. Keep it closed while the viewport is mobile and the
  // user hasn't interacted yet. This also re-applies after a fresh
  // registration (which resets `hasInteracted`) and when a desktop viewport
  // shrinks to mobile before any interaction.
  useEffect(() => {
    if (isMobile && !hasInteracted) {
      setIsOpenState(false);
    }
  }, [isMobile, hasInteracted, registrationCount]);

  const setOpen = useCallback((next: boolean) => {
    setHasInteracted(true);
    setIsOpenState(next);
  }, []);

  const toggle = useCallback(() => {
    setHasInteracted(true);
    setIsOpenState((value) => !value);
  }, []);

  const registerPanel = useCallback(() => {
    setRegistrationCount((count) => count + 1);
    // Each fresh registration (e.g. when the user navigates back to the
    // intake flow) restores the docked-open default — same as if the page had
    // just loaded. Suppresses the slide-in animation on first paint too.
    setIsOpenState(defaultOpen);
    setHasInteracted(false);
    return () => {
      setRegistrationCount((count) => Math.max(0, count - 1));
    };
  }, [defaultOpen]);

  const value = useMemo<IntakeProgressPanelContextValue>(
    () => ({
      isAvailable: registrationCount > 0,
      isOpen,
      hasInteracted,
      toggle,
      setOpen,
      registerPanel,
    }),
    [registrationCount, isOpen, hasInteracted, toggle, setOpen, registerPanel],
  );

  return (
    <IntakeProgressPanelContext.Provider value={value}>
      {children}
    </IntakeProgressPanelContext.Provider>
  );
}

/**
 * Read the intake progress panel state. Returns `null` when no provider is
 * mounted (e.g. the legacy non-sidebar shell), so consumers can no-op
 * gracefully.
 */
export function useIntakeProgressPanel(): IntakeProgressPanelContextValue | null {
  return useContext(IntakeProgressPanelContext);
}

/**
 * Register the current component as the active intake progress panel. The
 * `SiteHeader` uses this signal to decide whether to render the toggle
 * button. Safe to call without a provider; it no-ops in that case.
 *
 * Depends on `registerPanel` (a stable `useCallback`) rather than the whole
 * context value, so toggling the panel — which produces a new context value
 * — does not retrigger registration and clobber the user's toggle.
 */
export function useRegisterIntakeProgressPanel(): void {
  const ctx = useContext(IntakeProgressPanelContext);
  const registerPanel = ctx?.registerPanel;
  useEffect(() => {
    if (!registerPanel) return;
    return registerPanel();
  }, [registerPanel]);
}
