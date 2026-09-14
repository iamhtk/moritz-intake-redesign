'use client';

import { useTranslations } from 'next-intl';
import { Compass } from '@repo/ui/icons';

import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTourControls } from './tour-context';
import { TOUR_TRIGGER_ATTR } from './use-tour';

/**
 * The tour's one entry point: a named button beside Ask Nora.
 *
 * Named, not a bare glyph, for the reason Ask's own trigger is named — a
 * reviewer has to find it without being told, and an icon beside a labelled
 * control reads as decoration. Same shape as `AskTrigger` so the two read as
 * a pair: ghost, muted until hover, glyph plus a text label from `sm` up.
 *
 * Hidden below `sm` altogether rather than reduced to an icon. The tour points
 * at a two-column layout; on a phone the rail is a bar and the brief is a
 * sheet, so half its targets are not on screen and it would stop halfway. A
 * control that starts something that cannot finish is worse than none.
 *
 * Never auto-starts. The tour is offered, not imposed; a popover on first
 * load is the one onboarding pattern everyone recognises and nobody likes.
 */
export function TourButton() {
  const t = useTranslations('tour');
  const { start, running } = useTourControls();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          onClick={start}
          aria-label={t('openHint')}
          aria-pressed={running}
          {...{ [TOUR_TRIGGER_ATTR]: '' }}
          className="text-muted-foreground hover:text-foreground hidden h-9 items-center gap-2 px-2.5 sm:inline-flex"
        >
          <Compass aria-hidden />
          <span className="text-sm">{t('open')}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('openHint')}</TooltipContent>
    </Tooltip>
  );
}
