import type { Metadata } from 'next';
import { AiEvalsWorkspace } from '@/components/design/ai-evals-admin/ai-evals-workspace';

export const metadata: Metadata = { title: 'Evaluation' };

export default async function AdminAiEvalDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  return <AiEvalsWorkspace initialRunId={decodeURIComponent(runId)} />;
}
