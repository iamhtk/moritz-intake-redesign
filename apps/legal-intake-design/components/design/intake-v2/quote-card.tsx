'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/foundations/components/button';
import { Checkbox } from '@/components/design/foundations/components/checkbox';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/design/foundations/components/radio-group';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { Textarea } from '@/components/design/foundations/components/textarea';
import type { BriefField } from '@/lib/intake/brief';
import {
  needsDetail,
  scopeChoices,
  TOO_HIGH_REASONS,
  QUOTE_RESPONSES,
  type DetailedResponse,
  type QuoteResponse,
  type TooHighReason,
} from '@/lib/intake/quote';
import { joinNames } from '@/lib/intake/name-list';

/**
 * The quote, and the four things a client can do about it (G3).
 *
 * Their videos and every frame of the reference product have one control on
 * this moment: `APPROVE AND START`. It is the first decision in the whole
 * journey with money attached, and the flow has no design for the client
 * saying anything other than yes — which means the client who is not ready to
 * say yes either abandons the case or agrees to something they did not want.
 *
 * Four paths, ordered by how much the client is committing to. Accept is still
 * first and still the primary button: the default is yes, and a flow that leads
 * with "this seems high" is coaching people to haggle. The other three are the
 * ones that did not exist.
 *
 * **The one worth the effort is "this seems high".** The obvious version sends
 * that sentence and nothing else, which is a dead end for both sides: the
 * client has refused and given nobody anything to act on. So pressing it asks
 * which of four things it is, and three of them are briefs for the lawyer's
 * next move — no budget at this size, expected less for this kind of work, has
 * a cheaper quote elsewhere. The fourth ("I want to think about it") is
 * deliberately unactionable and deliberately present: without it, a client who
 * simply wants a day has to pick one of the three that misrepresents them, and
 * a misrepresented objection is worse for the lawyer than an honest silence.
 * See `isActionable`, which changes what the confirmation promises.
 *
 * **"Quote me for part of it" is where the brief pays off.** The whole intake
 * was spent itemising this matter, so a client asking for less can point at the
 * parts that already exist rather than describing a scope from nothing. The
 * options are the brief's own filled required fields (`scopeChoices`) — not a
 * hand-written menu, which would be a second competing account of the same case
 * and would go stale the moment a matter type changed its fields.
 *
 * **Everything opens inside this card** (L14). A dialog over a quote hides the
 * number the client is deciding about, which is the one thing they need in
 * front of them while they decide.
 */
/**
 * The label over the free-text box on each path.
 *
 * A map rather than a nested ternary inside `t(...)`. `copy-keys.test.ts`
 * handles one level of ternary by reading everything after the first `?`, so a
 * second condition in the branches offers `'too-high'` up as a copy key and the
 * guard fails on `intake.quote.too-high`. The guard is right and the call was
 * the thing to change.
 *
 * `approve` is absent because it never opens a panel — `needsDetail` sends it
 * straight out, so this is only ever indexed by the other three.
 */
/**
 * How the structured part and the free text are joined into one sentence.
 *
 * A full stop, not an em dash, and that is the repo's dash rule (D) rather
 * than a preference. `no-dashes.test.ts` enforces it over `en.json` and
 * `stripDashes` enforces it over everything a model returns, and neither can
 * see this: the string is composed here at runtime and then becomes a client
 * turn on the transcript, which is copied onto the case and read by a lawyer.
 * Same rule, same reason, one of the few places nothing automatic is watching.
 */
const JOIN = '. ';

const DETAIL_LABEL: Record<DetailedResponse, string> = {
  question: 'questionDetail',
  'too-high': 'tooHighDetail',
  'part-only': 'partDetail',
};

