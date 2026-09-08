'use client';

import { Download, FileWarning } from '@repo/ui/icons';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/design/foundations/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/design/foundations/components/popover';
import {
  ChangeNoteBubble,
  ChangeNoteGutter,
} from '@/components/design/first-drafts-admin/first-draft-change-notes';
import {
  ClauseCommentButton,
  FirstDraftDocumentPaper,
  FirstDraftPaperScroller,
} from '@/components/design/first-drafts-admin/first-draft-document-paper';

import {
  findVersion,
  sectionsForVersion,
  type DraftDocument,
} from './workspace-data';

/**
 * The document as stored, never as an editor. Ops reads it here and asks the
 * agent for changes; the only way a clause moves is a new version, which leaves
 * the file behind this preview untouched.
 */
export function DraftDocumentPreview({
  document,
  versionId,
  compare,
  onDownload,
  onRevert,
}: {
  document: DraftDocument;
  versionId?: string;
  /** Mark up what this version changed against the one before it. */
  compare: boolean;
  onDownload: () => void;
  /** Put a clause back to the wording it had before this version. */
  onRevert?: (changeId: string) => void;
}) {
  if (document.previewKind === 'unsupported') {
    return (
      <div className="bg-muted/60 flex h-full min-h-0 items-center justify-center overflow-y-auto p-6">
        <Empty className="border-field bg-background max-w-md rounded-2xl border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileWarning />
            </EmptyMedia>
            <EmptyTitle>No preview for this format</EmptyTitle>
            <EmptyDescription>
              {extensionOf(document.name)} files cannot be rendered here.
              Download the file to open it in its own application — the stored
              file is unchanged.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={onDownload}>
              <Download data-icon="inline-start" />
              Download {document.name}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (document.previewKind === 'text') {
    return (
      <FirstDraftPaperScroller>
        <article
          aria-label="Document page 1"
          className="bg-background border-field relative min-h-[1056px] border px-[clamp(3rem,11%,6rem)] pb-16 pt-20 font-[family-name:Aptos,Calibri,Arial,sans-serif] shadow-sm"
        >
          <div className="text-muted-foreground absolute right-6 top-5 text-xs">
            1
          </div>
          <div className="space-y-4 text-[11pt]/[1.6]">
            {(document.textPreview ?? []).map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0 ? 'text-center text-lg font-semibold' : undefined
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </FirstDraftPaperScroller>
    );
  }

  return (
    <ClausePaper
      document={document}
      versionId={versionId}
      compare={compare}
      onRevert={onRevert}
    />
  );
}

/** Below this there is no room for a margin beside a full-width page. */
const GUTTER_BREAKPOINT = 1144;

/**
 * The generated draft, page by page.
 *
 * A new version can land anywhere in twenty pages, so when one opens the clause
 * it rewrote comes to the reader rather than the other way round: the page
 * scrolls to it and the clause holds a highlight long enough to be found, then
 * lets go.
 *
 * With the redline showing, the agent's reasoning sits in a margin beside the
 * pages, the way comments do on paper. A narrow preview has no margin to give,
 * so the same note opens from the clause instead.
 */
function ClausePaper({
  document,
  versionId,
  compare,
  onRevert,
}: {
  document: DraftDocument;
  versionId?: string;
  compare: boolean;
  onRevert?: (changeId: string) => void;
}) {
  const version = findVersion(document, versionId);
  const [highlightSectionId, setHighlightSectionId] = useState<string>();
  const [activeChangeId, setActiveChangeId] = useState<string>();
  const [hasMargin, setHasMargin] = useState(false);
  const shownVersionRef = useRef<string>(version.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const observer = new ResizeObserver(([entry]) =>
      setHasMargin((entry?.contentRect.width ?? 0) >= GUTTER_BREAKPOINT),
    );
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Opening the workspace should start at the top of the document; only a
    // version arriving under the reader is worth chasing.
    if (shownVersionRef.current === version.id) return;
    shownVersionRef.current = version.id;

    const sectionId = version.changes[0]?.sectionId;
    if (!sectionId) return;

    setHighlightSectionId(sectionId);

    // The new wording changes the clause's height, so the scroll waits for it
    // to be laid out rather than aiming at where it used to be.
    const frame = window.requestAnimationFrame(() => {
      window.document
        .getElementById(`draft-section-${sectionId}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    // Matches the wash in `mz-clause-settle`, which has faded out by now.
    const timer = window.setTimeout(
      () => setHighlightSectionId(undefined),
      2400,
    );
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [version]);

  const changes = compare ? version.changes : undefined;
  const margin = Boolean(changes?.length) && hasMargin;

  return (
    <FirstDraftPaperScroller
      scrollRef={scrollRef}
      pagesRef={pagesRef}
      gutter={
        margin ? (
          <ChangeNoteGutter
            changes={version.changes}
            pagesRef={pagesRef}
            activeChangeId={activeChangeId}
            onHoverChange={setActiveChangeId}
            onRevert={onRevert}
            measureKey={version.id}
          />
        ) : undefined
      }
    >
      <FirstDraftDocumentPaper
        sections={sectionsForVersion(document, versionId)}
        changes={changes}
        highlightSectionId={highlightSectionId}
        activeChangeId={activeChangeId}
        onHoverChange={setActiveChangeId}
        renderComment={
          changes && !hasMargin
            ? (change) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <ClauseCommentButton
                      active={activeChangeId === change.id}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-72 border-none p-0 shadow-none"
                  >
                    <ChangeNoteBubble change={change} onRevert={onRevert} />
                  </PopoverContent>
                </Popover>
              )
            : undefined
        }
      />
    </FirstDraftPaperScroller>
  );
}

function extensionOf(name: string) {
  const extension = name.split('.').pop();
  return extension ? `.${extension.toUpperCase()}` : 'These';
}
