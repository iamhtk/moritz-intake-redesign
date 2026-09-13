'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/design/foundations/components/button';
import { Textarea } from '@/components/design/foundations/components/textarea';
import type { NoQuoteReason } from '@/lib/intake/quote';

/**
 * What the client sees when a fixed quote is not possible (G2).
 *
 * The other half of "the answer isn't yes", and the half that is about *us*
 * rather than the client. Three real reasons: the matter is not the kind of law
 * this firm does, there is nobody admitted where it sits, or the work is real
 * but genuinely not pricable up front.
 *
 * **This is a product decision, not an error state**, and that is the whole
 * design brief for it. The client has just spent ten minutes writing a brief,
 * explaining a problem that is presumably worrying them. Ending that with a red
 * box and a shrug is the worst moment in the flow to be careless with, and it
 * is also the easiest to get wrong, because "cannot quote" arrives in the code
 * looking exactly like a validation failure.
 *
 * So: no destructive colour, no alert icon, no `role="alert"`. It reads as a
 * letter. The heading is in the serif that the brief's own title uses, because
 * this is a considered answer to a considered question rather than something
 * going wrong.
 *
 * **Every reason says what is possible instead**, and `quote.test.ts` fails the
 * build if one of them does not. "We cannot help" and "we cannot help on these
 * terms" are very different sentences and only the second one is ever true: a
 * criminal matter gets two named firms and their brief forwarded, a foreign
 * jurisdiction gets an introduction, and unpricable work gets a paid first read
 * or an hourly cap the client sets. A no with a door in it is worth more to the
 * client than a yes that should not have been given.
 *
 * **The brief is not thrown away.** It stays on screen beside this, still
 * readable, still theirs. The single most valuable thing the client has
 * produced here is a written account of their matter, and it is just as useful
 * to the firm we refer them to.
 */
export function NoQuoteNotice({
  reason,
  onSend,
}: {
  reason: NoQuoteReason;
  /**
   * Hand the client's answer to the case. Same channel as everything else the
   * client says outside a model turn — it travels with the brief, which is the
   * point: whoever picks this up next should not need it explained twice.
   */
  onSend: (message: string) => void;
}) {
  const t = useTranslations('intake.quote.noQuote');
  const [reply, setReply] = useState('');
  const trimmed = reply.trim();

  return (
    <div className="border-border flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex flex-col gap-1">
        <p className="text-foreground font-serif text-[19px] leading-tight tracking-tight">
          {t('heading')}
        </p>
        <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
          {t('reasonLabel')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-foreground text-[13px] font-medium leading-relaxed">
          {t(`${reason}.title`)}
        </p>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {t(`${reason}.body`)}
        </p>
      </div>

      {/*
       * The way forward, set apart from the explanation rather than run on from
       * it. A client reading a refusal stops reading at the refusal, so the
       * thing they can actually do has to be visually separate or it is not
       * read at all. Left rule and a tint, the flow's existing treatment for a
       * block that wants attention without alarming anyone.
       */}
      <p className="border-foreground/20 bg-muted/40 text-foreground border-l-2 py-2.5 pl-3 pr-3 text-[13px] leading-relaxed">
        {t(`${reason}.instead`)}
      </p>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="no-quote-reply"
          className="text-foreground text-[13px] font-medium"
        >
          {t('talkToUs')}
        </label>
        <Textarea
          id="no-quote-reply"
          rows={3}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
        />
        <div>
          <Button
            type="button"
            disabled={trimmed === ''}
            onClick={() => {
              onSend(trimmed);
              setReply('');
            }}
          >
            {t('talkToUs')}
          </Button>
        </div>
      </div>
    </div>
  );
}
