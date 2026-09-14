import type { Metadata } from 'next';
import { PlaybookLibrary } from '@/components/design/playbook-studio/playbook-library';

export const metadata: Metadata = { title: 'Playbooks' };

export default function ClientPlaybooksPage() {
  return <PlaybookLibrary basePath="/client/playbooks" />;
}
