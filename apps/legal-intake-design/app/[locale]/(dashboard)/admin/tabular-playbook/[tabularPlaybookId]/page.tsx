import type { Metadata } from 'next';
import { TabularPlaybookDetail } from '@/components/design/tabular-playbook/tabular-playbook-detail';

export const metadata: Metadata = { title: 'Playbook' };

type PageProps = {
  params: Promise<{ tabularPlaybookId: string }>;
};

export default async function AdminTabularPlaybookDetailPage({
  params,
}: PageProps) {
  const { tabularPlaybookId } = await params;

  return <TabularPlaybookDetail tabularPlaybookId={tabularPlaybookId} />;
}
