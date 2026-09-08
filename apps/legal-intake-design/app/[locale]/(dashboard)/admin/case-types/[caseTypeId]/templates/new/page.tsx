import { TemplateEditor } from '@/components/admin/template-editor';

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
