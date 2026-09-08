'use client';

import type { ReactNode } from 'react';
import { Table2 } from '@repo/ui/icons';

import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { useIsMobile } from '@/hooks/use-mobile';
import { RightSidebarPanel } from './components/RightSidebarPanel';
import { RightSidebarProvider } from './contexts/RightSidebarContext';

/**
 * Gates the Tabular Playbook workspace behind the `useTabularPlaybooksAdmin` design flag
 * and applies the feature's scoped theme.
 *
 * `tabular-playbook-scope` re-declares Designwise's type scale and colour tokens on
 * this wrapper so the ported markup keeps its original proportions without
 * leaking those overrides into the rest of the playground.
 * `tabular-playbook-full-width` releases both the playbook list and the grid
 * from the shell's centred reading column — each is a bounded workspace rather
 * than a flowing page. See `tabular-playbook-theme.css`.
 */
export function TabularPlaybooksFlagGate({
  children,
}: {
  children: ReactNode;
}) {
  const { flags } = useDesignFlags();

  if (!flags.useTabularPlaybooksAdmin) {
    return (
      <Empty className="border-field rounded-2xl border py-16">
        <EmptyHeader>
          <EmptyMedia variant="ring">
            <Table2 strokeWidth={1.75} />
          </EmptyMedia>
          <EmptyTitle>Playbooks is disabled</EmptyTitle>
          <EmptyDescription>
            Enable the Playbooks tab in Settings &rarr; Design playground to
            open this workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="tabular-playbook-scope tabular-playbook-full-width">
      <TabularPlaybooksProviders>
        <TabularPlaybooksCanvas>{children}</TabularPlaybooksCanvas>
      </TabularPlaybooksProviders>
    </div>
  );
}

/**
 * Flex row of workspace / optional right drawer. Chat now opens as a Sheet
 * (Playbook assistant) rather than a left inset panel.
 */
function TabularPlaybooksCanvas({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-[calc(100svh_-_var(--tp-chrome-block))] overflow-hidden">
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      <RightSidebarPanel isMobile={isMobile} />
    </div>
  );
}

/**
 * Shared drawer infrastructure scoped to the feature. Persisted state (if any)
 * is namespaced under `design:tabular-playbook:`.
 */
function TabularPlaybooksProviders({ children }: { children: ReactNode }) {
  return <RightSidebarProvider>{children}</RightSidebarProvider>;
}
