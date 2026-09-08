import { TabularPlaybookDetail } from '@/components/design/tabular-playbook/tabular-playbook-detail';

type PageProps = {
  params: Promise<{ tabularPlaybookId: string }>;
};

export default async function AdminTabularPlaybookDetailPage({
  params,
}: PageProps) {
  const { tabularPlaybookId } = await params;

  return <TabularPlaybookDetail tabularPlaybookId={tabularPlaybookId} />;
}
