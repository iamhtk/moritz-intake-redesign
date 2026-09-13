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
 * Open/closed state for the command palette, lifted out of the component.
 *
 * Mirrors `SettingsV2Provider` and `NotificationsPanelProvider` deliberately —
 * three shell surfaces with the same lifecycle should not have three different
 * shapes. It also gives the palette's own rows somewhere to call from: "Ask
 * Nora" has to close the palette and open the panel, which needs both handles
 * outside the dialog that is being unmounted.
 */
type CommandPaletteContextValue = {
  open: boolean;
  openPalette: () => void;
  closePalette: () => void;
  setOpen: (value: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ open, openPalette, closePalette, setOpen }),
    [open, openPalette, closePalette],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      'useCommandPalette must be used within CommandPaletteProvider',
    );
  }
  return ctx;
}
