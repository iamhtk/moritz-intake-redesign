import { PlaybookEditor } from '@/components/design/playbook-studio/playbook-editor';

interface PageProps {
  params: Promise<{ playbookId: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function ClientPlaybookEditorPage({
  params,
  searchParams,
}: PageProps) {
  const { playbookId } = await params;
  const { new: isNew } = await searchParams;
  return (
    <PlaybookEditor
      basePath="/client/playbooks"
      playbookId={playbookId}
      isNew={isNew === 'true'}
    />
  );
}
