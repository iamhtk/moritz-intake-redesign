import type { Metadata } from 'next';
import { PlaybookLibrary } from '@/components/design/playbook-studio-admin/playbook-library';

export const metadata: Metadata = { title: 'Playbooks' };

export default function AdminPlaybooksPage() {
  return <PlaybookLibrary basePath="/admin/playbooks" />;
}
