'use client';

import { PanelRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMounted } from '@/components/formatted-date';

/**
 * The pieces every case's top bar is built from — client, lawyer and admin
 * alike. Shared so the top of a case holds still when the reader or the view
 * changes underneath it.
 */

/**
 * The bar that runs the top of a case, bleeding to the frame and blurring the
 * content that scrolls under it. The conversation's header and the draft's
 * toolbar both wear it.
 */
export const caseTopBar =
  'bg-background/80 supports-[backdrop-filter]:bg-background/68 relative z-20 -mx-4 -mt-6 flex h-14 shrink-0 items-center gap-3 px-4 backdrop-blur-[8px] backdrop-saturate-[1.25] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8';

/**
 * The case details rail's handle. It travels with whatever is running the top
 * of the case — the header on the conversation, the draft's own toolbar once
 * the header steps aside for it.
 */
export function CasePanelToggle({
  isPanelOpen,
  onTogglePanel,
}: {
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={onTogglePanel}
            aria-expanded={isPanelOpen}
            aria-controls="case-details-panel"
            aria-label={isPanelOpen ? 'Hide details' : 'View details'}
          >
            <PanelRight aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isPanelOpen ? 'Hide details' : 'View details'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const RELATIVE_THRESHOLDS: {
  limit: number;
  unit: Intl.RelativeTimeFormatUnit;
  ms: number;
}[] = [
  { limit: 60, unit: 'second', ms: 1000 },
  { limit: 60 * 60, unit: 'minute', ms: 1000 * 60 },
  { limit: 60 * 60 * 24, unit: 'hour', ms: 1000 * 60 * 60 },
  { limit: 60 * 60 * 24 * 30, unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { limit: 60 * 60 * 24 * 365, unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { limit: Infinity, unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
];

function formatRelative(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const seconds = Math.max(0, Math.round(diffMs / 1000));
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  for (const { limit, unit, ms } of RELATIVE_THRESHOLDS) {
    if (seconds < limit) {
      return rtf.format(-Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(
    -Math.round(diffMs / RELATIVE_THRESHOLDS.at(-1)!.ms),
    'year',
  );
}

/**
 * "Updated X ago" — relative times depend on the current clock, so render only
 * after mount to avoid an SSR/CSR hydration mismatch.
 */
export function RelativeUpdatedAt({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  const isMounted = useIsMounted();
  if (!isMounted) return null;
  return (
    <span
      className={cn('text-muted-foreground shrink-0 text-xs', className)}
      suppressHydrationWarning
    >
      Updated {formatRelative(date)}
    </span>
  );
}
