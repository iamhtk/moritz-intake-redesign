'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { buttonVariants } from '@/components/design/foundations/components/button';
import {
  Alert,
  AlertAction,
  AlertCancel,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';

type DirtyGetter = () => boolean;

/**
 * A screen-specific navigation interceptor. Returns `true` when it has taken
 * over the navigation (e.g. by opening its own confirmation dialog), so the
 * shared guard should not also show the generic unsaved-changes alert.
 */
type NavigateInterceptor = (href: string) => boolean;

type NavigationGuardContextValue = {
  /** `true` when any registered form currently has unsaved changes. */
  isBlocked: () => boolean;
  /**
   * Navigate to `href`, first prompting the user when a registered form is
   * dirty. Navigates immediately when nothing is dirty.
   */
  navigate: (href: string) => void;
  /** Register a dirty-state getter. Returns an unregister callback. */
  registerGuard: (getDirty: DirtyGetter) => () => void;
  /** Register a screen-specific interceptor. Returns an unregister callback. */
  registerInterceptor: (intercept: NavigateInterceptor) => () => void;
};

const NavigationGuardContext =
  createContext<NavigationGuardContextValue | null>(null);

/**
 * Guards in-app navigation away from screens with unsaved changes. Forms call
 * `useUnsavedChangesGuard(isDirty)` to register their dirty state; navigation
 * affordances (top-nav back button, nav pills, form cancel links) route through
 * `navigate`, which opens a confirmation modal when anything is dirty. The
 * modal lives here so every consumer shares one centralized dialog.
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations('common.unsavedChanges');
  const guardsRef = useRef<Set<DirtyGetter>>(new Set());
  const interceptorsRef = useRef<Set<NavigateInterceptor>>(new Set());
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isBlocked = useCallback(() => {
    for (const getDirty of guardsRef.current) {
      if (getDirty()) {
        return true;
      }
    }
    return false;
  }, []);

  const navigate = useCallback(
    (href: string) => {
      // Screen-specific interceptors get first refusal (they show their own
      // dialog); otherwise fall back to the shared unsaved-changes alert.
      for (const intercept of interceptorsRef.current) {
        if (intercept(href)) {
          return;
        }
      }
      if (isBlocked()) {
        setPendingHref(href);
      } else {
        router.push(href);
      }
    },
    [isBlocked, router],
  );

  const registerGuard = useCallback((getDirty: DirtyGetter) => {
    guardsRef.current.add(getDirty);
    return () => {
      guardsRef.current.delete(getDirty);
    };
  }, []);

  const registerInterceptor = useCallback((intercept: NavigateInterceptor) => {
    interceptorsRef.current.add(intercept);
    return () => {
      interceptorsRef.current.delete(intercept);
    };
  }, []);

  const confirmLeave = useCallback(() => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) {
      router.push(href);
    }
  }, [pendingHref, router]);

  const value = useMemo<NavigationGuardContextValue>(
    () => ({ isBlocked, navigate, registerGuard, registerInterceptor }),
    [isBlocked, navigate, registerGuard, registerInterceptor],
  );

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
      <Alert
        open={pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingHref(null);
          }
        }}
      >
        <AlertContent size="md">
          <AlertHeader>
            <AlertTitle>{t('title')}</AlertTitle>
            <AlertDescription>{t('description')}</AlertDescription>
          </AlertHeader>
          <AlertFooter>
            <AlertCancel>{t('cancel')}</AlertCancel>
            <AlertAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={confirmLeave}
            >
              {t('confirm')}
            </AlertAction>
          </AlertFooter>
        </AlertContent>
      </Alert>
    </NavigationGuardContext.Provider>
  );
}

/**
 * Read the navigation guard. Returns `null` when no provider is mounted, so
 * consumers can fall back to plain navigation.
 */
export function useNavigationGuard(): NavigationGuardContextValue | null {
  return useContext(NavigationGuardContext);
}

/**
 * Register the current screen's unsaved-changes state with the guard. Also wires
 * a native `beforeunload` prompt for full-page unloads (refresh / close /
 * external navigation). No-ops gracefully without a provider.
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  const ctx = useContext(NavigationGuardContext);
  const registerGuard = ctx?.registerGuard;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (!registerGuard) {
      return;
    }
    return registerGuard(() => isDirtyRef.current);
  }, [registerGuard]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}

/**
 * Register a screen-specific navigation interceptor. When in-app navigation is
 * triggered while a guard is blocking, the interceptor runs first and can take
 * over (e.g. open a bespoke confirmation dialog) by returning `true`, in which
 * case the shared unsaved-changes alert is suppressed. No-ops without a
 * provider. The latest `intercept` closure is always used.
 */
export function useNavigationInterceptor(intercept: NavigateInterceptor): void {
  const ctx = useContext(NavigationGuardContext);
  const registerInterceptor = ctx?.registerInterceptor;
  const interceptRef = useRef(intercept);
  interceptRef.current = intercept;

  useEffect(() => {
    if (!registerInterceptor) {
      return;
    }
    return registerInterceptor((href) => interceptRef.current(href));
  }, [registerInterceptor]);
}
