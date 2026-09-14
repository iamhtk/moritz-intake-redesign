import type { Metadata } from 'next';
import { TabularPlaybooksWorkspace } from '@/components/design/tabular-playbook/tabular-playbook-workspace';

export const metadata: Metadata = { title: 'Tabular playbook' };

export default function AdminTabularPlaybooksPage() {
  return <TabularPlaybooksWorkspace />;
}
