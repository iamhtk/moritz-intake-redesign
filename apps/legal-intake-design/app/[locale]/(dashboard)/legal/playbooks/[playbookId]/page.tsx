import type { Metadata } from 'next';
import { PlaybookEditor } from '@/components/design/playbook-studio/playbook-editor';

export const metadata: Metadata = { title: 'Playbook' };

interface PageProps {
  params: Promise<{ playbookId: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function LegalPlaybookEditorPage({
  params,
  searchParams,
}: PageProps) {
  const { playbookId } = await params;
  const { new: isNew } = await searchParams;
  return (
    <PlaybookEditor
      basePath="/legal/playbooks"
      playbookId={playbookId}
      isNew={isNew === 'true'}
    />
  );
}
