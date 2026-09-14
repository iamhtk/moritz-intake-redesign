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
import {
  DESIGN_FLAGS,
  buildDefaultFlagsState,
  type DesignFlagsState,
} from './design-flags-registry';

const STORAGE_KEY = 'playground:design-flags';
const MIGRATIONS_KEY = 'playground:design-flags:migrations';

/**
 * One-time migrations that adjust stored playground flag state when a flag's
 * `defaultValue` changes. Each entry runs at most once per browser (tracked in
 * MIGRATIONS_KEY).
 */
const MIGRATIONS: { id: string; apply: (state: DesignFlagsState) => void }[] = [
  {
    id: 'useSidebar-default-on-2026-05',
    apply(state) {
      // Drop stale `false` so the new `defaultValue: true` takes effect.
      delete state.useSidebar;
    },
  },
  {
    id: 'useAiCaseIntake-default-on-2026-07',
    apply(state) {
      // Drop stale `false` so the new `defaultValue: true` takes effect.
      delete state.useAiCaseIntake;
    },
  },
  {
    id: 'useAiCaseIntake-default-off-2026-07',
    apply(state) {
      // Flip back to off-by-default: drop any stored value so the new
      // `defaultValue: false` takes effect.
      delete state.useAiCaseIntake;
    },
  },
  {
    id: 'usePlaybooks-default-off-2026-07',
    apply(state) {
      // Off-by-default: drop any stored value so the new `defaultValue: false`
      // takes effect.
      delete state.usePlaybooks;
    },
  },
  {
    id: 'useTabularPlaybooksAdmin-default-on-2026-08',
    apply(state) {
      // Drop stale `false` so the new `defaultValue: true` takes effect.
      delete state.useTabularPlaybooksAdmin;
    },
  },
  {
    /*
     * Both of the keyboard surfaces shipped off, so neither existed on any
     * page until somebody found the flags screen. Flipping `defaultValue`
     * alone would not have reached anyone who had already loaded the app —
     * `loadFromStorage` writes every known flag into `localStorage`, so a
     * stored `false` outranks the new default forever. Dropping the keys is
     * what lets the default win.
     */
    id: 'command-palette-and-ask-default-on-2026-09',
    apply(state) {
      delete state.useCommandPalette;
      delete state.useAskNora;
    },
  },
];

type DesignFlagsContextValue = {
  flags: DesignFlagsState;
  setFlag: (key: string, value: boolean) => void;
  resetAll: () => void;
};

const DesignFlagsContext = createContext<DesignFlagsContextValue | null>(null);

function loadFromStorage(): DesignFlagsState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Filter out unknown keys (e.g. flags that were removed from the registry).
    const valid: DesignFlagsState = {};
    for (const flag of DESIGN_FLAGS) {
      if (typeof parsed[flag.key] === 'boolean') {
        valid[flag.key] = parsed[flag.key];
      }
    }
    return valid;
  } catch {
    return null;
  }
}

function persistToStorage(state: DesignFlagsState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be disabled (private mode, quota); fail silently.
  }
}

function loadAppliedMigrations(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(MIGRATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function persistAppliedMigrations(applied: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MIGRATIONS_KEY, JSON.stringify([...applied]));
  } catch {
    // localStorage may be disabled; fail silently.
  }
}

function runPendingMigrations(stored: DesignFlagsState | null) {
  if (!stored) return stored;
  const applied = loadAppliedMigrations();
  let next: DesignFlagsState | null = null;
  let appliedChanged = false;
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    if (!next) next = { ...stored };
    migration.apply(next);
    applied.add(migration.id);
    appliedChanged = true;
  }
  if (next) persistToStorage(next);
  if (appliedChanged) persistAppliedMigrations(applied);
  return next ?? stored;
}

export function DesignFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<DesignFlagsState>(() =>
    buildDefaultFlagsState(),
  );

  useEffect(() => {
    const stored = runPendingMigrations(loadFromStorage());
    if (stored) {
      setFlags((current) => ({ ...current, ...stored }));
    }
  }, []);

  const setFlag = useCallback((key: string, value: boolean) => {
    setFlags((current) => {
      const next = { ...current, [key]: value };
      persistToStorage(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    const defaults = buildDefaultFlagsState();
    persistToStorage(defaults);
    setFlags(defaults);
  }, []);

  const value = useMemo(
    () => ({ flags, setFlag, resetAll }),
    [flags, setFlag, resetAll],
  );

  return (
    <DesignFlagsContext.Provider value={value}>
      {children}
    </DesignFlagsContext.Provider>
  );
}

export function useDesignFlags() {
  const ctx = useContext(DesignFlagsContext);
  if (!ctx) {
    throw new Error('useDesignFlags must be used within DesignFlagsProvider');
  }
  return ctx;
}
