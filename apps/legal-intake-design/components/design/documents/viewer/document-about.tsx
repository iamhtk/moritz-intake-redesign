'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@repo/ui/lib/utils';

import { formatBytes } from './document-actions';
import type { FileDocument } from './types';

/**
 * What a brief field says it took from this document.
 *
 * Assembled from the brief rather than from the document, because that is
 * where the claim lives: a field carries the file it was read from and the
 * words it was read from (`sourceNote` and `sourceQuote` in
 * `lib/intake/brief.ts`), both verified server-side before the row is allowed
 * to show them.
 */
export type DocumentCitation = {
  fieldKey: string;
  label: string;
  /** Passed to the viewer to find and light up. Absent if unverified. */
  quote: string | null;
};

/**
 * About: what this file is, and what the intake made of it.
 *
 * The reference viewers put file metadata behind this control — type, size,
 * date. That is worth showing and is not worth a panel on its own, so the
 * second half is the part only this product can answer: which values on the
 * brief came out of this document, each one a way back to the passage it came
 * from. A client checking a contract has one question in this panel — "what did
 * you take from this?" — and the answer is a list, not a size in kilobytes.
 */
export function DocumentAbout({
  item,
  pageCount,
  citations,
  onRevealCitation,
}: {
  item: FileDocument;
  pageCount: number | null;
  citations: readonly DocumentCitation[];
  onRevealCitation: (citation: DocumentCitation) => void;
}) {
  const t = useTranslations('intake.documents');

  const rows: (readonly [string, string])[] = [
    [t('about.kind'), t(item.kind === 'pdf' ? 'about.pdf' : 'about.image')],
    [t('about.size'), formatBytes(item.size)],
    ...(pageCount !== null
      ? [[t('about.pages'), String(pageCount)] as const]
      : []),
    [
      t('about.added'),
      new Date(item.addedAt).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    ],
  ];

  return (
    <div className="w-72 space-y-4">
      <div>
        <p className="text-foreground truncate text-[13px] font-medium">
          {item.name}
        </p>
        <dl className="mt-2 space-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 text-[12px]">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-border border-t pt-3">
        <p className="text-muted-foreground text-[10.5px] uppercase tracking-wide">
          {t('about.citedBy')}
        </p>
        {citations.length === 0 ? (
          /*
           * A document nothing was read from is a real and common outcome — a
           * scan with no text layer, or an exhibit that answered nothing the
           * brief asks. Saying so is the honest version of an empty list, and
           * it tells the client the document is still on the case.
           */
          <p className="text-muted-foreground mt-1.5 text-[12px]">
            {t('about.citedByNone')}
          </p>
        ) : (
          <ul className="mt-1.5 space-y-0.5">
            {citations.map((citation) => (
              <li key={citation.fieldKey}>
                <button
                  type="button"
                  disabled={citation.quote === null}
                  onClick={() => onRevealCitation(citation)}
                  className={cn(
                    'w-full rounded-[0.5rem] px-1.5 py-1 text-left text-[12px] transition-colors',
                    citation.quote === null
                      ? 'text-muted-foreground cursor-default'
                      : 'text-foreground hover:bg-foreground/5 cursor-pointer',
                  )}
                >
                  {citation.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
