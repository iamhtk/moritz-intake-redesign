'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type SettingsV2ContextValue = {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  setOpen: (value: boolean) => void;
};

const SettingsV2Context = createContext<SettingsV2ContextValue | null>(null);

export function SettingsV2Provider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const value = useMemo<SettingsV2ContextValue>(
    () => ({ open, openModal, closeModal, setOpen }),
    [open, openModal, closeModal],
  );

  return (
    <SettingsV2Context.Provider value={value}>
      {children}
    </SettingsV2Context.Provider>
  );
}

export function useSettingsV2Modal() {
  const ctx = useContext(SettingsV2Context);
  if (!ctx) {
    throw new Error(
      'useSettingsV2Modal must be used within SettingsV2Provider',
    );
  }
  return ctx;
}
