import type { Metadata } from 'next';
import { AiEvalsWorkspace } from '@/components/design/ai-evals-admin/ai-evals-workspace';

export const metadata: Metadata = { title: 'AI evals' };

export default function AdminAiEvalsPage() {
  return <AiEvalsWorkspace />;
}
