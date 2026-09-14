'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles } from '@repo/ui/icons';

import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAsk } from './ask-context';
import { matchesModShortcut, modKeyLabel } from '@/lib/keyboard';

/**
 * Ask's entry point in the top nav, and the ⌘J binding (task N9).
 *
 * Sits beside `NotificationMenu`, per decision 2. Named — *Ask Nora* — which is
 * the visible half of D2: the name appears at the entry points and on the
 * panel, and nowhere else. Inline AI hints, the extraction call and the intake
 * agent stay anonymous, matching the source repo's own commit `daf0358`
 * ("Name Nora at Ask entry points and keep inline AI surfaces anonymous"). No
 * existing surface was renamed.
 *
 * The chord is bound here rather than in the panel because the panel is a
 * `Sheet` that only exists while open, and a shortcut that only works once the
 * thing it opens is already open is not a shortcut. The trigger is always
 * mounted, so this is where a global binding belongs.
 */
export function AskTrigger() {
  const t = useTranslations('ask');
  const { open, setOpen } = useAsk();

  const [mod, setMod] = useState('Ctrl');
  useEffect(() => setMod(modKeyLabel()), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // `open` is passed as the within-overlay flag so ⌘J can close the panel
      // from inside it, rather than the panel's own presence suppressing the
      // chord that dismisses it.
      if (!matchesModShortcut(event, 'j', open)) return;
      event.preventDefault();
      setOpen(!open);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, setOpen]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-keyshortcuts="Meta+J Control+J"
          aria-label={t('openHint')}
          aria-expanded={open}
          className="text-muted-foreground hover:text-foreground size-11 justify-center sm:h-9 sm:w-auto sm:justify-start sm:gap-2 sm:px-2.5"
        >
          <Sparkles aria-hidden />
          {/* The name is the point, so it is text on sm+ rather than a glyph
              with the name hidden in a tooltip. */}
          <span className="hidden text-sm sm:inline">{t('open')}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{`${t('open')} (${mod}J)`}</TooltipContent>
    </Tooltip>
  );
}
