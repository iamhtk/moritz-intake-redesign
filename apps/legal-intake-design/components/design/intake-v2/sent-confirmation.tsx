'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Plus } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
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
import { PrototypeLink } from './prototype-link';
import { PostSubmitDropzone, type AddedDocument } from './post-submit-dropzone';
import { oneMoreThing } from '@/lib/intake/one-more-thing';
import { OneMoreThing } from './one-more-thing';
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
  matterId,
  addedDocuments,
  onAttachDocument,
  onOpenDocument,
  onOpenEmail,
  onStartAnother,
  documentCount,
  onAddOutcome,
  onSkipToQuote,
}: {
  brief: Brief;
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
  /**
   * Bring the quote forward, for a reviewer rather than for a client.
   *
   * The flow's one deliberately non-product control. See the note on the
   * element it renders, and `advanceToQuote` in `intake-v2.tsx` for the timer
   * it replaced.
   */
  onSkipToQuote: () => void;
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
  const headingRef = useRef<HTMLHeadingElement>(null);
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
  /** The recap paragraph, folded to its first line until asked for. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryId = useId();
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
        {/*
         * A heading element, not a paragraph that looks like one.
         *
         * Focus already moved here on submit, which was the fix for complaint
         * #1 — but it landed on a `<p>`, so a screen-reader user was told
         * "Case sent" with no indication it was the title of anything, and
         * heading navigation skipped straight past the one line on the screen
         * that answers "did that work". `h2` because the flow's `h1` is the
         * case's own name, up in the shell, and this is the section under it.
         * Same 14px and same weight: nothing moves.
         *
         * In the serif (§4 #51). The flow's serif marks the lines that are
         * the product speaking rather than labelling — the start screen's
         * greeting, the lawyer's one-line bio, the how-it-works footer — and
         * "Case sent" is the one sentence in this whole flow the client came
         * to read. It was the only moment of that weight still set in the UI
         * sans, which made the answer to "did that work" look like a status
         * chip.
         */}
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-foreground font-serif text-sm font-medium focus-visible:outline-none"
        >
          {t('heading')}
        </h2>
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

      <DescriptionList data-tour="sent-receipt">
        <DescriptionTerm className="border-t-0 sm:border-t-0">
          {t('reference')}
        </DescriptionTerm>
        <DescriptionDetails className="font-mono text-sm sm:border-t-0">
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
         * The receipt, as a row of the receipt (Decision 22).
         *
         * A confirmation screen answers "did that work" only for as long as
         * it is open. The email is the part that is still there tomorrow, so
         * the line saying it was sent is a property of the case in the same
         * way Reference and Status are — and it used to be a centred control
         * two blocks lower, which is how a screen gets tall enough that its
         * own most useful sentence falls off the bottom.
         */}
        <DescriptionTerm>{t('copySentTo')}</DescriptionTerm>
        <DescriptionDetails className="min-w-0">
          <ConfirmationEmailTrigger
            brief={brief}
            matterId={matterId}
            onOpen={onOpenEmail}
          />
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
       * The pipeline rail used to be here, and it is now the left rail
       * (`journey-rail.tsx`).
       *
       * Two arguments closed at once. This screen was the only one that had
       * the seven rows, so a client watched a four-step stepper vanish from
       * the panel footer on submit and a seven-row list appear in its place —
       * the same question answered twice in two vocabularies. And this column
       * is its own scroller: on a 1440x900 laptop it holds 2265px of content
       * in 828px of height, so wherever the rail sat, some client was going to
       * have to scroll to find out where their case was. In the margin it is
       * fixed to the window, it has been on screen since the first message,
       * and the row that matters most here — that a draft is already being
       * written — is visible without moving.
       *
       * "Nobody is assigned until you accept" survives as the ordering of
       * `paid` before `lawyer` on that rail, which is a stronger way to say it
       * than a sentence: the client can see the two steps and which is first.
       */}

      {/*
       * Permission to leave (D).
       *
       * The cheapest sentence on the screen and the one that most makes the
       * firm feel expensive: good service is the thing you walk away from and
       * it reaches you. It is only true because the two durable receipts
       * exist — the email in the row above and the bell notification raised
       * at submission.
       *
       * The second sentence is what is left of `turnaroundNote`, which read
       * "Quotes usually come back within 24 hours. Nothing is charged until
       * you accept it." The first half of that is the Estimated response row
       * two inches up, said again in a paragraph; the second half was the
       * only clause on this screen carrying the commercial promise, so it
       * moves here rather than being lost with the sentence around it.
       */}
      <p
        data-tour="close-tab"
        className="text-muted-foreground text-sm leading-relaxed"
      >
        {t('canClose')} {t('nothingCharged')}
      </p>

      {/*
       * The paragraph the recap wrote from the finished brief, folded to its
       * first line.
       *
       * ⭐ It is the tallest thing on this screen that the client does not
       * need. Six lines on a 390px phone, and it is a summary of a brief they
       * wrote, built from values they confirmed on the screen immediately
       * before this one, about a case already named twice above — by its
       * title and by its reference. What it is genuinely for is the record
       * and the lawyer who reads it, and the record is the email.
       *
       * So: first line open, the rest on request. Not `Collapsible`, and this
       * is the one place on the screen where reaching for it would have been
       * wrong. Radix hides its content completely when shut, and what makes
       * this cheap is that the first line stays — a disclosure labelled "Show
       * more" over nothing at all is a worse trade, because the client cannot
       * tell whether it is worth opening. `line-clamp` is the mechanism that
       * matches the intent; `Collapsible` is used for the brief below, where
       * the whole block genuinely goes.
       */}
      {brief.description ? (
        <div className="flex flex-col items-start gap-1">
          <p
            id={summaryId}
            className={cn(
              'text-muted-foreground text-sm leading-relaxed',
              summaryOpen ? null : 'line-clamp-1',
            )}
          >
            {brief.description}
          </p>
          <button
            type="button"
            onClick={() => setSummaryOpen((value) => !value)}
            aria-expanded={summaryOpen}
            aria-controls={summaryId}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mz-tap relative -mx-1 rounded-[0.5rem] px-1 text-xs underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            {t(summaryOpen ? 'summaryHide' : 'summaryShow')}
          </button>
        </div>
      ) : null}

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
          <p className="text-foreground text-sm font-medium">
            {t('disagreementsTitle')}
          </p>
          <ul className="flex flex-col gap-1.5">
            {brief.observation !== null ? (
              <li className="text-muted-foreground text-sm leading-relaxed">
                {brief.observation}
              </li>
            ) : null}
            {disagreements.map((entry) => (
              <li
                key={entry.label}
                className="text-muted-foreground text-sm leading-relaxed"
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
      <div data-tour="sent-lawyers" className="flex flex-col gap-3">
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

      {/*
       * The one control on this screen that is not part of the product.
       *
       * Under the outline button rather than beside it, at the very bottom of
       * the column, where it is the last thing on the screen rather than one
       * of the choices on it. Next to "Go to case" as §3 asks: that button is
       * the sticky footer directly below this line, so the two sit together
       * without this one having to join the footer and become an action.
       *
       * See `prototype-link.tsx` for why it looks the way it does, and
       * `advanceToQuote` in `intake-v2.tsx` for the twelve-second timer it
       * replaced.
       */}
      <PrototypeLink
        action="skipToQuote"
        direction="forward"
        onClick={onSkipToQuote}
      />
    </div>
  );
}
