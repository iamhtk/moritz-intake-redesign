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
 * So it is a real control on two viewports rather than a hint on one. On `sm+`
 * it reads as a search field with the shortcut printed in it, which teaches the
 * chord to anyone who clicks instead. On phones — where there is no ⌘ to press
 * and no room for the badge — it collapses to the magnifier alone, which is
 * still a way in.
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
           * Hidden on phones, deliberately.
           *
           * The right cluster already carries the bell and the account menu,
           * and Ask's trigger now sits there too; a fourth 44px target pushes
           * the row past 390px and starts squeezing the breadcrumb, which is
           * the overflow T35 tested for. The palette is a *keyboard*
           * accelerator and there is no ⌘ to press on a phone, so it is the
           * right one of the four to drop — navigation on small screens is
           * already served by `TopNavMobileNav`'s drawer, and Ask, which is a
           * real feature rather than a shortcut, stays tappable.
           */
          className="text-muted-foreground hover:text-foreground hidden justify-center sm:inline-flex sm:h-9 sm:w-auto sm:justify-start sm:gap-2 sm:px-2.5"
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
