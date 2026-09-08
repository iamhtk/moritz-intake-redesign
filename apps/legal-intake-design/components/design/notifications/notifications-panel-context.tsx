'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type NotificationsPanelContextValue = {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
  setOpen: (value: boolean) => void;
};

const NotificationsPanelContext =
  createContext<NotificationsPanelContextValue | null>(null);

export function NotificationsPanelProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);

  const value = useMemo<NotificationsPanelContextValue>(
    () => ({ open, openPanel, closePanel, setOpen }),
    [open, openPanel, closePanel],
  );

  return (
    <NotificationsPanelContext.Provider value={value}>
      {children}
    </NotificationsPanelContext.Provider>
  );
}

export function useNotificationsPanel() {
  const ctx = useContext(NotificationsPanelContext);
  if (!ctx) {
    throw new Error(
      'useNotificationsPanel must be used within NotificationsPanelProvider',
    );
  }
  return ctx;
}
