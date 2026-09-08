'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Role } from '@/lib/types';
import {
  PLAYGROUND_ROLE_COOKIE,
  PLAYGROUND_ROLE_LS_KEY,
  DEFAULT_ROLE,
  isRole,
} from '@/lib/playground/role';

type PlaygroundContextValue = {
  role: Role;
  setRole: (role: Role) => void;
};

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null);

type Props = {
  initialRole?: Role;
  children: ReactNode;
};

function persistRoleCookie(role: Role) {
  if (typeof document === 'undefined') return;
  // 30-day cookie
  document.cookie = `${PLAYGROUND_ROLE_COOKIE}=${role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function PlaygroundProvider({ initialRole, children }: Props) {
  const [role, setRoleState] = useState<Role>(initialRole ?? DEFAULT_ROLE);

  // On mount, fall back to localStorage if no cookie-based initial role
  useEffect(() => {
    if (initialRole) return;
    const stored = window.localStorage.getItem(PLAYGROUND_ROLE_LS_KEY);
    if (stored && isRole(stored)) {
      setRoleState(stored);
      persistRoleCookie(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    persistRoleCookie(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLAYGROUND_ROLE_LS_KEY, next);
    }
    // Server components pick up the new mock user on the next navigation. The
    // role switcher performs a full navigation to the new role's home so this
    // happens immediately without a manual refresh.
  }, []);

  return (
    <PlaygroundContext.Provider value={{ role, setRole }}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) {
    throw new Error('usePlayground must be used within PlaygroundProvider');
  }
  return ctx;
}

export { isRole, DEFAULT_ROLE, PLAYGROUND_ROLE_COOKIE };
