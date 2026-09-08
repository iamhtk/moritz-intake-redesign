'use client';

import * as React from 'react';
import { RuntimeConfigProvider } from './runtime-config-context';
import { NavigationProvider } from './navigation/navigation-context';
import { PlaygroundProvider } from './playground/role-context';
import { DesignFlagsProvider } from './design/feature-flags/design-flags-context';
import { ClientEngagementProvider } from './design/engagement-letter/engagement-letter-context';
import { SlackConnectionProvider } from './design/slack/slack-connection-context';
import type { Role } from '@/lib/types';

type ProvidersProps = {
  children: React.ReactNode;
  initialRole?: Role;
};

export function Providers({ children, initialRole }: ProvidersProps) {
  return (
    <RuntimeConfigProvider>
      <NavigationProvider>
        <PlaygroundProvider initialRole={initialRole}>
          <DesignFlagsProvider>
            <ClientEngagementProvider>
              <SlackConnectionProvider>{children}</SlackConnectionProvider>
            </ClientEngagementProvider>
          </DesignFlagsProvider>
        </PlaygroundProvider>
      </NavigationProvider>
    </RuntimeConfigProvider>
  );
}