export function QuoteCard({
  fee,
  currency,
  covers,
  expires,
  lawyerFirstName,
  fields,
  accepted,
  onRespond,
}: {
  /** The figure. See the note in `intake-v2.tsx` on where this comes from. */
  fee: number;
  currency: string;
  /** What the quote covers, in the client's own brief's words. */
  covers: string;
  /** How long the price is held, already formatted. */
  expires: string;
  lawyerFirstName: string;
  /** The brief, for the scope options on the part-only path. */
  fields: readonly BriefField[];
  /**
   * Whether the client has already accepted this quote (item 46).
   *
   * Held by the caller rather than here, so it survives this card unmounting
   * and so the component that owns the stage is the one that knows what the
   * client has committed to. When it is true the four responses are gone
   * entirely rather than disabled: the decision has been made, and leaving four
   * greyed-out controls on screen invites the client to wonder whether it took.
   */
  accepted: boolean;
  /**
   * Hand the client's answer to the case.
   *
   * One callback for all four paths, carrying the sentence that should reach
   * the lawyer. The caller owns it for the same reason `TalkToAPerson`'s does:
   * appending to the transcript is the conversation hook's job, and that
   * transcript is what travels onto the case.
   */
  onRespond: (response: QuoteResponse, message: string) => void;
}) {
  const t = useTranslations('intake.quote');

  /**
   * Which path is open, or `null` while the four are being chosen.
   *
   * Cannot be `approve`: that path sends on the click, so there is no panel for
   * it to open. `needsDetail` is the type guard that keeps it out.
   */
  const [open, setOpen] = useState<DetailedResponse | null>(null);
  const [detail, setDetail] = useState('');
  const [reason, setReason] = useState<TooHighReason | null>(null);
  const [parts, setParts] = useState<string[]>([]);

  const scope = scopeChoices(fields);

  const money = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(fee);

  const reset = () => {
    setOpen(null);
    setDetail('');
    setReason(null);
    setParts([]);
  };

  /*
   * Whether the open path has enough to send.
   *
   * Each path is disabled until it carries something a person can read. An
   * empty "I have a question" spends a round trip on both sides and tells the
   * lawyer only that the client hesitated, which they can already see.
   */
  const ready =
    (open === 'question' && detail.trim() !== '') ||
    (open === 'too-high' && reason !== null) ||
    (open === 'part-only' && parts.length > 0);

  const send = () => {
    if (open === null || !ready) return;

    /*
     * The sentence that reaches the lawyer, composed from what the client
     * actually chose rather than from a template with a blank in it. The
     * structured part carries the meaning and the free text carries the rest,
     * which is why the structured part is required and the free text is not.
     */
    const message =
      open === 'too-high'
        ? [t(`tooHigh.${reason}`), detail.trim()].filter(Boolean).join(JOIN)
        : open === 'part-only'
          ? [
              joinNames(
                parts.map(
                  (key) => scope.find((one) => one.key === key)?.label ?? key,
                ),
              ),
              detail.trim(),
            ]
              .filter(Boolean)
              .join(JOIN)
          : detail.trim();

    onRespond(open, message);
    reset();
  };

  return (
    <div className="border-border flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex flex-col gap-1">
        <p className="text-foreground font-serif text-[19px] leading-tight tracking-tight">
          {t(accepted ? 'accepted.heading' : 'arrivedHeading')}
        </p>
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {t(accepted ? 'accepted.body' : 'arrivedBody', {
            name: lawyerFirstName,
          })}
        </p>
      </div>

      {/*
       * The number and its terms as a spec table, the same treatment the
       * confirmation gives the reference and the status (V6). A price in a big
       * display figure is a pricing page; a price in the row above "Hold until"
       * is a term of business, which is what this is.
       */}
      <DescriptionList>
        <DescriptionTerm className="border-t-0 sm:border-t-0">
          {t('fee')}
        </DescriptionTerm>
        <DescriptionDetails className="text-foreground font-medium sm:border-t-0">
          {money}
        </DescriptionDetails>
        <DescriptionTerm>{t('covers')}</DescriptionTerm>
        <DescriptionDetails>{covers}</DescriptionDetails>
        <DescriptionTerm>{t('expires')}</DescriptionTerm>
        <DescriptionDetails>{expires}</DescriptionDetails>
      </DescriptionList>

      {/*
       * Says the figure is the prototype's, not a price anyone has been quoted.
       *
       * The flow deliberately shows no price in a real run — the real quote is
       * written by a person after submission, so any number the prototype
       * invented would be a commitment nobody made. This screen exists to design
       * the *response*, which needs a number on it to be a real decision, so the
       * number comes from this app's own case fixtures and says so. Leaving it
       * unmarked would be the one place in the submission where a made-up figure
       * sat on screen looking like a quote.
       */}
      <p className="text-muted-foreground text-[11px] leading-relaxed">
        {t('exampleNote')}
      </p>

      {accepted ? (
        /*
         * What accepting actually bought, and the one step still outstanding.
         *
         * Garzai: "Customer get a link with quota in the intake chat, they pay
         * it there." Payment is out of scope in this prototype, so the control
         * is here, disabled, and says so — rather than being absent, which
         * would leave the client's last screen claiming a lawyer comes next
         * when what actually comes next is a card payment. A flow that hides
         * its commercial step is the thing this whole screen was added to fix.
         */
        <div className="flex flex-col gap-2">
          <Button type="button" className="w-full" disabled>
            {t('accepted.payAction', { fee: money })}
          </Button>
          <p className="text-muted-foreground text-[11.5px] leading-relaxed">
            {t('accepted.payNote')}
          </p>
        </div>
      ) : open === null ? (
        <div className="flex flex-col gap-2">
          {QUOTE_RESPONSES.map((response) => (
            <Button
              key={response}
              type="button"
              /*
               * Accept is solid, the rest are outlines. The default is yes, and
               * four equally weighted buttons would read as the flow being
               * neutral about whether the client should buy — which would be a
               * strange thing for it to be.
               */
              variant={response === 'approve' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => {
                if (needsDetail(response)) {
                  setOpen(response);
                  return;
                }
                onRespond(response, '');
              }}
            >
              {response === 'approve' ? (
                <Check data-icon="inline-start" aria-hidden="true" />
              ) : null}
              {t(`response.${response}`)}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/*
           * What this path costs and where it goes, in the same breath as the
           * control (L17). Each one answers a different question: whether the
           * hold survives, what the four options are for, and what re-quoting
           * actually means.
           */}
          <p className="text-muted-foreground text-[11.5px] leading-relaxed">
            {t(`responseHint.${open}`)}
          </p>

          {open === 'too-high' ? (
            /*
             * The foundation `RadioGroup`, not a raw `<input type="radio">`
             * (T28). The raw one was a shortcut and it costs the roving-focus
             * arrow-key behaviour the primitive gives a radio group for free,
             * which is the whole reason a radio group is not four checkboxes.
             */
            <RadioGroup
              value={reason ?? ''}
              onValueChange={(next) => setReason(next as TooHighReason)}
              aria-label={t('response.too-high')}
              className="gap-1.5"
            >
              {TOO_HIGH_REASONS.map((one) => (
                <label
                  key={one}
                  htmlFor={`too-high-${one}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-[0.5rem] px-2 py-1.5 text-[13px] leading-relaxed transition-colors',
                    reason === one ? 'bg-muted' : 'hover:bg-muted/50',
                  )}
                >
                  <RadioGroupItem
                    id={`too-high-${one}`}
                    value={one}
                    className="mt-0.5"
                  />
                  {t(`tooHigh.${one}`)}
                </label>
              ))}
            </RadioGroup>
          ) : null}

          {open === 'part-only' ? (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="sr-only">{t('response.part-only')}</legend>
              {scope.map((one) => (
                <label
                  key={one.key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[0.5rem] px-2 py-1.5 text-[13px]"
                >
                  <Checkbox
                    checked={parts.includes(one.key)}
                    onCheckedChange={(checked) =>
                      setParts((current) =>
                        checked
                          ? [...current, one.key]
                          : current.filter((key) => key !== one.key),
                      )
                    }
                  />
                  {one.label}
                </label>
              ))}
              {scope.length === 0 ? (
                <p className="text-muted-foreground text-[13px]">
                  {t('partNone')}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="quote-detail"
              className="text-foreground text-[13px] font-medium"
            >
              {t(DETAIL_LABEL[open])}
            </label>
            <Textarea
              id="quote-detail"
              rows={3}
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={send} disabled={!ready}>
              {t('send')}
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              {t('back')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
