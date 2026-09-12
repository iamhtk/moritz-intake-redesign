'use client';

import { useTranslations } from 'next-intl';
import type { BriefField } from '@/lib/intake/brief';

/**
 * The empty brief, before a word has been typed.
 *
 * Decision 18 asks for "a faint outline of the empty brief listing what this
 * matter needs", and an outline is what this is. The working panel, with a row
 * per field carrying a value, a confidence reading, a source line and a state,
 * says a great deal about nothing at all while the brief is still empty, and it
 * pushed the whole opening screen off a 14in laptop.
 *
 * So: the names of the things Moritz will ask for, and how the next few minutes
 * go. The full panel takes over the moment there is something to put in it.
 */
export function BriefOutline({ fields }: { fields: BriefField[] }) {
  const t = useTranslations('intake');
  const required = fields.filter((field) => field.required);
  const optional = fields.filter((field) => !field.required);

  return (
    <div className="border-border flex flex-col gap-5 rounded-lg border p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground/80 text-xs font-medium">
          {t('outline.title')}
        </h2>
        <p className="text-foreground text-sm leading-relaxed">
          {required.map((field) => field.label).join(' · ')}
        </p>
        {optional.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            {t('outline.optionalNote', {
              fields: optional.map((field) => field.label).join(', '),
            })}
          </p>
        ) : null}
      </div>

      <div className="border-border flex flex-col gap-2 border-t pt-5">
        <span className="text-foreground/80 text-xs font-medium">
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
    </div>
  );
}
