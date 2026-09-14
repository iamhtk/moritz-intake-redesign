'use client';

import { useTranslations } from 'next-intl';

import { PanelRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { Button } from '@/components/design/foundations/components/button';

/**
 * The phone's way into the document panel: a button in the composer's toolbar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE OTHER HALF OF A PAIR. THE DESKTOP KEEPS ITS EDGE TAB.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `DocumentRailTrigger` is the control from `lg` up: a handle `fixed` to the
 * right edge at mid-height, on the edge the panel itself comes out of, which
 * is the right shape wherever there is an edge to spare. On a phone there is
 * not. At 390px both panes run to 16px of the window, so the tab lands on top
 * of a sentence, and the only way to stop that was a 56px gutter held open
 * down the right of both panes (`max-lg:pe-14`) — which moved the transcript
 * and the composer off-centre for the rest of the flow. A permanent layout
 * shift, paid for by a control that is pressed once.
 *
 * A button in a toolbar takes its space from the row it is in, so below `lg`
 * this is the control and the tab stands down. The caller draws the line
 * (`lg:hidden` here, `max-lg:hidden` there); neither component knows about
 * the other's breakpoint.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AND WHY THE TOOLBAR RATHER THAN THE ROW UNDER THE COMPOSER.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Both were built and compared in place. The other candidate was a quiet text
 * control beside *Talk to a person*, which reads well and can say "2
 * documents" in words rather than in a badge. The toolbar won on what is
 * already stacked under the input: the exit row, then the action bar, and a
 * third line would have made the bottom of a phone four rows of chrome under
 * the one thing the client is trying to type into. It also puts *attach a
 * document* and *open a document* next to each other, which is one subject,
 * and it is the row the client already scans for actions.
 */
export function DocumentsTrigger({
  count,
  onOpen,
  className,
}: {
  count: number;
  onOpen: () => void;
  className?: string;
}) {
  const t = useTranslations('intake.documents');

  // Nothing to open, nothing to draw. The same rule the edge tab uses: a
  // permanently visible handle onto an empty panel is a dead control.
  if (count === 0) return null;

  const label = t('railLabel', { count });

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onOpen}
      aria-label={label}
      title={label}
      className={cn('relative rounded-full', className)}
    >
      <PanelRight aria-hidden="true" />
      {/*
       * The count as a badge rather than inside the button, so the control
       * keeps the circular shape the paperclip, the mic and send all have. A
       * pill with a number in it beside three circles is one control
       * announcing itself as more important than Send.
       */}
      <span
        aria-hidden="true"
        className="bg-foreground text-background absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums leading-none"
      >
        {count > 9 ? '9+' : count}
      </span>
    </Button>
  );
}
