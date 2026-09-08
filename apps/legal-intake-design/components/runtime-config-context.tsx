'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type RuntimeConfig = {
  arclineEnv: string;
  locales: readonly string[];
  authProviders: {
    workos: boolean;
    passkey: boolean;
    credentials: boolean;
  };
  posthog: {
    enabled: boolean;
    apiKey?: string;
    apiHost?: string;
  };
  featureFlags: {
    auditLogCustomer: boolean;
    auditLogExport: boolean;
    i18nDemoPageEnabled: boolean;
  };
};

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  arclineEnv: 'dev',
  locales: ['en'] as const,
  authProviders: {
    workos: true,
    passkey: true,
    credentials: false,
  },
  posthog: {
    enabled: false,
  },
  featureFlags: {
    auditLogCustomer: true,
    auditLogExport: true,
    i18nDemoPageEnabled: false,
  },
};

const RuntimeConfigContext = createContext<RuntimeConfig>(
  DEFAULT_RUNTIME_CONFIG,
);

export function RuntimeConfigProvider({
  value,
  children,
}: {
  value?: RuntimeConfig;
  children: ReactNode;
}) {
  return (
    <RuntimeConfigContext.Provider value={value ?? DEFAULT_RUNTIME_CONFIG}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  return useContext(RuntimeConfigContext);
}
