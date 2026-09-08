import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/mocks/case-types';
import { TemplateEditor } from '@/components/admin/template-editor';

interface PageProps {
  params: Promise<{ caseTypeId: string; templateId: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { caseTypeId, templateId } = await params;
  const template = getTemplateById(templateId);
  if (!template) notFound();

  return (
    <TemplateEditor
      caseTypeId={caseTypeId}
      mode="edit"
      initialValues={template}
    />
  );
}
