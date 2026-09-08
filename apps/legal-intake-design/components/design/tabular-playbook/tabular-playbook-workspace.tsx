'use client';

import { TabularPlaybooksFlagGate } from './tabular-playbook-flag-gate';
import { TabularPlaybooksHomepage } from './tabular-playbook-homepage';

export function TabularPlaybooksWorkspace() {
  return (
    <TabularPlaybooksFlagGate>
      <TabularPlaybooksHomepage />
    </TabularPlaybooksFlagGate>
  );
}
