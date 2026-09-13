'use client';

import { useTranslations } from 'next-intl';

/**
 * How the next few minutes go, before a word has been typed.
 *
 * This used to be two blocks in a card: a list of the fields the matter needs
 * ("What we'll need"), and these three steps. The field list is gone. It was
 * prose restating the brief panel, which lists every field with its own row the
 * moment the conversation starts, and a screen that describes its own layout in
 * words is paying twice for one idea.
 *
 * What is left is the only block on the opening screen answering a question the
 * client actually has, which is what happens after they press send. So it keeps
 * its place and loses its voice: no card, no rule, muted throughout. It is
 * reference material, not an argument.
 *
 * The name is now wider than the thing. Kept as `BriefOutline` because renaming
 * it was not part of the ask, and a file move is a worse diff to read than this
 * comment. Worth doing next time this file is opened.
 */
export function BriefOutline() {
  const t = useTranslations('intake');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs font-medium">
        {t('howItWorks.title')}
      </span>
      <ol className="text-muted-foreground flex flex-col gap-1.5 text-xs leading-relaxed">
        {['one', 'two', 'three'].map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="text-muted-foreground/60 font-mono text-[11px]">
              {index + 1}
            </span>
            {t(`howItWorks.${step}`)}
          </li>
        ))}
      </ol>
    </div>
  );
}
