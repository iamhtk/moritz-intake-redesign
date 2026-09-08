'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  List,
  Search,
  User2,
  X,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/foundations/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import { Input } from '@/components/design/foundations/components/input';
import type { CitationSource } from '../types';

interface DocumentBlock {
  id: string;
  type: 'heading' | 'paragraph';
  text: string;
}

/**
 * A numbered section title is short; a numbered line that runs long is a
 * sub-clause, so it reads as body prose rather than a heading.
 */
const HEADING_MAX_LENGTH = 80;

/** Ignore one-off keystrokes so a single letter doesn't light up the document. */
const MIN_QUERY_LENGTH = 2;

const isHeadingLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > HEADING_MAX_LENGTH) return false;
  return (
    /^[A-Za-z ]*(Section|Clause)\s+\d+(\.\d+)*[:.)-]?\s/i.test(trimmed) ||
    /^\d+(\.\d+)*[:.)-]?\s+\S/.test(trimmed)
  );
};

/**
 * Splits the document into headings and paragraphs on blank lines, the way the
 * source viewer does — the text arrives as a flat extract, so its own numbering
 * is the only structure available.
 */
const deriveBlocks = (text: string): DocumentBlock[] => {
  const blocks: DocumentBlock[] = [];
  let buffer: string[] = [];

  const flushParagraph = (): void => {
    const paragraph = buffer.join('\n').trim();
    buffer = [];
    if (!paragraph) return;
    blocks.push({
      id: `blk-${blocks.length}`,
      type: 'paragraph',
      text: paragraph,
    });
  };

  text.split('\n').forEach((line) => {
    if (isHeadingLine(line)) {
      flushParagraph();
      blocks.push({
        id: `blk-${blocks.length}`,
        type: 'heading',
        text: line.trim(),
      });
      return;
    }
    if (!line.trim()) flushParagraph();
    else buffer.push(line);
  });
  flushParagraph();

  return blocks;
};

/** Every occurrence of `needle` in `haystack`, case-insensitively. */
const findOccurrences = (
  haystack: string,
  needle: string,
): { start: number; end: number }[] => {
  if (!needle) return [];

  const found: { start: number; end: number }[] = [];
  const lowerHaystack = haystack.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let from = 0;

  for (;;) {
    const at = lowerHaystack.indexOf(lowerNeedle, from);
    if (at === -1) return found;
    found.push({ start: at, end: at + needle.length });
    from = at + needle.length;
  }
};

type HighlightKind = 'citation' | 'match' | 'active-match';

interface Segment {
  text: string;
  kind: HighlightKind | null;
}

const highlightClasses: Record<HighlightKind, string> = {
  // The source viewer's own jump highlight, kept literal: no token in the
  // palette carries this light blue, and it is what marks a followed citation.
  citation: 'bg-[#add8e6]',
  match: 'bg-amber-200',
  'active-match': 'bg-amber-400',
};

/**
 * Cuts a block's text into rendered runs. Ranges are applied in order and any
 * that overlaps an earlier one is dropped, so a search hit sitting inside the
 * cited passage wins without splitting the passage in two.
 */
const toSegments = (
  text: string,
  ranges: { start: number; end: number; kind: HighlightKind }[],
): Segment[] => {
  const ordered = [...ranges].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  ordered.forEach((range) => {
    if (range.start < cursor) return;
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), kind: null });
    }
    segments.push({
      text: text.slice(range.start, range.end),
      kind: range.kind,
    });
    cursor = range.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), kind: null });
  }

  return segments;
};

/**
 * Read-only source document view for the right drawer, opened from a citation.
 *
 * Ported from the source app's document viewer: a metadata strip, a clause jump
 * and document actions, find-in-document, then the document itself as a page on
 * a recessed canvas. The cited passage is highlighted and scrolled to on open —
 * that is the whole point of following a citation.
 */
