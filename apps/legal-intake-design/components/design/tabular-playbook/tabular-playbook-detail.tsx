'use client';

import { TabularPlaybooksFlagGate } from './tabular-playbook-flag-gate';
import { TabularPlaybookDetailView } from './tabular-playbook-detail-view';

/**
 * The source demo declares a `:tabularPlaybookId` segment but never reads it — every
 * detail URL renders the same demo table. That behaviour is preserved here.
 */
export function TabularPlaybookDetail({
  tabularPlaybookId,
}: {
  tabularPlaybookId: string;
}) {
  return (
    <TabularPlaybooksFlagGate>
      <TabularPlaybookDetailView tabularPlaybookId={tabularPlaybookId} />
    </TabularPlaybooksFlagGate>
  );
}
