'use client';
import { useState } from 'react';
import { Check, Pencil } from '@repo/ui/icons';
import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { CellHistory } from './components/CellHistory';
import { EditableValue } from './components/EditableValue';
import { CitationMarker } from './components/CitationMarker';
import {
  SOURCE_DOCUMENT,
  buildSourceDocumentText,
} from './data/source-document-fixture';
import type { CellRevision, CellState } from './types';
import { getCellBadges } from './utils/badgeVariants';

/** How many leading sentences of the source excerpt carry a citation marker. */
const CITED_SENTENCE_COUNT = 2;

/**
 * Columns that record what is still unresolved rather than what the agreement
 * says. Their values are the review's own output, so there is no passage in the
 * document to cite for them.
 */
const UNSOURCED_COLUMN_KEYS = new Set(['openQuestions']);

/**
 * Splits the excerpt at periods that actually end a sentence — one followed by
 * whitespace — so clause numbers like "§9.8" stay whole instead of having a
 * marker land inside them. Each piece keeps its own period.
 */
const splitSentences = (text: string): string[] =>
  text.split(/(?<=\.)(?=\s)/).filter((sentence) => sentence.trim() !== '');

interface AIReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellValue: string;
  columnName: string;
  onOpenDocumentPreview?: (
    highlightedSnippet?: string,
    citationNumber?: number,
  ) => void;
  /** Drives the flagged styling, and is cleared by an edit. */
  cellState?: CellState;
  originalValue?: string; // Original AI-generated value
  isModified?: boolean; // Whether cell was user-modified
  /** Every value the cell has held, oldest first. Empty until the first edit. */
  revisions?: CellRevision[];
  /** The rule this cell belongs to is still waiting on a lawyer. */
  isDraftRule?: boolean;
  /** This particular value is the agent's, and nobody has approved it yet. */
  isProposedCell?: boolean;
  /** Signs the whole rule off from here. Omit to leave approval elsewhere. */
  onApproveRule?: () => void;
  /** Puts an earlier value back. Omit to keep the history read-only. */
  onRestoreRevision?: (revisionId: string) => void;
  /**
   * Commits an edit of the cell. Omit to keep the value read-only.
   */
  onSaveCellValue?: (value: string) => void;
  /** Column type and options, so the editor matches the one in the grid. */
  columnType?: string;
  columnKey?: string;
  enumOptions?: string[];
  /**
   * Extraction is still running for this cell. Separates a value that is on its
   * way from one the extraction simply had nothing to say about.
   */
  isLoading?: boolean;
}

