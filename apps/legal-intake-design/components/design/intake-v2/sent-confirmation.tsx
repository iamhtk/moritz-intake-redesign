'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Plus } from '@repo/ui/icons';
import { Button } from '@/components/design/foundations/components/button';
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from '@/components/design/foundations/components/description-list';
import { LawyerShowcase } from '@/components/design/new-case/lawyer-showcase';
import { showcaseForMatter } from '@/components/design/new-case/lawyers';
import { ADDITIONAL_TEAM_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';
import { schoolsOf } from '@/lib/intake/credentials';
import { joinNames } from '@/lib/intake/name-list';
import { documentDisagreements, type Brief } from '@/lib/intake/brief';
import type { MatterId } from '@/components/design/new-case/intake-types';
import { ConfirmationEmailTrigger } from './confirmation-email';
import { PostSubmitDropzone, type AddedDocument } from './post-submit-dropzone';
import { CaseProgress } from './case-progress';
import { hasCaseProgress } from '@/lib/intake/case-stages';
import { oneMoreThing } from '@/lib/intake/one-more-thing';
import { OneMoreThing } from './one-more-thing';
import type { IntakePhase } from '@/lib/intake/phase';
import { SUBMITTED_CASE } from '@/lib/intake/submitted-case';

/**
 * The confirmation, in the brief rather than in the chat (Decision 8).
 *
 * `case-submitted-card.tsx` was already the right object — the check treatment,
 * the description list, the real headshots, the turnaround estimate — and the
 * instruction was to relocate its contents, not rebuild them. So the showcase
 * is literally the same component, and the copy pattern is the same pattern.
 *
 * What is different is where it lives and what it says. In the old flow this
 * was a card inside the transcript, which made the submitted case a chat
 * message; here the brief the client has been building *becomes* the submitted
 * thing, with its name, its reference and its status. And it now says what the
 * old card never did: what the quote covers, when it arrives, and that it turns
 * up in this chat (Decision 7).
 *
 * The Slack and enterprise branches are gone. Garzai said Slack is
 * enterprise-only and enterprise never sees intake, so a client path that
 * checks for it is dead weight.
 *
 * Two things on this screen exist to stop it being the end of anything
 * (Decisions 22 and 24): the email is a receipt that survives the tab closing,
 * and the drop target keeps the channel open for the documents clients send
 * after submitting, which they do, and which previously went nowhere.
 */
export function SentConfirmation({
  brief,
  phase,
  matterId,
  addedDocuments,
  onAttachDocument,
  onOpenDocument,
  onOpenEmail,
  onStartAnother,
  documentCount,
  onAddOutcome,
}: {
  brief: Brief;
  /** Drives the pipeline rail. See `case-stages.ts`. */
  phase: IntakePhase;
  /** Resolved from the brief's matter-type field, not `brief.matterId` (item 13). */
  matterId: MatterId | undefined;
  /** Documents handed over since the case was sent (Decision 24). */
  addedDocuments: readonly AddedDocument[];
  onAttachDocument: (files: File[]) => void;
  /** Opens a document handed over after the case was sent. */
  onOpenDocument: (name: string) => void;
  /** Puts the confirmation email in the document panel, as a tab. */
  onOpenEmail: (document: {
    id: string;
    name: string;
    meta: readonly (readonly [string, string])[];
    body: React.ReactNode;
  }) => void;
  /**
   * Back to an empty intake, without a page reload.
   *
   * Garzai's existing card has two buttons and this was the missing one. It
   * matters more than a second route usually would, because the sidebar's "New
   * case" points at the route the client is already on, so the component never
   * remounts: without this the confirmation is a dead end with no way out.
   */
  onStartAnother: () => void;
  /**
   * How many documents the case has, counted where they are actually known.
   *
   * Passed in rather than taken off `addedDocuments`, which only holds the ones
   * sent *since* submission, and rather than counted off the brief, which only
   * records a document that produced a field. See `one-more-thing.ts`.
   */
  documentCount: number;
  /** The `outcome` answer, added after submission (item 7). */
  onAddOutcome: (text: string) => void;
}) {
  const t = useTranslations('intake.sent');
  /**
   * Move focus to the heading when the case has gone.
   *
   * Pressing Send destroys the button that had focus, so focus falls to
   * `<body>` and the next Tab restarts at the top of the page. For a client
   * using a screen reader that is the first complaint — not knowing the case
   * was submitted — reintroduced by the screen built to answer it. The
   * `role="status"` line below is what gets *read*; this is what makes the
   * keyboard land somewhere sensible afterwards.
   */
  const headingRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  /**
   * Whether the announcement below has been filled in yet.
   *
   * This exists because of how live regions actually behave rather than how
   * they read in source. A `role="status"` that already contains its text when
   * it is inserted into the document is, in most screen readers, not announced
   * at all: the region has to exist first and then *change*. This whole screen
   * mounts in one go at the moment of submission, so the obvious version —
   * text straight into the region — is a live region that reliably says
   * nothing, which is worse than none because it reads as handled.
   *
   * So the region mounts empty and the sentence arrives a tick later. One
   * render's delay, and it is the difference between complaint one being fixed
   * for a client using a screen reader and only appearing to be.
   */
  const [announced, setAnnounced] = useState(false);
  useEffect(() => {
    setAnnounced(true);
  }, []);
  const disagreements = documentDisagreements(brief);
  /*
   * The same set the showcase below renders, so the row and the faces cannot
   * disagree about who is on this bench. `showcaseForMatter` first, then the
   * additional team, exactly as `LawyerShowcase` composes it.
   */
  const schools = schoolsOf([
    ...showcaseForMatter(matterId),
    ...ADDITIONAL_TEAM_LAWYERS,
  ]);

  /**
   * The one request worth making of a client whose case has already gone, or
   * `null`. See `one-more-thing.ts` for the two candidates and the argument.
   *
   * Counted including the documents handed over since submission, so a client
   * who reads "we do not have the agreement" and drops it in stops being asked
   * for it — the block that made the request is the block that satisfies it.
   */
  const ask = oneMoreThing(brief, documentCount + addedDocuments.length);

  return (
    <div className="mz-animate-step flex flex-col gap-6">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="border-border text-foreground mz-animate-reveal flex size-8 shrink-0 items-center justify-center rounded-full border"
        >
          <Check
            className="mz-animate-draw size-4 [--mz-draw:88]"
            strokeWidth={1.75}
          />
        </span>
        <p
          ref={headingRef}
          tabIndex={-1}
          className="text-foreground text-sm font-medium focus-visible:outline-none"
        >
          {t('heading')}
        </p>
      </div>

      {/*
       * The announcement, separate from the heading it duplicates.
       *
       * A `role="status"` wrapped round the whole confirmation would re-read a
       * description list, an email receipt and nine lawyers over whatever the
       * client was listening to. One sentence carrying the three facts that
       * answer "did that work" — it went, here is its reference, here is what
       * arrives next — is the announcement; everything below it is there to be
       * read at leisure.
       */}
      <p role="status" className="sr-only">
        {announced
          ? t('announce', { reference: SUBMITTED_CASE.reference })
          : ''}
      </p>

      <DescriptionList>
        <DescriptionTerm className="border-t-0 sm:border-t-0">
          {t('reference')}
        </DescriptionTerm>
        <DescriptionDetails className="font-mono text-[13px] sm:border-t-0">
          {SUBMITTED_CASE.reference}
        </DescriptionDetails>
        <DescriptionTerm>{t('status')}</DescriptionTerm>
        <DescriptionDetails>{t('statusValue')}</DescriptionDetails>
        <DescriptionTerm>{t('estimatedResponse')}</DescriptionTerm>
        <DescriptionDetails>{t('estimatedResponseValue')}</DescriptionDetails>
        {/*
         * The credential, as a row in a table rather than a claim on a banner
         * (V6, L10).
         *
         * It sits in the description list on purpose. "Harvard-educated
         * attorney" set in a badge under a headshot is a boast; the same words
         * in the same typeface as Reference and Status are a specification, and
         * a specification is a thing a client can hold you to. The row a
         * reviewer would skim past is exactly where a trust claim earns its
         * keep.
         *
         * Derived from the roster's own `education` lines rather than written,
         * which is what makes it checkable — see `lib/intake/credentials.ts`,
         * and the test there that fails if any lawyer's line stops resolving.
         * It names three schools and then *says how many it left out* rather
         * than trailing off (L10): "or one of 4 other schools" is a smaller
         * claim than three names and a silent truncation, and it is the only
         * version the client can tell is complete.
         *
         * Says "a qualified lawyer", never a name. Nobody is assigned until the
         * quote is accepted, and this row is two lines above the one that says
         * so.
         */}
        <DescriptionTerm>{t('reviewer')}</DescriptionTerm>
        <DescriptionDetails>
          {t('reviewerValue', {
            schools: joinNames(schools.named),
            more: schools.more,
          })}
        </DescriptionDetails>
        {/*
         * There was a "Next step" row here, and the rail below replaced it
         * rather than joining it.
         *
         * It read: "One of our lawyers reads this and prices the work, then
         * sends you a fixed quote. Nobody is assigned to the case until you
         * have accepted it." Every clause of that is now a row on the rail,
         * in order, with the drafting work named underneath — so keeping both
         * meant saying the same thing twice and paying 100px for the worse
         * version, which is what pushed the better one's most useful sentence
         * behind the sticky footer. The duplication was invisible while the
         * rail was: it only became a choice once the two were adjacent.
         *
         * The claim itself is not lost. "Nobody is assigned until you accept"
         * survives as the ordering of `paid` before `lawyer`, which is a
         * stronger way to say it than a sentence, because the client can see
         * the two steps and which one comes first.
         */}
      </DescriptionList>

      {/*
       * Where the case is in the firm's pipeline (B, the post-submission half
       * of the second complaint).
       *
       * Directly under the status rows, and the position was argued the other
       * way first: the rail answers "what happens next", the reference and the
       * status answer "did that work", and somebody who has just pressed send
       * is asking the second question — so the rail went below the receipt, the
       * email and the disagreements.
       *
       * Then it was looked at in a browser. The brief column is its own
       * scroller, and on a 1440x900 laptop it holds 2265px of content in 828px
       * of height: the rail began at 822, which is to say behind the sticky
       * footer, and no part of it was on screen. A reviewer reading this file
       * would have found the component; a client would not have found the
       * component. The ordering argument was right about the question and wrong
       * about the cost, because the rows that answer "did that work" are the
       * first two in the list above and they are already read by the time the
       * eye reaches here.
       *
       * So: reference and status first, then the shape of what is coming, and
       * the durable receipts below it. The single most valuable sentence in the
       * flow — that a draft of their document is already being written — is now
       * above the fold on the screen where the silence used to start.
       */}
      {hasCaseProgress(phase) ? <CaseProgress phase={phase} /> : null}

      {/*
       * Permission to leave (D).
       *
       * The cheapest sentence on the screen and the one that most makes the
       * firm feel expensive: good service is the thing you walk away from and
       * it reaches you. Directly under the rail whose last visible row is a
       * wait, which is the sentence's whole job: it answers the row above it.
       * It is only true because the two durable receipts exist — the email
       * below and the bell notification raised at submission.
       */}
      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {t('canClose')}
      </p>

      {/*
       * The paragraph the recap wrote from the finished brief, which is what a
       * lawyer reads first. Absent only if the recap call failed, in which case
       * the rows above still say everything it would have summarised.
       *
       * Below the rail rather than above it, which is the second half of the
       * same measurement. It is six lines on a 390px screen, and those six
       * lines were the difference between the rail's drafting sentence being on
       * the first screen and being 34px under it.
       *
       * Moving it costs nothing the client needs, because they wrote it. They
       * confirmed every value it was built from on the screen immediately
       * before this one, and the case is already identified twice above — by
       * its title and by its reference. What this paragraph is for is the
       * record and the lawyer who reads it, so it belongs at the head of the
       * record: the email receipt and the disagreements follow it, and together
       * those three are "what we have, and what we noticed".
       */}
      {brief.description ? (
        <p className="text-muted-foreground text-[13px] leading-relaxed">
          {brief.description}
        </p>
      ) : null}

      {/*
       * The turnaround, in the only terms we can stand behind.
       *
       * This deliberately says nothing about where the team sits or what time
       * it is there. An earlier version computed the local hour in Oslo and
       * shaped the promise around office hours, which was a better sentence and
       * an unsupportable claim: the team is moving and the co-counsel are
       * contracted from other firms, so "where our team sits" was never a fact
       * this product knew. Four hours is what we were told, so four hours is
       * all this says.
       */}
      <p className="text-muted-foreground text-[13px] leading-relaxed">
        {t('turnaroundNote')}
      </p>

      {/*
       * The receipt, next to the reference it quotes (Decision 22).
       *
       * A confirmation screen answers "did that work" only for as long as it is
       * open. The email is the part that is still there tomorrow, so the line
       * that says it was sent belongs beside the case number rather than at the
       * bottom of the page, and opening it is how a reviewer reads it without a
       * mail server.
       */}
      <ConfirmationEmailTrigger
        brief={brief}
        matterId={matterId}
        onOpen={onOpenEmail}
      />

      {/*
       * Where the client's account and the document parted company. The brief
       * itself stays clean — they already know what they typed — but a lawyer
       * would want to know that the signed agreement says something else, and
       * this is the last screen before it reaches one.
       *
       * The observation (item 6) belongs in this same block rather than in one
       * of its own. It is the same kind of fact arrived at a different way:
       * `documentDisagreements` is the disagreement the code can see by
       * comparing two values on one field, and the observation is the one only
       * a reader could have spotted across two. A client reading "Worth
       * knowing" wants both under it, not a second heading making the same
       * promise.
       *
       * Verbatim, and first. It is quoted exactly as the model wrote it,
       * because the sentence was already shown to the client in the
       * conversation and a paraphrase here would be the record disagreeing with
       * what they were told.
       */}
      {disagreements.length > 0 || brief.observation !== null ? (
        <div className="flex flex-col gap-2">
          <p className="text-foreground text-[13px] font-medium">
            {t('disagreementsTitle')}
          </p>
          <ul className="flex flex-col gap-1.5">
            {brief.observation !== null ? (
              <li className="text-muted-foreground text-[13px] leading-relaxed">
                {brief.observation}
              </li>
            ) : null}
            {disagreements.map((entry) => (
              <li
                key={entry.label}
                className="text-muted-foreground text-[13px] leading-relaxed"
              >
                {t('disagreement', {
                  label: entry.label,
                  documentValue: entry.documentValue,
                  where: entry.where ?? t('theDocument'),
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/*
       * The one thing, if there is one (item 7).
       *
       * Above the dropzone rather than below it, because when the ask *is* the
       * dropzone there is nothing here at all and the two must not both be
       * claiming to be the most useful next move. Below the permission to leave
       * on purpose: this is an offer, and an offer made before the client has
       * been told they are free to go is a condition.
       */}
      {ask === 'outcome' ? <OneMoreThing onAdd={onAddOutcome} /> : null}

      <PostSubmitDropzone
        documents={addedDocuments}
        onAttach={onAttachDocument}
        onOpen={onOpenDocument}
        isTheOneThing={ask === 'document'}
      />

      {/*
       * The faces, and what they are actually doing next (B, Decision 7,
       * Decision 21).
       *
       * A row of headshots under "Case sent" invites one specific wrong
       * reading: that one of these people has the case now. They do not. A
       * lawyer writes the quote, the client accepts it and pays, and only then
       * is anyone assigned. So the label says what this row is for and the line
       * under it names the quote as the next event, because promising a lawyer
       * and then sending an invoice is how a flow loses someone's trust at the
       * exact moment it has earned it.
       */}
      <div className="flex flex-col gap-3">
        <LawyerShowcase
          {...(matterId ? { matterId } : {})}
          label={t('showcaseLabel')}
          /*
           * Item 41. The faces were the one thing on this screen a client could
           * learn nothing more about, on the screen the brief singles out as
           * "the direction to push further". Pressing one opens the profile
           * that was already written and never rendered.
           */
          readable
          readMoreLabel={(name) => t('readMore', { name })}
        />
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          {t('humanNote')}
        </p>
      </div>

      {/*
       * The second of Garzai's two buttons, restored (item 22).
       *
       * "Go to case" is the primary and lives in the brief footer with every
       * other primary action in the flow. This is the other thing a client
       * might want, so it is an outline control at the bottom rather than a
       * competing full-width button: most people have one matter, and offering
       * "another case" as loudly as "your case" would misread the room.
       *
       * It calls back rather than linking, because the sidebar's own "New case"
       * points at this route: a link here would not remount the component and
       * nothing would happen, which is the bug this replaces.
       */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onStartAnother}
      >
        <Plus data-icon="inline-start" aria-hidden="true" />
        {t('startAnother')}
      </Button>
    </div>
  );
}
