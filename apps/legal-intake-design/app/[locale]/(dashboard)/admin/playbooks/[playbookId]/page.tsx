import { PlaybookEditor } from '@/components/design/playbook-studio-admin/playbook-editor';

interface PageProps {
  params: Promise<{ playbookId: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function AdminPlaybookEditorPage({
  params,
  searchParams,
}: PageProps) {
  const { playbookId } = await params;
  const { new: isNew } = await searchParams;
  return (
    <PlaybookEditor
      basePath="/admin/playbooks"
      playbookId={playbookId}
      isNew={isNew === 'true'}
    />
  );
}