export function AIReasoningModal({
  isOpen,
  onClose: _onClose,
  cellValue,
  columnName,
  onOpenDocumentPreview: _onOpenDocumentPreview,
  cellState = 'unflagged',
  originalValue,
  isModified = false,
  revisions = [],
  isDraftRule = false,
  isProposedCell = false,
  onApproveRule,
  onRestoreRevision,
  onSaveCellValue,
  columnType = 'verbatim',
  columnKey,
  enumOptions = [],
  isLoading = false,
}: AIReasoningModalProps) {
  const hasContent = cellValue && cellValue.trim() !== '';
  const valueBadges = getCellBadges(cellValue, columnType, columnKey);
  /** Only to fold the history away while the value is being rewritten. */
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = onSaveCellValue !== undefined;
  /**
   * A note written into a cell the extraction left empty replaces nothing and
   * has no passage behind it, so it is neither an edit nor a citable answer.
   */
  const replacedExtractedValue =
    isModified && (originalValue ?? '').trim() !== '';
  const isOwnNote = isModified && !replacedExtractedValue;
  const showsSourceDocument =
    Boolean(hasContent) &&
    !isOwnNote &&
    !UNSOURCED_COLUMN_KEYS.has(columnKey ?? '');

  /** Stand-in source excerpt for the design playground. */
  const generateSourceText = () => {
    if (columnName.toLowerCase() === 'deal value') {
      return `The total consideration for this transaction shall be USD ${cellValue}, payable in accordance with the terms set forth in Section 4.2 of this Agreement. The purchase price was determined based on a comprehensive valuation analysis including discounted cash flow projections and comparable transaction multiples. Payment shall be made 50% upon execution and 50% upon closing, subject to customary purchase price adjustments for working capital, debt, and cash.`;
    }
    return `The relevant provision states: "${cellValue}" as defined in the applicable section of this Agreement. This term is subject to the definitions and interpretations set forth in the General Provisions section and shall be construed in accordance with applicable law and industry standards.`;
  };

  const sourceText = generateSourceText();
  /** The excerpt as it sits in the agreement, so citations can be located there. */
  const documentText = buildSourceDocumentText(sourceText);

  if (!isOpen) return null;

  return (
    <div className="bg-dt-bg-primary flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {/*
           * Leads the panel when the rule is a draft. Somebody who opened one
           * cell to read it is the person best placed to sign the rule off, so
           * the state and the sign-off are both here rather than only in the
           * header's review queue.
           */}
          {isDraftRule && (
            <div className="border-warning/40 bg-warning/10 space-y-2 rounded-md border p-3">
              <p className="text-dt-fg-secondary text-xs leading-relaxed">
                {isProposedCell
                  ? 'The playbook agent rewrote this value. The rule stays in draft until you approve it.'
                  : 'The playbook agent drafted this rule. It stays in draft until you approve it.'}
              </p>
              {onApproveRule && (
                <Button variant="outline" size="sm" onClick={onApproveRule}>
                  <Check className="size-4" />
                  Approve rule
                </Button>
              )}
            </div>
          )}

          {/* Cell Value Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {/* One heading in every state: the attribution line below the
                  value already says whether it has been edited, and by whom. */}
              <h3 className="text-dt-fg-primary text-sm font-semibold">
                Cell Value
              </h3>
              {isModified && (
                <Badge variant="info">
                  <Pencil className="h-3 w-3" />
                  Modified
                </Badge>
              )}
              {isProposedCell && <Badge variant="warning">Updated</Badge>}
            </div>
            {isLoading ? (
              <div className="text-dt-fg-tertiary flex items-center gap-2 text-sm">
                <Spinner className="size-3" aria-label="Analyzing" />
                Analyzing...
              </div>
            ) : (
              <EditableValue
                value={cellValue}
                badges={valueBadges}
                badgeSize="lg"
                /*
                 * The extraction found nothing here. Say so and name the way
                 * out, rather than leaving a blank the panel looks broken for.
                 */
                emptyLabel={
                  canEdit ? 'No value — click to add a note' : 'No value'
                }
                editLabel={`Edit ${columnName}`}
                columnType={columnType}
                columnKey={columnKey}
                enumOptions={enumOptions}
                strikethrough={cellState === 'incorrect'}
                onSave={onSaveCellValue}
                onEditingChange={setIsEditing}
              />
            )}

            {/* Sits under the value it describes, inside the same section:
                who last changed it, when, and every value before it. */}
            {revisions.length > 0 && !isEditing && (
              <div className="pt-1">
                <CellHistory
                  revisions={revisions}
                  columnType={columnType}
                  columnKey={columnKey}
                  onRestore={onRestoreRevision}
                />
              </div>
            )}
          </div>

          {/* Source Document Section */}
          {showsSourceDocument && (
            <div className="space-y-1.5">
              <h3 className="text-dt-fg-primary text-sm font-semibold">
                Source Document: {SOURCE_DOCUMENT.name}
              </h3>
              <p className="text-dt-fg-primary text-sm leading-relaxed">
                {splitSentences(sourceText).map(
                  (sentence: string, index: number) => {
                    // The leading sentences carry the markers, so each citation's
                    // snippet is simply the sentence it sits after.
                    const citationNumber =
                      index < CITED_SENTENCE_COUNT ? index + 1 : null;
                    if (citationNumber === null)
                      return <span key={index}>{sentence}</span>;

                    return (
                      <span key={index}>
                        {sentence}
                        <CitationMarker
                          number={citationNumber}
                          source={{
                            number: citationNumber,
                            documentName: SOURCE_DOCUMENT.name,
                            snippet: sentence.trim(),
                            documentText,
                            documentAuthor: SOURCE_DOCUMENT.author,
                            documentLastModified: SOURCE_DOCUMENT.lastModified,
                          }}
                        />
                      </span>
                    );
                  },
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
