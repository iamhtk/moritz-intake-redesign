'use client';

import { useTranslations } from 'next-intl';

import { PanelRight } from '@repo/ui/icons';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * The way in: a tab on the extreme right edge of the screen.
 *
 * Pinned to the edge rather than placed in the brief, and that is the whole
 * idea. A document is not part of the brief and not part of the conversation;
 * it is the third thing, and a control at the edge of the window says "there is
 * a surface over here" in a way a button inside a column cannot. It is also the
 * edge the panel comes out of, so the control and the thing it opens are in the
 * same place.
 *
 * Only ever rendered when there is something to open. A permanently visible
 * handle that opens an empty panel would be the kind of dead control this
 * intake avoids everywhere else — and on a first visit, before any document
 * exists, the edge of the screen is better left alone.
 */
export function DocumentRailTrigger({
  count,
  onOpen,
}: {
  count: number;
  onOpen: () => void;
}) {
  const t = useTranslations('intake.documents');
  if (count === 0) return null;

  const label = t('railLabel', { count });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onOpen}
          aria-label={label}
          className="border-border bg-background/95 text-muted-foreground hover:text-foreground hover:bg-background fixed end-0 top-1/2 z-30 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-1 rounded-s-2xl border border-e-0 px-2 py-3 shadow-sm backdrop-blur transition-colors"
        >
          <PanelRight className="size-4" aria-hidden />
          <span className="text-[11px] font-medium tabular-nums">{count}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
