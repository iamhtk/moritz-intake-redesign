import type { Metadata } from 'next';
import { TemplateEditor } from '@/components/admin/template-editor';

export const metadata: Metadata = { title: 'New' };

interface PageProps {
  params: Promise<{ caseTypeId: string }>;
}

export default async function NewTemplatePage({ params }: PageProps) {
  const { caseTypeId } = await params;
  return (
    <TemplateEditor
      caseTypeId={caseTypeId}
      mode="create"
      initialValues={null}
    />
  );
}
