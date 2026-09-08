'use client';

import { ArrowUpRight } from '@repo/ui/icons';
import { CaseDocumentsPanel } from '@/components/design/documents/case-documents-panel';
import { useDesignFlags } from '@/components/design/feature-flags/design-flags-context';
import { getIroncladDocumentsForCase } from '@/lib/mocks/ironclad-documents';
import type { Document, IroncladDocument, LegalCase } from '@/lib/types';

/**
 * The Documents tab of a case details panel, whoever is reading it. Behaves
 * exactly like a bare `DocumentList` unless the `useIroncladIntegration` design
 * flag is on and the case has documents imported from Ironclad, in which case an
 * "Imported from Ironclad" context section is surfaced above the case files.
 */
export function CaseDocumentsTab({
  legalCase,
  documents,
}: {
  legalCase: LegalCase;
  /** Overrides `legalCase.documents` when the shell owns a live document list. */
  documents?: Document[];
}) {
  const { flags } = useDesignFlags();
  const caseDocuments = documents ?? legalCase.documents;
  const imported = getIroncladDocumentsForCase(legalCase.id);
  const showIronclad =
    Boolean(flags.useIroncladIntegration) && imported.length > 0;

  if (!showIronclad) {
    return <CaseDocumentsPanel documents={caseDocuments} />;
  }

  return (
    <div className="space-y-6">
      <IroncladImportedSection documents={imported} />
      <section className="space-y-3">
        <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Case files
        </h4>
        <CaseDocumentsPanel documents={caseDocuments} />
      </section>
    </div>
  );
}

function IroncladImportedSection({
  documents,
}: {
  documents: IroncladDocument[];
}) {
  return (
    <section className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Imported from Ironclad
      </h4>
      <ul className="border-field divide-border/70 divide-y rounded-xl border px-4">
        {documents.map((doc) => (
          <li key={doc.id}>
            <a
              href="#"
              aria-label={`View ${doc.name} in Ironclad`}
              title="View in Ironclad"
              className="group flex items-center gap-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{doc.name}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {doc.counterparty
                    ? `${doc.kind} \u00b7 ${doc.counterparty}`
                    : doc.kind}
                </div>
              </div>
              <ArrowUpRight className="text-muted-foreground/50 group-hover:text-foreground size-4 shrink-0 transition-colors" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