export function SourceDocumentPreview({ source }: { source: CitationSource }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);

  const blocks = useMemo(
    () => deriveBlocks(source.documentText),
    [source.documentText],
  );

  const headings = useMemo(
    () => blocks.filter((block) => block.type === 'heading'),
    [blocks],
  );

  /** The cited passage, located once so it can be highlighted in place. */
  const citation = useMemo(() => {
    const needle = source.snippet.trim();
    for (const block of blocks) {
      const [first] = findOccurrences(block.text, needle);
      if (first) return { blockId: block.id, ...first };
    }
    return null;
  }, [blocks, source.snippet]);

  /** Search hits in document order, so next/previous can walk them. */
  const matches = useMemo(() => {
    const needle = query.trim();
    if (needle.length < MIN_QUERY_LENGTH) return [];
    return blocks.flatMap((block) =>
      findOccurrences(block.text, needle).map((range) => ({
        blockId: block.id,
        ...range,
      })),
    );
  }, [blocks, query]);

  const scrollTo = useCallback((selector: string, smooth: boolean): void => {
    scrollRef.current?.querySelector(selector)?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'center',
    });
  }, []);

  // Land on the cited passage as the drawer opens, rather than at page one.
  useEffect(() => {
    scrollTo('[data-citation]', false);
  }, [scrollTo, source]);

  useEffect(() => {
    if (matches.length > 0) scrollTo('[data-active-match]', true);
  }, [scrollTo, matches, activeMatch]);

  const stepMatch = (delta: number): void => {
    if (matches.length === 0) return;
    setActiveMatch(
      (current) => (current + delta + matches.length) % matches.length,
    );
  };

  const downloadDocument = (): void => {
    const url = URL.createObjectURL(
      new Blob([source.documentText], { type: 'text/plain' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${source.documentName.replace(/\.[^.]+$/, '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const modified = source.documentLastModified
    ? new Date(source.documentLastModified).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="bg-dt-bg-primary flex h-full flex-col">
      <div className="text-dt-fg-secondary flex gap-2.5 px-4 py-1 text-xs">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-4" aria-hidden />
          <span className="pt-0.5">{modified}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User2 className="size-4" aria-hidden />
          <span className="pt-0.5">{source.documentAuthor ?? 'Unknown'}</span>
        </div>
      </div>

      <div className="flex justify-between px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Jump to clause
              <List className="size-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-auto">
            {headings.map((heading) => (
              <DropdownMenuItem
                key={heading.id}
                onSelect={() =>
                  scrollTo(`[data-block-id="${heading.id}"]`, true)
                }
              >
                {heading.text}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={downloadDocument}>
          Download
          <Download className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="relative mb-4 px-4">
        <Input
          type="search"
          value={query}
          placeholder="Find in document"
          aria-label="Find in document"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveMatch(0);
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            stepMatch(event.shiftKey ? -1 : 1);
          }}
          className="[&>input]:pe-28 [&>input]:ps-9"
        />
        <Search
          className="text-dt-fg-primary pointer-events-none absolute start-7 top-1/2 size-4 -translate-y-1/2"
          aria-hidden
        />
        <div className="absolute end-5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {query.trim().length >= MIN_QUERY_LENGTH && (
            <span
              aria-live="polite"
              className="text-dt-fg-tertiary pe-1 text-xs tabular-nums"
            >
              {matches.length === 0 ? 0 : activeMatch + 1}/{matches.length}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label="Next match"
            disabled={matches.length === 0}
            onClick={() => stepMatch(1)}
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label="Previous match"
            disabled={matches.length === 0}
            onClick={() => stepMatch(-1)}
          >
            <ChevronUp className="size-3.5" aria-hidden />
          </Button>
          <div className="bg-dt-line-secondary h-5 w-px" />
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label="Clear search"
            disabled={query === ''}
            onClick={() => {
              setQuery('');
              setActiveMatch(0);
            }}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="bg-dt-bg-tertiary relative flex-1 overflow-y-auto"
      >
        <div className="p-4">
          <div className="bg-dt-bg-primary border-dt-line-tertiary min-h-[720px] border">
            {/* Blocks are spaced rather than run together: the extract's own
                blank lines are what separate clauses on the page. */}
            <div className="space-y-3 whitespace-pre-wrap p-4 text-xs leading-relaxed">
              {blocks.map((block) => {
                const ranges: {
                  start: number;
                  end: number;
                  kind: HighlightKind;
                }[] = [];

                matches.forEach((match, index) => {
                  if (match.blockId !== block.id) return;
                  ranges.push({
                    start: match.start,
                    end: match.end,
                    kind: index === activeMatch ? 'active-match' : 'match',
                  });
                });

                if (citation?.blockId === block.id) {
                  ranges.push({
                    start: citation.start,
                    end: citation.end,
                    kind: 'citation',
                  });
                }

                return (
                  <div
                    key={block.id}
                    data-block-id={block.id}
                    className={
                      block.type === 'heading'
                        ? 'text-dt-fg-primary font-semibold'
                        : 'text-dt-fg-secondary'
                    }
                  >
                    {toSegments(block.text, ranges).map((segment, index) =>
                      segment.kind === null ? (
                        segment.text
                      ) : (
                        <mark
                          key={index}
                          data-citation={
                            segment.kind === 'citation' ? '' : undefined
                          }
                          data-active-match={
                            segment.kind === 'active-match' ? '' : undefined
                          }
                          className={cn(
                            'text-dt-fg-primary',
                            highlightClasses[segment.kind],
                          )}
                        >
                          {segment.text}
                        </mark>
                      ),
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SourceDocumentPreview;
