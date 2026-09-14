'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Open/closed state for the Ask panel.
 *
 * Same shape as `SettingsV2Provider`, `NotificationsPanelProvider` and
 * `CommandPaletteProvider`. Four shell surfaces with one lifecycle should not
 * have four different shapes, and this one in particular has to be reachable
 * from the command palette's *Ask Nora* row, which means the handle has to live
 * above both of them.
 *
 * Note what is *not* here: the transcript. That lives in `lib/ask/session.ts`,
 * at module scope, because opening Ask from the palette mounts and unmounts a
 * dialog and React state would not survive it.
 */
type AskContextValue = {
  open: boolean;
  openAsk: () => void;
  closeAsk: () => void;
  setOpen: (value: boolean) => void;
};

const AskContext = createContext<AskContextValue | null>(null);

export function AskProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openAsk = useCallback(() => setOpen(true), []);
  const closeAsk = useCallback(() => setOpen(false), []);

  const value = useMemo<AskContextValue>(
    () => ({ open, openAsk, closeAsk, setOpen }),
    [open, openAsk, closeAsk],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}

export function useAsk() {
  const ctx = useContext(AskContext);
  if (!ctx) throw new Error('useAsk must be used within AskProvider');
  return ctx;
}
