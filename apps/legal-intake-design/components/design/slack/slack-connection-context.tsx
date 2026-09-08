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

/**
 * Playground-only "is Slack connected" state for the enterprise Slack demo.
 *
 * There is no real OAuth or workspace link here — this is a single boolean,
 * persisted to localStorage so every Slack surface (settings panel,
 * notifications banner, per-case "Open in Slack") reflects the same
 * connected/disconnected state across a demo session. Matches the persistence
 * pattern used by `design-flags-context.tsx`.
 */

const STORAGE_KEY = 'playground:slack-connected';

type SlackConnectionContextValue = {
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
};

const SlackConnectionContext =
  createContext<SlackConnectionContextValue | null>(null);

function loadFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistToStorage(connected: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(connected));
  } catch {
    // localStorage may be disabled (private mode, quota); fail silently.
  }
}

export function SlackConnectionProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  // Hydrate from storage after mount to avoid an SSR/CSR mismatch.
  useEffect(() => {
    setConnected(loadFromStorage());
  }, []);

  const connect = useCallback(() => {
    persistToStorage(true);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    persistToStorage(false);
    setConnected(false);
  }, []);

  const value = useMemo(
    () => ({ connected, connect, disconnect }),
    [connected, connect, disconnect],
  );

  return (
    <SlackConnectionContext.Provider value={value}>
      {children}
    </SlackConnectionContext.Provider>
  );
}

export function useSlackConnection() {
  const ctx = useContext(SlackConnectionContext);
  if (!ctx) {
    throw new Error(
      'useSlackConnection must be used within SlackConnectionProvider',
    );
  }
  return ctx;
}
