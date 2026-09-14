'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from '@repo/ui/icons';

import { Button } from '@/components/design/design-system/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCommandPalette } from './command-palette-context';
import { modKeyLabel } from '@/lib/keyboard';

/**
 * The palette's entry point in the top nav (task K6).
 *
 * §8.10 lists this as one of three things never to cut, and the reason is
 * narrow but real: **the source relies on the reviewer being told to press
 * ⌘K.** A dashboard whose best feature is invisible is a dashboard with a worse
 * best feature, and nobody discovers a keyboard shortcut by looking at a
 * screen that does not mention it.
 *
 * So it is a real control on every viewport rather than a hint on one. On
 * `sm+` it reads as a search field with the shortcut printed in it, which
 * teaches the chord to anyone who clicks instead. On phones it collapses to
 * the magnifier alone — the badge would be a lie there, but the palette is
 * not only a shortcut: it is the fastest route to any case, any person and
 * any action in the app, and on the viewport with the *least* navigation on
 * screen that is worth more, not less.
 */
export function CommandPaletteTrigger() {
  const t = useTranslations('commandPalette');
  const { openPalette } = useCommandPalette();

  /*
   * Client-only, and defaulted to the non-Mac label. Rendering "⌘" on the
   * server and correcting it on hydration is a mismatch React warns about and
   * a reader sees flicker; starting from "Ctrl" means the only correction that
   * ever happens is the one that widens the badge slightly on a Mac.
   */
  const [mod, setMod] = useState('Ctrl');
  useEffect(() => setMod(modKeyLabel()), []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          onClick={openPalette}
          aria-keyshortcuts="Meta+K Control+K"
          aria-label={t('openHint')}
          /*
           * On phones too, as an icon, matching `AskTrigger` beside it.
           *
           * It was hidden below `sm` on a width argument: four 44px targets
           * plus a breadcrumb overflow a 390px row. That was true of the row
           * as it was, and the row changed — the right cluster is `gap-1` on
           * a phone now and the left zone is a 36px hamburger and a
           * truncating label rather than a full ancestor trail. The
           * overflow it was dodging is gone, and dropping the one control
           * that reaches every case and every action was the expensive way
           * to buy 44px.
           */
          className="text-muted-foreground hover:text-foreground size-11 justify-center sm:h-9 sm:w-auto sm:justify-start sm:gap-2 sm:px-2.5"
        >
          <Search aria-hidden />
          {/* The field-like half, on sm+ only. */}
          <span className="hidden text-sm sm:inline">{t('open')}</span>
          <kbd
            aria-hidden
            className="border-border text-muted-foreground hidden rounded-md border px-1.5 py-0.5 font-sans text-xs tabular-nums sm:inline"
          >
            {mod}K
          </kbd>
        </Button>
      </TooltipTrigger>
      {/* The tooltip carries the chord too, for the pointer user who hovers
          before clicking and would otherwise never learn it. */}
      <TooltipContent side="bottom">{`${t('openHint')} (${mod}K)`}</TooltipContent>
    </Tooltip>
  );
}
