'use client';

import { MessageSquareText } from '@repo/ui/icons';

import { cn } from '@/lib/utils';

import type { DraftDocumentSection } from './first-drafts-data';
import { redlineBlocks } from './redline';

/** A clause rewritten in the version on screen, shown as a mark-up. */
export type PaperChange = {
  id: string;
  sectionId: string;
  /** Body as of the version before this one. */
  previousBody: string;
  /** Body as of this version. */
  body: string;
  /** Why the agent made the change. */
  note: string;
};

const PAGE =
  'bg-background border-field relative min-h-[1056px] border px-[clamp(3rem,11%,6rem)] pb-16 pt-20 font-[family-name:Aptos,Calibri,Arial,sans-serif] shadow-sm';

const BODY =
  'text-foreground text-[11pt]/[1.45] [&_ol]:ml-6 [&_ol]:list-decimal [&_p+p]:mt-4 [&_ul]:ml-6 [&_ul]:list-disc';

/**
 * The draft as paper: read-only, page by page.
 *
 * Documents are changed by asking the agent, which cuts a new version, so there
 * is nothing to type into here. What a version did to a clause is shown the way
 * a redline shows it — the words it removed struck through where they stood,
 * the words it added underlined in their place, and a bar in the margin so a
 * change can be found while scrolling past.
 */
export function FirstDraftDocumentPaper({
  sections,
  changes,
  highlightSectionId,
  activeChangeId,
  onHoverChange,
  renderComment,
}: {
  sections: DraftDocumentSection[];
  changes?: PaperChange[];
  /** Clause to light up briefly, so a new version shows what it moved. */
  highlightSectionId?: string;
  /** The change the reader is on, from either the clause or its comment. */
  activeChangeId?: string;
  onHoverChange?: (changeId?: string) => void;
  /**
   * The agent's reasoning, for when there is no room beside the page for a
   * margin: the clause carries a button that opens the same note.
   */
  renderComment?: (change: PaperChange) => React.ReactNode;
}) {
  const changed = new Map(
    (changes ?? []).map((change) => [change.sectionId, change]),
  );
  const pages = Array.from(
    new Set(sections.map((section) => section.page)),
  ).sort((a, b) => a - b);

  return (
    <>
      {pages.map((page) => (
        <article
          key={page}
          aria-label={`Document page ${page}`}
          className={PAGE}
        >
          <div className="text-muted-foreground absolute right-6 top-5 text-xs">
            {page}
          </div>
          <div className="space-y-5">
            {sections
              .filter((section) => section.page === page)
              .map((section) => {
                const change = changed.get(section.id);
                const settling = highlightSectionId === section.id;
                const active = Boolean(change && activeChangeId === change.id);

                return (
                  <section
                    key={section.id}
                    id={`draft-section-${section.id}`}
                    data-change-id={change?.id}
                    onMouseEnter={
                      change ? () => onHoverChange?.(change.id) : undefined
                    }
                    onMouseLeave={
                      change ? () => onHoverChange?.(undefined) : undefined
                    }
                    className={cn(
                      // A rewritten clause is warm for a moment and then cools
                      // on its own — no border, no box, so the paper still
                      // reads as paper. The padding is cancelled by the margin,
                      // so lighting a clause up never moves the page under the
                      // reader.
                      'relative -mx-3 -my-2 rounded-lg px-3 py-2 transition-colors duration-1000 ease-out',
                      settling && 'bg-primary/[0.06]',
                      active && 'bg-primary/[0.04] duration-200',
                      !settling && !active && 'bg-transparent',
                    )}
                  >
                    {change ? (
                      <span
                        aria-hidden
                        className={cn(
                          'absolute bottom-2 left-0 w-[2px] rounded-full transition-colors duration-200',
                          // Level with the clause's text, not its heading, so
                          // the bar marks the wording that moved.
                          'top-10',
                          active ? 'bg-primary' : 'bg-primary/30',
                        )}
                      />
                    ) : null}

                    <h2
                      className={
                        section.number
                          ? 'mb-2 text-lg font-semibold'
                          : 'mb-2 w-full text-center text-2xl font-semibold'
                      }
                    >
                      {section.number ? `${section.number} ` : ''}
                      {section.title}
                    </h2>

                    {change ? (
                      <div className={BODY}>
                        <RedlinedClause
                          change={change}
                          comment={renderComment?.(change)}
                        />
                      </div>
                    ) : (
                      <div
                        className={BODY}
                        dangerouslySetInnerHTML={{ __html: section.body }}
                      />
                    )}
                  </section>
                );
              })}
          </div>
        </article>
      ))}
    </>
  );
}

/** The clause with the version's edit marked in it, word by word. */
function RedlinedClause({
  change,
  comment,
}: {
  change: PaperChange;
  comment?: React.ReactNode;
}) {
  const blocks = redlineBlocks(change.previousBody, change.body);

  return (
    <>
      {blocks.map((block, blockIndex) => (
        <p key={blockIndex} className={blockIndex > 0 ? 'mt-4' : undefined}>
          {block.map((segment, index) => {
            if (segment.kind === 'deleted') {
              return (
                <del
                  key={index}
                  className="text-destructive/70 decoration-destructive/50 line-through"
                >
                  {segment.text}
                </del>
              );
            }
            if (segment.kind === 'inserted') {
              return (
                <ins
                  key={index}
                  className="text-success decoration-success/50 underline underline-offset-2"
                >
                  {segment.text}
                </ins>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
          {/* The note belongs to the whole rewrite, so it hangs off the end of
              it rather than starting a line of its own. */}
          {comment && blockIndex === blocks.length - 1 ? (
            <span className="ml-1 inline-flex translate-y-[3px]">
              {comment}
            </span>
          ) : null}
        </p>
      ))}
    </>
  );
}

/** The button that stands in for the margin when there is no room for one. */
export function ClauseCommentButton({
  active,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Why this changed"
      className={cn(
        'text-primary/70 hover:text-primary hover:bg-primary/10 focus-visible:outline-ring inline-flex size-5 cursor-pointer items-center justify-center rounded-md outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-1',
        active && 'text-primary bg-primary/10',
      )}
      {...props}
    >
      <MessageSquareText className="size-3.5" />
    </button>
  );
}

/**
 * The grey desk the pages sit on.
 *
 * When there is room, the agent's comments sit in a column beside the pages and
 * scroll with them, which is why they live inside this one scroller rather than
 * chasing it with a scroll listener.
 */
export function FirstDraftPaperScroller({
  children,
  gutter,
  pagesRef,
  scrollRef,
}: {
  children: React.ReactNode;
  gutter?: React.ReactNode;
  pagesRef?: React.Ref<HTMLDivElement>;
  scrollRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={scrollRef}
      className="bg-muted/60 h-full min-h-0 overflow-y-auto py-5"
    >
      <div className="mx-auto flex w-fit max-w-full gap-6 px-5">
        <div ref={pagesRef} className="w-[816px] min-w-0 max-w-full space-y-5">
          {children}
        </div>
        {gutter ? (
          <div className="relative w-[264px] shrink-0">{gutter}</div>
        ) : null}
      </div>
    </div>
  );
}
