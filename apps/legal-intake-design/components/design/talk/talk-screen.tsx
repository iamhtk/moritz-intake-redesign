'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Send } from '@repo/ui/icons';
import { Button } from '@/components/design/foundations/components/button';
import { Card } from '@repo/ui/components/card';
import { Textarea } from '@/components/design/foundations/components/textarea';
import { HandoffCard } from '@/components/design/chat-events/handoff-card';
import { ANY_LAWYER, LawyerPicker } from './lawyer-picker';
import { Link } from '@/i18n/navigation';
import { leadForMatter } from '@/components/design/new-case/lawyers';
import type { MatterId } from '@/components/design/new-case/intake-types';
import { SUBMITTED_CASE } from '@/lib/intake/submitted-case';
import {
  addSubmittedCaseTurns,
  useSubmissions,
} from '@/lib/mocks/submitted-cases';
import {
  recordPersonMessage,
  usePersonMessages,
} from '@/lib/mocks/person-messages';
import { generateId } from '@/lib/utils';

/**
 * *Talk to a person* as its own screen.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE COLUMN, CENTRED, BECAUSE THIS IS NOT A CASE SCREEN.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The intake is two columns on purpose: the conversation on the left and the
 * brief being built on the right, so the client can watch their own case take
 * shape. None of that applies here. Nothing on this screen fills in a brief,
 * there is no case to show the state of, and a brief column alongside would be
 * a panel about work this screen is not doing — which is worse than empty, it
 * is a second thing to read at the moment the client has already decided they
 * want a human rather than more software.
 *
 * So: one column, capped and centred, and the card is the whole screen.
 *
 * **What was sent is shown back, and it is kept.** Every message appears as the
 * same `HandoffCard` the case thread uses, read out of `person-messages.ts`. A
 * confirmation that vanished on the next navigation would be the defect this
 * feature was just fixed for, one screen along: a promise that somebody reads
 * it within four hours, and the words themselves nowhere.
 *
 * **It also lands on the sent case, when there is one.** A client who has just
 * submitted and wants to speak to somebody is asking about *that* matter, and a
 * lawyer picking it up reads the case, not this screen. So the message goes to
 * both: here, because this is where the client will look for it, and onto the
 * case, because that is where it gets acted on.
 */
export function TalkScreen({ matterId }: { matterId?: MatterId }) {
  const t = useTranslations('intake.person');
  const sent = usePersonMessages();
  const submissions = useSubmissions();

  /*
   * Whether the client has actually sent a case. Read through the hook rather
   * than called in render, so the screen re-renders when a submission arrives
   * in another tab instead of showing a stale "back to your case".
   */
  const hasCase = Boolean(submissions[SUBMITTED_CASE.id]);

  /*
   * The matter's lead, marked in the picker but never chosen for them. See
   * `LawyerPicker` for why preselecting would be the old dialog's mistake with
   * an extra step.
   */
  const suggested = leadForMatter(matterId);

  const [lawyerId, setLawyerId] = useState<string>(ANY_LAWYER);
  const [text, setText] = useState('');

  const trimmed = text.trim();

  const submit = () => {
    if (trimmed === '') return;
    const at = new Date().toISOString();
    const chosen = lawyerId === ANY_LAWYER ? undefined : lawyerId;

    /*
     * Stamped with the case when there is one, which is what stops it being
     * picked up a second time by `carryPersonMessagesToCase` at a later
     * submission. The screen's own copy and the case's copy are one event.
     */
    recordPersonMessage({
      id: generateId(),
      text: trimmed,
      at,
      ...(chosen ? { lawyerId: chosen } : {}),
      ...(hasCase ? { caseId: SUBMITTED_CASE.id } : {}),
    });

    /*
     * Onto the case as well, when the client has actually sent one. A client
     * who has just submitted and wants a human is asking about *that* matter,
     * and a lawyer picking it up reads the case rather than this screen.
     */
    if (hasCase) {
      addSubmittedCaseTurns(SUBMITTED_CASE.id, [
        {
          role: 'client',
          text: trimmed,
          at,
          handoff: {
            ...(chosen ? { lawyerId: chosen } : {}),
            acknowledgement: t('acknowledgement'),
          },
        },
        { role: 'moritz', text: t('acknowledgement'), at },
      ]);
    }

    setText('');
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-foreground font-serif text-2xl tracking-tight">
          {t('screenTitle')}
        </h1>
        <p className="text-muted-foreground text-sm/6">{t('screenBody')}</p>
      </header>

      {/*
       * What has already been sent, oldest first, so the screen reads forward
       * like a thread rather than as a stack of receipts.
       */}
      {sent.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sent.map((message) => (
            <HandoffCard
              key={message.id}
              body={message.text}
              createdAt={message.at}
              {...(message.lawyerId ? { lawyerId: message.lawyerId } : {})}
              labels={{
                title: t('cardTitle'),
                promise: t('cardPromise'),
                whoUnknown: t('cardWhoUnknown'),
              }}
            />
          ))}
        </div>
      ) : null}

      {/* The compose card, centred with everything else. */}
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="talk-lawyer"
            className="text-foreground text-[13px] font-medium"
          >
            {t('picker.label')}
          </label>
          <LawyerPicker
            id="talk-lawyer"
            value={lawyerId}
            onChange={setLawyerId}
            {...(suggested ? { suggestedId: suggested.id } : {})}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="talk-message"
            className="text-foreground text-[13px] font-medium"
          >
            {t('label')}
          </label>
          <Textarea
            id="talk-message"
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('placeholder')}
          />
          {/*
           * What this costs and where it goes, beside the control that does it
           * (L17) — the same sentence the dialog carried, for the same reason.
           */}
          <p className="text-muted-foreground text-[11.5px] leading-relaxed">
            {t('cost')}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" onClick={submit} disabled={trimmed === ''}>
            {t('send')}
            <Send data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>
      </Card>

      {/*
       * The way back, and it goes to the list rather than to a case.
       *
       * It used to point at `SUBMITTED_CASE.href`, which is one specific case —
       * `/client/cases/case_009`, the single mock the intake's submission
       * stands for. That is the right destination for the confirmation
       * screen's "Go to case", where the client has just sent *that* matter and
       * is being shown where it landed. It is the wrong one here: this screen is
       * not about any one case, the message may not be about a case at all, and
       * a client who arrived from the nav had never seen case_009 in their life.
       *
       * `/client/cases` is also what makes it unconditional. The old link was
       * gated on a submission existing, because a case page for a case nobody
       * had sent would have been dead. The list is never dead — a client with
       * no cases gets the list's own empty state, which is a real answer.
       *
       * Deliberately not a link to the intake: offering "start a new case" to
       * somebody who just asked to speak to a human is answering a question
       * they did not ask.
       */}
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/client/cases">
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          {t('backToCases')}
        </Link>
      </Button>
    </div>
  );
}
