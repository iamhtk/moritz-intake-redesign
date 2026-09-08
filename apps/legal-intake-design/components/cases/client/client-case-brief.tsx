import { RichTextViewer } from '@/components/rich-text/rich-text-viewer';
import type { LegalCase } from '@/lib/types';

export function ClientCaseBrief({ legalCase }: { legalCase: LegalCase }) {
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Summary
      </h4>
      <RichTextViewer
        value={legalCase.description}
        className="text-muted-foreground text-sm leading-relaxed"
        emptyState="No description has been added to this case."
      />
    </section>
  );
}
