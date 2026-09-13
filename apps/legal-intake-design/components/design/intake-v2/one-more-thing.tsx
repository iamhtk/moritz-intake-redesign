'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from '@repo/ui/icons';
import { Button } from '@/components/design/foundations/components/button';
import { Textarea } from '@/components/design/foundations/components/textarea';

/**
 * The `outcome` ask, on the confirmation, once (item 7).
 *
 * See `lib/intake/one-more-thing.ts` for which asks exist and why there are
 * only two. The `document` one is not here: it is the same request the
 * post-submit dropzone already makes, so it changes that block's words rather
 * than adding a second one — two places to hand over a file is the exact shape
 * of the upload complaint this redesign removed from the start screen, and
 * reintroducing it at the other end would be the same mistake with better
 * manners.
 *
 * ## Why a box and not a question in the chat
 *
 * Moritz could ask this. The reason he does not is that the client has just
 * been told they can close the tab, and an agent that opens a new question on
 * the way out is taking that back. A block with a heading and an input is a
 * standing offer: it makes no claim on the client's attention, it is obviously
 * skippable, and it is still there if they come back to the tab in an hour.
 *
 * ## Why it disappears once answered
 *
 * The confirmation is not a form and this is not a field: it is one request,
 * and a request that has been met stops being a request. What replaces it is a
 * line saying where the answer went, which is the same promise the dropzone
 * makes about a late document and has to be kept for the same reason.
 */
export function OneMoreThing({
  onAdd,
}: {
  /** Returns the text to the page, which puts it in the chat and on the case. */
  onAdd: (text: string) => void;
}) {
  const t = useTranslations('intake.sent.oneMore.outcome');
  const inputId = useId();
  const [value, setValue] = useState('');
  const [added, setAdded] = useState(false);

  if (added) {
    return (
      <p className="text-muted-foreground flex items-start gap-2 text-[13px] leading-relaxed">
        <Check
          className="text-foreground mt-0.5 size-3.5 shrink-0"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        {t('done')}
      </p>
    );
  }

  const trimmed = value.trim();

  return (
    <form
      className="border-border flex flex-col gap-2.5 rounded-2xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed === '') return;
        onAdd(trimmed);
        setAdded(true);
      }}
    >
      <p className="text-foreground text-[13px] font-medium">{t('title')}</p>
      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {t('body')}
      </p>
      <label htmlFor={inputId} className="sr-only">
        {t('label')}
      </label>
      <Textarea
        id={inputId}
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('placeholder')}
        className="text-[13px]"
      />
      {/*
       * Disabled on empty rather than hidden, and no "skip" control beside it.
       * Skipping is closing the tab, which the sentence two blocks above has
       * already given them permission to do; a Not now button would turn an
       * offer into a decision.
       */}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={trimmed === ''}>
          {t('button')}
        </Button>
      </div>
    </form>
  );
}
