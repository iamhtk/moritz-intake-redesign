'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  useNavigationInterceptor,
  useUnsavedChangesGuard,
} from '@/components/navigation/navigation-guard-context';
import type { ComposerAttachment } from '@/components/design/intake/chat/chat-composer';
import {
  DocumentOverlay,
  DocumentPanel,
  DocumentRailTrigger,
  DocumentResizeHandle,
  MIN_DOCUMENT_WIDTH,
  gridTrackWidth,
  useDocumentWorkspace,
  type DocumentCitation,
} from '@/components/design/documents/viewer';
import { useMediaQuery } from '@/components/design/settings-v2/use-media-query';
import { Button } from '@/components/design/foundations/components/button';
import { LeaveIntakeDialog } from '@/components/design/new-case/leave-intake-dialog';
import { Link } from '@/i18n/navigation';
import { fileToBase64 } from '@/lib/image-utils';
import {
  chooseFiles,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  type AcceptedFile,
  type FileRejection,
  type RejectedFile,
} from '@/lib/intake/accepted-files';
import { ENTRANCE_CLASS, entrance } from '@/lib/entrance';
import {
  failureCopyKey,
  failureKindOf,
  type FailureKind,
} from '@/lib/intake/failure';
import { toTranscript } from '@/lib/intake/case-transcript';
import {
  caseReceivedNotification,
  quoteReadyNotification,
} from '@/lib/intake/intake-notifications';
import { raisePortalNotification } from '@/lib/mocks/portal-notifications';
import { carryPersonMessagesToCase } from '@/lib/mocks/person-messages';
import {
  addSubmittedCaseDocuments,
  addSubmittedCaseTurns,
  recordSubmittedCase,
} from '@/lib/mocks/submitted-cases';
import {
  DEMO_DOCUMENT,
  demoSeed,
  type DemoStage,
} from '@/lib/intake/demo-brief';
import {
  applyFieldUpdates,
  missingRequiredKeys,
  newlyFilledRequired,
  requiredCount,
  type Brief,
  type BriefField,
} from '@/lib/intake/brief';
import { clientFirstName, clientFullName } from '@/lib/intake/client-session';
import { fileNoteTimestamp } from '@/lib/intake/file-note';
import { doneStep, type TimelineStep } from '@/lib/intake/timeline';
import { matterOf } from '@/lib/intake/matter-of';
import {
  canEnterReview,
  canSend,
  hasConfirmation,
  intakePhase,
  isSealed,
  isSubmitted,
  splitFor,
  type IntakePhase,
  type IntakeStage,
} from '@/lib/intake/phase';
import { SUBMITTED_CASE } from '@/lib/intake/submitted-case';
import { chipsForMatter, hintsForMatter } from '@/lib/intake/matter-fields';
import { MATTER_TYPE_KEY } from '@/components/design/new-case/intake-types';
import { leadForMatter } from '@/components/design/new-case/lawyers';
import { DEMO_QUOTE } from '@/lib/intake/submitted-case';
import type { QuoteResponse } from '@/lib/intake/quote';
import { quoteHeldUntil } from '@/lib/intake/quote-hold';
import {
  clearIntakeSession,
  DOCUMENTS_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from '@/lib/intake/session-storage';
import { prepareDemoSession } from '@/lib/intake/demo-session';
import {
  clearSentSession,
  readSentSession,
  writeSentSession,
} from '@/lib/intake/sent-session';
import { progressNoteFor } from '@/lib/intake/progress-note';
import { WaitingQuestions } from './waiting-questions';
import { BriefColumn } from './brief-column';
import { HowItWorksCard } from './how-it-works';
import { BriefSummaryBar } from './brief-summary-bar';
import { DocumentsTrigger } from './documents-trigger';
import { DropOverlay } from './drop-overlay';
import { IntakeLawyerNote } from './intake-lawyer-note';
import type { AddedDocument } from './post-submit-dropzone';
import { NoQuoteNotice } from './no-quote-notice';
import { QuoteCard } from './quote-card';
import { ReviewNotice } from './review-notice';
import { SentConfirmation } from './sent-confirmation';
import { SendingSteps } from './sending-steps';
import { describeFile } from '@/components/design/new-case/file-utils';
import { JourneyBar } from './journey-bar';
import { PrototypeLink } from './prototype-link';
import { JourneyRailColumn } from './journey-rail';
import { SENDING_TOTAL_MS } from '@/lib/intake/sending-steps';
import { SuggestionChips } from './suggestion-chips';
import { TalkToAPerson } from './talk-to-a-person';
import { ChatColumn } from './chat-column';
import { useBrief } from './use-brief';
import { useConversation } from './use-conversation';
import { useWindowDrop } from './use-window-drop';

/**
 * Which document suggestion a read falls back to when the documents did not
 * settle what kind of matter this is (item 7).
 *
 * A constant rather than a literal inside the `t()` call, which is not a style
 * preference: `copy-keys.test.ts` reads every quoted string in the first
 * argument of a `t(...)` as a key it should be able to resolve, so an inline
 * `?? 'other'` inside a template literal made it hunt for `intake.other` and
 * fail. Worth keeping the guard honest rather than loosening it.
 */
const FALLBACK_MATTER = 'other';

/**
 * What Moritz says on arrival for each seeded demo stage.
 *
 * A map rather than a chain of conditions at the call site; see the comment
 * there for why the shape of the call matters to `copy-keys.test.ts`.
 */
/**
 * The sentence above the brief footer's action, per phase.
 *
 * A map for the same reason `DEMO_SEED_MESSAGE` is one: the third case made
 * this a nested ternary inside `t(...)`, which `copy-keys.test.ts` cannot read
 * past. It also makes the phase that was missing obvious, which is how the
 * `quoted` case came to be wrong in the first place.
 */
const FOOTER_SENTENCE: Record<IntakePhase, string> = {
  start: 'quote.explanation',
  building: 'quote.explanation',
  review: 'quote.explanation',
  sending: 'quote.explanation',
  sent: 'sent.quoteHere',
  quoted: 'quote.decisionAbove',
};

const DEMO_SEED_MESSAGE: Record<DemoStage, string> = {
  intake: 'demo.seeded',
  review: 'demo.seededComplete',
  sent: 'demo.seededComplete',
  quoted: 'demo.seededQuoted',
};

/**
 * A read that failed, carrying the kind rather than a message (T32).
 *
 * A class rather than a returned union because the failure has to travel out
 * of the middle of an `await` chain that already has a `try` around it for the
 * local failures (encoding a file, a request that never completed). Throwing
 * keeps one exit and one place that writes the sentence; returning would mean
 * threading a result type through four call sites that only care about the
 * happy path.
 */
class ReadFailure extends Error {
  constructor(readonly kind: FailureKind) {
    super(`extraction failed (${kind})`);
    this.name = 'ReadFailure';
  }
}

/** `fileToBase64` returns a data URI; the API wants the payload on its own. */
function stripDataUri(dataUri: string): string {
  const comma = dataUri.indexOf(',');
  return comma === -1 ? dataUri : dataUri.slice(comma + 1);
}

/**
 * Intake v2, the redesigned client intake.
 *
 * Renders unconditionally at `/client/new`: no feature flag, no engagement gate
 * (Decision 28). The layout follows the phase (Decision 18): one column until
 * the conversation starts, then chat-led while the brief fills in, then
 * brief-led for the review, the send and the confirmation. The phase rules are
 * in `lib/intake/phase.ts` so the boundaries can be tested without a browser.
 */
export function IntakeV2() {
  const t = useTranslations('intake');
  const router = useRouter();

  /*
   * A demo link beats a session left behind by a previous demo link.
   *
   * In render rather than in an effect, and guarded by a ref rather than by a
   * dependency list, because `useBrief` restores the saved brief in an effect
   * and effects run after render: this is the last moment at which clearing
   * still lands before the restore. See `demo-session.ts` for why the rule is
   * "a different demo wins" rather than "any demo wins".
   */
  const demoPrepared = useRef(false);
  if (!demoPrepared.current) {
    demoPrepared.current = true;
    prepareDemoSession(
      typeof window === 'undefined' ? '' : window.location.search,
    );
  }

  /*
   * The stage lives above the brief and the conversation, not beside the rest
   * of the phase derivation below, because both hooks have to know whether
   * what they are holding is still a draft. `intakePhase` needs the transcript
   * to tell `start` from `building`, and the transcript is one of the things
   * being gated — but the only boundary that matters for saving is the one
   * `isSealed` reads straight off the stage.
   */
  const [stage, setStage] = useState<IntakeStage>('intake');
  /**
   * Which quote outcome the `quoted` stage is showing (G3, G2).
   *
   * `null` until something sets it, which in this prototype is only the demo
   * seed: the quote is written by a person after submission, so no run of this
   * flow produces one. When there is a backend this is what a quote-arrived
   * event would set, and nothing else about the two screens changes.
   */
  const [quoteOutcome, setQuoteOutcome] = useState<
    'quoted' | 'no-quote' | null
  >(null);
  /**
   * When the quote landed, for the hold date on the card.
   *
   * Stamped once on mount rather than read at render, so the "hold until" date
   * does not move while the client is reading it — and so the server's HTML and
   * the client's first paint agree, which a bare `Date.now()` in the render
   * would not.
   */
  const [quoteArrivedAt] = useState(() => Date.now());
  /**
   * Whether the client has accepted the quote (item 46).
   *
   * The card had four responses and no memory of any of them, so accepting
   * showed a toast and left the Accept button live — which is complaint one
   * reintroduced at the one point in the flow where money changes hands. Held
   * here rather than in the card so it survives the card unmounting, and so the
   * one place that decides what the client has committed to is the same place
   * that owns the stage.
   */
  const [quoteAccepted, setQuoteAccepted] = useState(false);
  /**
   * Which of the waiting questions have been asked (item 4).
   *
   * Held here rather than derived from the transcript, even though the asked
   * text is sitting in it. Matching a message back to a question would mean
   * comparing the client's turn against a translated string, which is the kind
   * of check that passes in English and quietly stops working in the next
   * locale — and the row would then re-offer a question whose answer is two
   * bubbles above it.
   */
  const [askedQuestions, setAskedQuestions] = useState<readonly string[]>([]);
  const sealed = isSealed(stage);

  const {
    brief,
    receipts,
    hydrated,
    savedAt,
    applyUpdates,
    confirm,
    confirmAll,
    undo,
    progress,
    reset,
    setRecap,
    noteObservation,
    markDocumentsSuggested,
    unconfirmed,
    blocking,
    replace,
  } = useBrief('contract', { persist: !sealed });

  /**
   * Item 6: take the observation, and report whether it was the first.
   *
   * A ref of the brief rather than the render-time value, because a turn can
   * settle in the same tick as an earlier state update and the at-most-one
   * check has to read the brief as it is now. `noteObservation` is idempotent
   * anyway, so the worst case of getting this wrong is a duplicate sentence on
   * screen rather than a duplicate note on the case, but a duplicate sentence
   * is the whole thing item 6 is trying to avoid.
   */
  const briefRef = useRef(brief);
  briefRef.current = brief;
  const recordObservation = useCallback(
    (text: string): boolean => {
      if (briefRef.current.observation !== null) return false;
      if (text.trim() === '') return false;
      noteObservation(text);
      return true;
    },
    [noteObservation],
  );
  /**
   * Item 9: the sentence that says the work got smaller, and only when it did.
   *
   * The firing rule is the `>= 2` and it is deliberately strict. On a
   * single-field turn Moritz has already named the value he wrote down, in his
   * own reply, and following that with a count is the moment this stops sounding
   * like a person taking notes and starts sounding like a progress bar with a
   * voice. Two fields at once is a genuinely different event: the client said
   * something that did more work than they expected, and telling them so is
   * information rather than encouragement.
   *
   * `null` for everything else, so the hook appends nothing at all.
   */
  const progressNote = useCallback(
    (filled: number, next: Brief, asking: boolean): string | null => {
      const note = progressNoteFor({
        filled,
        total: requiredCount(next),
        remaining: missingRequiredKeys(next).length,
        asking,
      });
      if (note === null) return null;
      /*
       * One `t` call for all three sentences, with `remaining` passed even
       * where the sentence does not use it. `copy-keys.test.ts` reads the
       * quoted string out of the first argument of every `t(...)`, so the key
       * cannot be built here — which is why `progress-note.ts` hands back a
       * key it wrote down rather than a fragment to assemble.
       */
      return t(note.copyKey, {
        count: note.filled,
        total: note.total,
        remaining: note.remaining,
      });
    },
    [t],
  );

  /**
   * T32: a read that failed, said in a way the client can act on.
   *
   * Three sentences rather than seven, because on this path the kind only
   * changes the advice three ways. Either the file is worth sending again, or
   * it is not worth sending again because the fault is ours, or it was read and
   * nothing usable came out of it. The turn failures get all seven because
   * there the kind changes what the client should expect, not just what to try.
   *
   * All three end the same way: tell me about the matter instead. That is the
   * dead end this replaces. A failed read used to say "I could not read that.
   * Try again", which on a scanned contract is advice that cannot work, and a
   * client with no other route forward closes the tab. Documents are never
   * required (D1), and the sentence has to say so at the one moment it matters.
   */
  const readFailureText = useCallback(
    (kind: FailureKind, count: number): string => {
      if (kind === 'unauthorized') return t('upload.failedOurs', { count });
      // `refused` and `truncated` both mean the read happened and produced
      // nothing usable, so the same file sent again produces the same nothing.
      if (kind === 'refused' || kind === 'truncated') {
        return t('upload.failedDeclined', { count });
      }
      return t('upload.failedBusy', { count });
    },
    [t],
  );

  /**
   * Item 7's sentence, written for whatever kind of matter the brief says it
   * is by the time somebody asks.
   *
   * Takes the brief rather than closing over it, and that is the point. The
   * suggestion names two documents specific to the matter type, and the moment
   * it is *earned* (a document was read) is not the moment the matter is
   * *known* (the turn call that follows the read is usually what settles it).
   * Writing the sentence at the earlier moment is what had Moritz say "the
   * document at the centre of this" one paragraph after saying "I've marked
   * this as an employment matter". So the callers hold this and call it last.
   *
   * The fallback still exists, for a brief that genuinely never says: an
   * unrecognised matter gets the generic pair rather than a guess.
   */
  const documentSuggestion = useCallback(
    (next: Brief): string =>
      t(`upload.alsoUseful.${matterOf(next) ?? FALLBACK_MATTER}`),
    [t],
  );

  /**
   * Item 16: what each wait is called.
   *
   * Three, because they are three different pieces of work, and the registry in
   * `lib/intake/waits.ts` is what says so. On the first turn there is no brief
   * to check anything against, so Moritz is reading what they said; after that
   * he is placing it against what is already written down, which is the more
   * reassuring of the two things to be told and also the true one.
   *
   * `sent` is the third and it was the missing one. After submission there is
   * nothing to check and nothing to write — the brief is sealed — so Moritz is
   * looking something up on a case that has already gone. Borrowing the reply
   * label there would claim work that is not happening, which is the precise
   * failure the registry exists to make visible, and it went unnoticed because
   * the post-submit composer had no prompt of its own either (item 27).
   */
  const waitLabels = useMemo(
    () => ({
      first: t('chat.waitFirst'),
      reply: t('chat.waitReply'),
      sent: t('chat.waitSent'),
    }),
    [t],
  );

  /**
   * The rail's nested count for a turn, in words (L1).
   *
   * Every field the turn wrote, optional ones included, which is *not* the
   * number `progressNote` states. That one counts required gaps that closed,
   * because that is the number the client is waiting to hear. This one counts
   * the work, because that is what a record of the work should say. The two are
   * routinely different — a turn can re-propose a value a field already had, or
   * fill an optional one — and the reason they live in two different places on
   * screen is that putting both in one breath would have Moritz quote two
   * numbers for the same turn and appear to contradict himself. The prose owns
   * the one about the client's progress; the rail owns the one about his own.
   */
  const fieldsWritten = useCallback(
    (count: number) => t('timeline.filled', { count }),
    [t],
  );

  /**
   * T32: what to say about a failure, one sentence per kind.
   *
   * Held here rather than in the hook for the same reason the wait labels are:
   * the kind is a fact about the call and the sentence is copy, so the kind
   * comes back from the route and `en.json` owns the words (D25). Before this,
   * the route's `err.message` went straight into the chat, which is how a
   * missing key on the deployment could tell a client describing a redundancy
   * that authentication could not be resolved.
   */
  const errorText = useCallback(
    (kind: FailureKind) => t(failureCopyKey(kind)),
    [t],
  );

  const {
    messages,
    busy,
    failure,
    askingAbout,
    send,
    retry,
    say,
    rewindTo,
    sayClient,
    sayWhile,
    finishSaying,
    dropSaying,
    clear,
    chooseChip,
    setError,
  } = useConversation({
    brief,
    applyUpdates,
    hydrated,
    waitLabels,
    progressNote,
    recordObservation,
    errorText,
    fieldsWritten,
    persist: !sealed,
    /*
     * Which Moritz answers, and it changes at the send boundary (item 27).
     *
     * Everything behind this was already built — the concierge prompt, its
     * one-property schema, the parser and the sealed-brief renderer, and the
     * mode switch in the route — and nothing passed it, so a client typing on
     * the confirmation got the interviewer: Moritz asking about a contract for
     * a case that had already gone, with nowhere to put the answer. Read off
     * `sealed` rather than a second condition, so the composer's mode and the
     * brief's read-only state cannot disagree about whether the case has left.
     */
    mode: sealed ? 'waiting' : 'intake',
  });

  const hints = useMemo(() => hintsForMatter('contract'), []);

  /**
   * Item 1: who to greet.
   *
   * Read once for the whole flow rather than inside the opening screen, so the
   * greeting and the confirmation email are looking at the same value. `null`
   * where the session has no usable name, which falls through to a heading
   * with no greeting in it rather than to "Welcome back, ."
   */
  const firstName = useMemo(() => clientFirstName(), []);

  /**
   * What kind of matter this actually is (item 13).
   *
   * Read off the brief's `matter-type` field rather than `brief.matterId`,
   * which never changes from `contract`. This is what makes the face and the
   * sentence beside it follow the matter instead of decorating it, and it is
   * the single value every surface that names a lawyer is resolved from, so
   * the composer, the confirmation and the email cannot name three people.
   */
  const matterId = useMemo(() => matterOf(brief), [brief]);

  /**
   * Ready-made answers, but only for fields that are still empty (D6).
   *
   * The turn route reports what the model said it was asking about, verbatim,
   * because that is a record and the live test for T13a reads it. Acting on it
   * is this layer's job: if the model slips and asks about a field a document
   * already filled, the reply is what it is, but a row of one-tap answers under
   * it would turn one stray question into an invitation to answer it again.
   */
  const allChips = useMemo(() => chipsForMatter('contract'), []);
  const chipsByField = useMemo(() => {
    const filled = new Set(
      brief.fields
        .filter((field) => field.value !== null)
        .map((field) => field.key),
    );
    return Object.fromEntries(
      Object.entries(allChips).filter(([key]) => !filled.has(key)),
    );
  }, [allChips, brief.fields]);

  /**
   * The composer's dock while a read is in flight (`processing`), and only
   * then.
   *
   * Staged files are NOT held here. They are derived from `stagedFiles` below,
   * because two lists holding the same set is two lists that drift: the first
   * version keyed dock rows by array index, so removing the middle of three
   * files left every later id pointing at the wrong file.
   */
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);

  /**
   * Documents attached but not yet sent (A, Decision 1).
   *
   * Held rather than read, because a document and what the client says about it
   * are one action: they drop the contract and its order form, say what they
   * want doing about it, and send once. Reading on arrival files the answer
   * before the question, and hands the turn call a brief that does not yet know
   * what they said.
   *
   * **This is now true mid-conversation too, and that is a fix rather than a
   * generalisation.** A drop used to start extracting the moment the file
   * landed: the client dragged in the amendment they had just been asked about,
   * watched it read itself before they had let go of the sentence they were
   * typing, and got a reply to a document they had not sent yet. Their
   * half-written message was still sitting in the composer while Moritz
   * answered. Attaching is not sending in any chat product a client has used,
   * and it was not sending on the opening screen of this one either.
   */
  const [stagedFiles, setStagedFiles] = useState<AcceptedFile[]>([]);

  /** Documents handed over after the case was sent (Decision 24). */
  const [addedDocuments, setAddedDocuments] = useState<AddedDocument[]>([]);

  /**
   * Every document the client handed over, and the panel that shows them.
   *
   * A third surface beside the conversation and the brief, and it is additive
   * in the strict sense: with nothing attached it renders nothing, costs
   * nothing and changes no layout. The two panes below keep their own classes
   * untouched until a document is actually open.
   */
  const documents = useDocumentWorkspace();
  /*
   * Pulled out by name because every one of them is a stable callback, and a
   * hook that depends on `documents.close` rather than on `documents` is a hook
   * that does not re-run every time a tab changes.
   */
  const {
    addFiles: addDocuments,
    close: closeDocuments,
    openByName: openDocumentByName,
    clearReveal: clearDocumentReveal,
    maximise: maximiseDocument,
    reset: resetDocuments,
    setWidth: setDocumentWidth,
  } = documents;

  /*
   * Docking needs room that a laptop at `lg` does not have. Three columns at
   * 1024 would be a 200px conversation, so below `xl` the document opens as
   * the centred overlay instead — the same surface, the same controls, seated
   * over the intake rather than squeezed into it.
   *
   * The opening screen is excluded for a different reason, and it is now a
   * stronger one than "no columns to be a third of": the surface does not
   * exist there at all. See `documentsReachable`.
   */
  const roomToDock = useMediaQuery('(min-width: 1280px)');
  /*
   * The two numbers the document's own width has to respect, in the pixels the
   * grid tracks above are written in.
   *
   * `chatFloor` is what a transcript stops being readable below, and it rises
   * with the screen for the same reason the tracks do. `briefWidth` is what the
   * brief wants and gets — it is restated here rather than measured, because
   * the point of having it is to work out a maximum *before* the brief has been
   * squeezed, and a measurement taken afterwards would only tell us it already
   * had been.
   */
  const wideScreen = useMediaQuery('(min-width: 1536px)');
  const chatFloor = wideScreen ? 448 : 384;

  /**
   * Every document handed over during the intake, by name.
   *
   * Kept because the submitted case has to list them and the brief cannot: a
   * field records which document it came from, so a document the model made
   * nothing of leaves no trace at all. A client whose contract could not be
   * read still handed the firm their contract.
   *
   * Saved with the rest of the session, so an intake finished in a second
   * sitting does not send a case that has forgotten its documents.
   */
  const [readDocuments, setReadDocuments] = useState<string[]>([]);
  useEffect(() => {
    const stored = readStoredJson<unknown>(DOCUMENTS_STORAGE_KEY);
    if (Array.isArray(stored)) {
      setReadDocuments(
        stored.filter((one): one is string => typeof one === 'string'),
      );
    }
  }, []);
  useEffect(() => {
    // Nothing to remember until something has arrived, which also keeps a
    // mount that does nothing from writing an empty list over a real one.
    if (!hydrated || sealed || readDocuments.length === 0) return;
    writeStoredJson(DOCUMENTS_STORAGE_KEY, readDocuments);
  }, [hydrated, readDocuments, sealed]);

  // Fills the picked chip in before the screen changes, so the click is
  // acknowledged rather than swallowed by the layout switch.
  const [startChoice, setStartChoice] = useState<string | undefined>(undefined);

  // ----------------------------------------------------------------- phases

  const started = messages.length > 0;
  const phase = intakePhase(stage, started);
  const split = splitFor(phase);
  const submitted = isSubmitted(phase);
  const briefLed = split === 'brief-led';

  /** What the brief's track resolves to when it has the room it wants. */
  const briefWidth = briefLed
    ? wideScreen
      ? 640
      : 544
    : wideScreen
      ? 480
      : 448;

  /** Where a document can be a column rather than an overlay. */
  const canDock = roomToDock && phase !== 'start';
  useEffect(() => {
    if (documents.mode === 'docked' && !canDock) maximiseDocument();
  }, [canDock, documents.mode, maximiseDocument]);

  /**
   * Whether the document surface exists on this screen at all.
   *
   * It does not on the opening screen, and that is a correction. A client who
   * attaches a contract there has done one thing — handed it over — and the
   * flow used to answer by putting a handle on the edge of the window
   * immediately, offering to open a reader over a screen whose entire job is
   * the sentence they have not written yet. The document is not evidence for
   * anything before the extractor has read it: there is no brief to check it
   * against and no reply that cites it, so the panel could only show the file
   * back to the person who just picked it. The dock under the composer is the
   * right acknowledgement at that moment, and it already exists.
   *
   * So the surface arrives with the conversation, which is also the moment it
   * becomes useful — the first reply cites the document, and the handle is
   * there to open it.
   */
  const documentsReachable = phase !== 'start';

  /*
   * And the panel is shut while it is unreachable, so state and screen agree.
   *
   * Without this the mode could be `docked` behind an opening screen that
   * refuses to draw it — a restored session is the way in (the arrangement is
   * read back on mount) — and the panel would then appear by itself the
   * instant the client sent their first message, which is not something they
   * asked for.
   */
  useEffect(() => {
    if (!documentsReachable && documents.mode !== 'closed') closeDocuments();
  }, [closeDocuments, documents.mode, documentsReachable]);

  // A sent case is not an intake in progress. Without this, leaving the
  // confirmation would offer to save it as a draft or delete it.
  const hasActiveIntake =
    !submitted &&
    (messages.length > 0 || brief.fields.some((field) => field.value !== null));

  /*
   * The brief pane owns its own scroll, so a client arriving at review after a
   * long conversation would otherwise land wherever they had scrolled to —
   * halfway down a panel whose top now carries the thing they are being asked
   * to read.
   */
  const briefPaneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!briefLed) return;
    briefPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [briefLed, phase]);

  // On a phone the brief is one line until it is asked for. Review opens it,
  // because at that point it is the only thing on screen worth reading.
  const [briefOpenOnMobile, setBriefOpenOnMobile] = useState(false);
  useEffect(() => {
    if (briefLed) setBriefOpenOnMobile(true);
  }, [briefLed]);

  const sendingTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (sendingTimer.current !== null) {
        window.clearTimeout(sendingTimer.current);
      }
    },
    [],
  );

  /**
   * Send, wait, confirm, and tell the client's inbox it happened (Decision 23).
   *
   * The notification is raised at the `sent` boundary rather than on the click,
   * because until the case exists there is nothing to notify anyone about, and
   * a row that appears and then has to be retracted is worse than a row that
   * appears a second later. Its id is fixed, so the mock store's own dedupe
   * makes a second submit or a remount a no-op.
   *
   * This is the half of the receipt that lives in the product; the email
   * (Decision 22) is the half that survives the tab being closed. Together they
   * are the answer to "I did not know I had submitted anything", which is the
   * complaint this whole flow exists to fix.
   */
  const submitCase = useCallback(() => {
    setStage('sending');
    sendingTimer.current = window.setTimeout(() => {
      sendingTimer.current = null;
      setStage('sent');

      /*
       * The case stops being a draft in this browser and becomes a case on the
       * client's account, and those are two separate writes because they are
       * two separate facts.
       *
       * Recording it is what makes "Your cases" show the matter they actually
       * sent rather than the fixture prose the reserved case ships with, and
       * what makes the confirmation's "Go to case" land somewhere that agrees
       * with the confirmation.
       *
       * Clearing the session is the other half, and it is the fix for the thing
       * clients were hitting: leaving a sent case left the whole intake in
       * localStorage, so the next "Start a case" reopened the case they had
       * already submitted as an unfinished one, with a "Save as draft or
       * delete?" dialog over a case that was already with the firm. Nothing is
       * lost by clearing — the confirmation on screen is rendered from state,
       * and the record it is describing is the write above.
       */
      // One name for the case, read once: the row in "Your cases" and the row
      // in the inbox are the same case and must not be able to disagree.
      const caseTitle = brief.title ?? t('email.fallbackName');
      const sentAt = Date.now();

      recordSubmittedCase({
        id: SUBMITTED_CASE.id,
        title: caseTitle,
        description: brief.description,
        documentNames: readDocuments,
        // The conversation goes with the case (Decision 8). The brief is what a
        // lawyer reads first, but it is a summary, and the thread behind it is
        // where the client's own words are — including the ones no field on the
        // brief has a slot for.
        /*
         * Plus anything written on the *Talk to a person* screen while this
         * brief was still open. That exit is a different screen now, so those
         * words are not in `messages` and would otherwise never reach the case
         * — the same "it looks like it landed" failure this flow has already
         * been fixed for once. See `carryPersonMessagesToCase`.
         */
        transcript: [
          ...toTranscript(messages, sentAt),
          ...carryPersonMessagesToCase(SUBMITTED_CASE.id),
        ],
        submittedAt: new Date(sentAt).toISOString(),
      });
      clearIntakeSession();

      raisePortalNotification(
        'NON_LEGAL',
        caseReceivedNotification({
          caseNumber: SUBMITTED_CASE.reference,
          caseTitle,
          href: SUBMITTED_CASE.href,
          title: t('notification.receivedTitle'),
          content: t('notification.receivedBody', {
            reference: SUBMITTED_CASE.reference,
          }),
        }),
      );
    }, SENDING_TOTAL_MS);
  }, [brief.description, brief.title, messages, readDocuments, t]);

  // ---------------------------------------------------------------- leaving

  const [leaveDialog, setLeaveDialog] = useState<{
    open: boolean;
    reason: 'navigate' | 'restart';
  }>({ open: false, reason: 'navigate' });
  const pendingHrefRef = useRef<string | null>(null);

  // Covers a refresh or a closed tab. The interceptor below takes over in-app
  // navigation so the intake shows its own save-or-delete dialog rather than
  // the generic unsaved-changes alert.
  useUnsavedChangesGuard(hasActiveIntake);
  useNavigationInterceptor((href) => {
    if (!hasActiveIntake) return false;
    pendingHrefRef.current = href;
    setLeaveDialog({ open: true, reason: 'navigate' });
    return true;
  });

  const resumePendingNavigation = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    if (href) router.push(href);
  }, [router]);

  const performRestart = useCallback(() => {
    clearIntakeSession();
    reset();
    clear();
    setAttachments([]);
    setStagedFiles([]);
    setAddedDocuments([]);
    setReadDocuments([]);
    /*
     * The library and the panel go too, and this is the one place they have to
     * be said out loud. Documents now survive a reload (see
     * `lib/intake/document-store.ts`), so a library left standing here would
     * not just be stale state in a tab — it would be the previous case's
     * contracts saved into the new one, arriving on the handle at the edge of a
     * case that has never seen them.
     */
    resetDocuments();
    /*
     * The commercial state goes too, and it has to be cleared here rather than
     * left to the phase.
     *
     * `quoteOutcome` and `quoteAccepted` outlive the stage they belong to: they
     * are plain state on this component, not derived from it, so a client who
     * accepted a quote and then started a second case would carry an accepted
     * quote into a case that has not been priced. The send timer is cancelled
     * for the same reason — a confirmation arriving into a fresh intake would
     * be the previous case's event landing on this one.
     */
    setQuoteOutcome(null);
    setQuoteAccepted(false);
    if (sendingTimer.current !== null) {
      window.clearTimeout(sendingTimer.current);
      sendingTimer.current = null;
    }
    setStage('intake');
  }, [clear, reset, resetDocuments]);

  const onLeaveSaveDraft = useCallback(() => {
    toast.success(t('leave.savedTitle'), {
      description: t('leave.savedDescription'),
    });
    resumePendingNavigation();
  }, [resumePendingNavigation, t]);

  /**
   * Delete the draft, and then do the thing the client was trying to do.
   *
   * Which of the two things happens here depends on whether there is somewhere
   * to go, and that distinction is the fix for a flash. Deleting on the way out
   * used to rebuild the intake in place *and then* navigate: the opening screen
   * painted for a frame or two, so a client pressing Home watched a brand new
   * case appear and then vanish, which reads as the delete having failed and
   * the app having changed its mind. Leaving means leaving.
   *
   * So on the way out only the stored session is cleared, which is the part
   * that has to outlive this component, and the in-memory state is left alone
   * because the component is about to unmount with it. Nothing re-saves it:
   * both persistence effects are keyed on their own state changing, and none of
   * it changes here.
   *
   * A restart (`reason: 'restart'`) has nowhere to go, so it is the one that
   * genuinely needs the intake rebuilt in place.
   */
  const onLeaveDiscard = useCallback(() => {
    const leaving = pendingHrefRef.current !== null;
    if (leaving) clearIntakeSession();
    else performRestart();
    toast(t('leave.deletedTitle'), {
      description: t('leave.deletedDescription'),
    });
    resumePendingNavigation();
  }, [performRestart, resumePendingNavigation, t]);

  // --------------------------------------------------------------- uploads

  /**
   * Read documents into the brief.
   *
   * **One call for the whole set, not one call per file.** A matter arrives as
   * a bundle (an MSA with its order form and its DPA, a renewal beside the
   * original) and reading them together is better on every axis that matters:
   * one system prompt instead of N, and a model that can see the order form
   * fills `otherSide` from the signed agreement rather than from whichever file
   * happened to be read last. Sequential calls would also let a later
   * extraction silently overwrite an earlier one's value with no way to tell
   * which document won.
   *
   * Returns the field updates it applied, so a caller that has to act on the
   * newly filled brief in the same tick can, rather than waiting a render for
   * the state to come back round. `null` means the read failed.
   */
  const runExtraction = useCallback(
    async (
      documents: readonly AcceptedFile[],
      /**
       * Whether this read takes a turn of its own in the transcript.
       *
       * No caller announces any more, and the default is left as it is on
       * purpose. Every read now runs from `sendWithStaged`, where the turn call
       * that follows is the reply and a waiting Moritz turn here would be
       * replaced by another one a second later. The announced path is what a
       * read with no message attached to it needs — a document arriving on its
       * own, with nothing else in flight — which is how a mid-conversation drop
       * used to behave before attaching stopped meaning sending. Kept working
       * rather than deleted because the two paths differ in where one sentence
       * and one rail step go, and that is the expensive part to rebuild.
       */
      announce = true,
      /**
       * What the client said when they handed the documents over.
       *
       * Extraction needs it to tell the parties apart. A two-party contract
       * cannot say which side the client is on, so without this the reader
       * picks one and can name the client's own company as their opponent.
       * "We signed an MSA with Acme" settles it in one line.
       */
      accompanying?: string,
    ): Promise<{
      fields: readonly unknown[];
      /**
       * How to write item 7's sentence, when this read earned it and nobody
       * has said it yet, or `null` when it is not this caller's to say.
       *
       * A function rather than the finished sentence, because the sentence
       * names two documents chosen by the kind of matter this is, and on the
       * opening move the matter is settled by the turn call that has not run
       * yet. The caller resolves it once the brief is final.
       *
       * Handed back rather than always spoken here, because where it goes
       * depends on which read this was. A mid-conversation drop speaks for
       * itself and carries the sentence as its own turn's aside; on the opening
       * move the turn call is about to reply, so the caller hands it to that
       * turn instead of making Moritz talk twice in a row.
       */
      suggest: ((next: Brief) => string) | null;
      /**
       * This read, as a finished rail step, when it was silent (L1).
       *
       * `null` for an announced read: that one settled a turn of its own, so
       * its step is already ticked where the client saw it happen. See the
       * return site for why a silent one has to hand its work on.
       */
      step: TimelineStep | null;
    } | null> => {
      if (documents.length === 0) return null;
      const names = documents.map((one) => one.file.name);

      // Recorded at handover rather than after a successful read, because the
      // file reaching the firm does not depend on the model making sense of
      // it. The same file dropped twice is one document.
      setReadDocuments((current) => [
        ...current,
        ...names.filter((name) => !current.includes(name)),
      ]);

      setAttachments(
        documents.map((one, index) => ({
          id: `a_${Date.now()}_${index}`,
          name: one.file.name,
          state: 'processing',
        })),
      );

      /*
       * Item 16: the read, named where the answer will appear.
       *
       * Only when this read is going to speak for itself. On the opening move
       * the documents and the client's message are one action and the turn call
       * is what replies, so a waiting Moritz turn here would be replaced by
       * another one a second later, which is the stutter `announce` exists to
       * prevent.
       */
      const waitId = announce
        ? sayWhile({
            /*
             * The `INTAKE_WAITS` id travels with the sentence (L1).
             *
             * Not cosmetic: the rail is a persisting record, so every row on it
             * has to be traceable back to the one place its sentence is
             * written and the test that stops two waits sharing one. A literal
             * here rather than a lookup keeps `timeline.test.ts` able to assert
             * the id is registered without importing this component.
             */
            waitId: 'read-documents',
            label: t('chat.waitDocuments', { count: documents.length }),
          })
        : null;

      try {
        // Encoded in parallel: `fileToBase64` reads the whole file, and doing
        // four of them in sequence is four file reads of dead time before the
        // request even starts.
        const encoded = await Promise.all(
          documents.map(async (one) => ({
            name: one.file.name,
            mediaType: one.mediaType,
            data: stripDataUri(await fileToBase64(one.file)),
          })),
        );

        const response = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: [
                  accompanying ? `The client says: "${accompanying}"` : null,
                  `Read ${
                    documents.length === 1
                      ? 'this document'
                      : `these ${documents.length} documents`
                  } and fill in what you can. Field keys: ${brief.fields
                    .map((field) => field.key)
                    .join(', ')}.`,
                ]
                  .filter(Boolean)
                  .join('\n\n'),
              },
            ],
            /*
             * The same sentence again, on its own.
             *
             * It is already in the prompt above, and the route needs it
             * separately: whether the client said anything that could tell two
             * parties apart is a rule the route enforces in code, and a rule
             * that depends on parsing the prompt back apart would break the
             * next time the prompt is reworded. See `party-fields.ts`.
             */
            ...(accompanying ? { clientSays: accompanying } : {}),
            // Each file carries its own name and media type. The name comes
            // back to the client as the source ("vendor-agreement.pdf, clause
            // 11.3"), resolved server-side to whichever file the quote was
            // actually found in.
            documents: encoded,
          }),
        });

        const result = (await response.json()) as {
          fields?: unknown[];
          verifiedCount?: number;
          error?: string;
          kind?: string;
        };

        if (!response.ok || result.error) {
          /*
           * The route's own kind where it sent one, and the status where it did
           * not (a proxy, an edge timeout, our own 400 on a malformed body).
           * `failureKindOf` falls back to `unknown`, which reads as "try again",
           * and that is the right default for a read: it is the only one of the
           * three sentences that leaves the file worth another attempt.
           */
          throw new ReadFailure(failureKindOf(result));
        }

        const fields = result.fields ?? [];
        applyUpdates(fields);
        setAttachments([]);

        /*
         * The read's nested line on the rail (L1): how much of what came back
         * could be traced to a line in the document.
         *
         * `verifiedCount` is computed server-side against the PDF's own text
         * layer (T4a), so this is the one number in the flow that is worth
         * stating without being asked — it is the difference between a value
         * the client can check and one they have to take on trust. It is
         * already said in the prose of an announced read; on the rail it is
         * also what makes the *silent* read (the opening move) leave a trace,
         * which is the path most clients take and the one that had none.
         */
        const tracedDetail = t('timeline.traced', {
          count: result.verifiedCount ?? 0,
        });

        /*
         * Item 7: the two documents they did not think to send.
         *
         * Every clause of the firing rule is here. Once per intake
         * (`documentsSuggested`), only after a document has actually been read,
         * and so never asked of a client who has sent nothing: this is the read
         * path, so reaching this line *is* the "a document already arrived"
         * condition. A client with no documents is not holding any back, and
         * asking them for two specific files they have never mentioned would
         * read as being told their case looks thin.
         *
         * Computed before the announce branch because both reads earn it. It
         * used to sit inside that branch, which meant the opening move (where
         * documents arrive with the first message and the read stays quiet) was
         * the one path that never suggested anything, and that is the path most
         * clients take.
         *
         * Keyed off the matter the documents just established rather than the
         * matter as it stood before the read, because the first document is
         * usually what settles what kind of matter this is, and naming
         * employment paperwork on a share purchase is worse than silence.
         */
        const beforeRead = brief;
        const afterRead = applyFieldUpdates(beforeRead, fields);
        const earned = !beforeRead.documentsSuggested;
        if (earned) markDocumentsSuggested();

        // Decision 2: say out loud what was found, and be honest about how
        // much of it could be traced back to the documents.
        //
        // Names every file it read. With a bundle this is the only place the
        // client finds out that all four were read rather than just the one
        // they were watching, and "I read three documents" without the names
        // invites them to wonder which three.
        //
        // Suppressed when the documents arrived alongside the client's own
        // opening message: the turn call that follows is about to say what it
        // has, and two Moritz turns in a row covering the same ground reads as
        // a stutter rather than as being kept informed.
        if (waitId !== null) {
          /*
           * Item 5 and item 9, in one turn.
           *
           * The first sentence is about the documents: what was read, and how
           * much of it could be traced to a line in the text. The second is the
           * same "work got smaller" line the conversation uses, so the
           * arithmetic is phrased identically whether a document filled four
           * fields or the client did.
           *
           * Only one of the two states a count, deliberately. `fields.length`
           * is how many values came back and `newlyFilledRequired` is how many
           * gaps closed, and they are routinely different numbers: a read can
           * re-propose a value a field already had, or fill an optional one. Two
           * sentences side by side quoting the two of them would have Moritz
           * contradict himself in a single breath, so the document sentence
           * names no number and the note owns the arithmetic.
           */
          const note = progressNote(
            newlyFilledRequired(beforeRead, afterRead),
            afterRead,
            /*
             * A document read asks nothing. It is a batch of values arriving
             * from a file, with no turn and no question attached, so the
             * completion sentence is the honest one here — and the next thing
             * the client sees is the panel, not a question to answer.
             */
            false,
          );
          const found =
            fields.length === 0
              ? t('upload.nothingFound', {
                  names: names.join(', '),
                  documents: names.length,
                })
              : t('upload.found', {
                  names: names.join(', '),
                  documents: names.length,
                  verified: result.verifiedCount ?? 0,
                });

          /*
           * The suggestion leaves the prose and becomes the turn's aside.
           *
           * It is the one sentence here that asks the client for something
           * instead of telling them what happened, so running it on from the
           * end of "I read three documents" made a report read as a request.
           * Resolved against `afterRead`, which is the brief this read just
           * finished writing and the most the app knows at this point.
           */
          finishSaying(
            waitId,
            [found, note].filter(Boolean).join('\n\n'),
            earned ? documentSuggestion(afterRead) : null,
            tracedDetail,
          );
        }
        return {
          fields,
          suggest: waitId === null && earned ? documentSuggestion : null,
          /*
           * The finished step, for a caller whose read was silent.
           *
           * An announced read settles its own turn above, so its step is
           * already ticked on a rail of its own and there is nothing to hand
           * on. A silent one has no bubble at all, so the work has to travel to
           * the turn that does — otherwise the longest wait in the flow is the
           * only one with no record of having happened.
           */
          step:
            waitId === null
              ? doneStep({
                  waitId: 'read-documents',
                  label: t('chat.waitDocuments', { count: documents.length }),
                  detail: tracedDetail,
                })
              : null,
        };
      } catch (caught) {
        setAttachments([]);
        // The wait has to go with the failure, or the transcript keeps a
        // spinner that is never coming back. The reason goes in the error line
        // below the transcript, which is where every other rejection lands.
        if (waitId !== null) dropSaying(waitId);
        /*
         * A `ReadFailure` carries the kind the route reported. Anything else
         * thrown in here is local: `fileToBase64` on an unreadable file, or a
         * `fetch` that never completed. Both are worth another attempt, and
         * `busy` is the sentence that says so.
         */
        setError(
          readFailureText(
            caught instanceof ReadFailure ? caught.kind : 'busy',
            documents.length,
          ),
        );
        return null;
      }
    },
    [
      applyUpdates,
      brief,
      documentSuggestion,
      dropSaying,
      finishSaying,
      markDocumentsSuggested,
      progressNote,
      readFailureText,
      sayWhile,
      setError,
      t,
    ],
  );

  /**
   * One sentence about the files that were turned away (T20, Decision 15).
   *
   * The rules live in `lib/intake/accepted-files.ts` so the `accept` attribute
   * on every picker and the check that runs after it cannot disagree. What is
   * here is the sentence, because the sentence is the point.
   *
   * Rejections are grouped by reason rather than listed one per line. A client
   * who drags a folder of eleven things gets one line about the two Word files
   * and one about the archive, not eleven lines; and each line carries the next
   * step that actually applies, which is the whole reason `word` and
   * `imageFormat` are separate reasons from `type`. Carrying on by talking
   * instead is always available, and is the thing a dead end fails to mention.
   */
  const reportRejections = useCallback(
    (rejected: readonly RejectedFile[]) => {
      if (rejected.length === 0) {
        setError(null);
        return;
      }

      const firstOf = (reason: FileRejection) =>
        rejected.filter((one) => one.reason === reason);
      const names = (group: readonly RejectedFile[]) =>
        group.map((one) => one.name).join(', ');

      const lines: string[] = [];
      const byReason: [FileRejection, (group: RejectedFile[]) => string][] = [
        [
          'word',
          (group) =>
            t('upload.wordFile', { names: names(group), count: group.length }),
        ],
        [
          'imageFormat',
          (group) =>
            t('upload.imageFormat', {
              names: names(group),
              count: group.length,
            }),
        ],
        [
          'type',
          (group) =>
            t('upload.wrongType', { names: names(group), count: group.length }),
        ],
        [
          'size',
          (group) =>
            t('upload.tooBig', {
              names: names(group),
              count: group.length,
              limit: Math.round(MAX_FILE_BYTES / (1024 * 1024)),
            }),
        ],
        [
          'empty',
          (group) =>
            t('upload.emptyFile', { names: names(group), count: group.length }),
        ],
        [
          'count',
          (group) =>
            t('upload.tooMany', { names: names(group), limit: MAX_FILES }),
        ],
        [
          'total',
          (group) =>
            t('upload.tooMuch', {
              names: names(group),
              limit: Math.round(MAX_TOTAL_BYTES / (1024 * 1024)),
            }),
        ],
      ];

      for (const [reason, line] of byReason) {
        const group = firstOf(reason);
        if (group.length > 0) lines.push(line(group));
      }

      setError(lines.join(' '));
    },
    [setError, t],
  );

  /** The gate itself: what will be read, and a sentence about what will not. */
  const acceptFiles = useCallback(
    (
      files: File[],
      /** Files already staged, which count against the same limits. */
      staged: readonly { size: number }[] = [],
    ): AcceptedFile[] => {
      const { accepted, rejected } = chooseFiles(files, staged);
      reportRejections(rejected);
      /*
       * The viewer's library is filled here rather than at each call site,
       * because this is the only place a file is ever accepted — staged before
       * sending, dropped mid-conversation, or handed over after submission all
       * come through here. `addFiles` is idempotent by name and size, which it
       * has to be: this runs inside a `setStagedFiles` updater, and React calls
       * those twice in development.
       */
      addDocuments(accepted);
      return accepted;
    },
    [addDocuments, reportRejections],
  );

  /**
   * Documents attached before submission, staged rather than read.
   *
   * Additive across drops. A client who drops the MSA, then remembers the order
   * form, is adding to a set rather than replacing it, and the limits are
   * checked against what is already staged so the total cannot be walked past
   * one drop at a time.
   *
   * The same on the opening screen and mid-conversation. There used to be a
   * second handler for the mid-conversation case that read the file on arrival
   * (see `stagedFiles`); the read now happens on send, where the client's own
   * words go with it.
   */
  const stageFiles = useCallback(
    (files: File[]) => {
      setStagedFiles((current) => {
        const accepted = acceptFiles(
          files,
          current.map((one) => ({ size: one.file.size })),
        );

        /*
         * The same file dropped twice is staged once.
         *
         * Clients re-drop: they lose track of whether the first attempt landed
         * and try again. Two identical rows in the dock reads as a bug, and
         * sending the same contract to the extractor twice pays for it twice.
         * Keyed by name because that is what the client is looking at, and it
         * is what makes the dock's ids unique, which removal depends on.
         */
        const staged = new Set(current.map((one) => one.file.name));
        const added = accepted.filter((one) => !staged.has(one.file.name));
        if (added.length === 0) return current;

        return [...current, ...added];
      });
    },
    [acceptFiles],
  );

  /**
   * A document handed over after the case was sent (Decision 24).
   *
   * Clients do this, and in the old flow it went nowhere: the agent was gone
   * and the case page had no way to take a file. So the channel stays open, and
   * this is the whole behaviour: the file is acknowledged in the chat that is
   * still on screen, and it is listed on the confirmation.
   *
   * It deliberately does not extract. Every value on a sent brief has been
   * agreed and the case is with the firm; reopening it to propose changes from
   * a late document would be changing a record after the fact. What happens to
   * the file is a matter for the case, and the sentence says so rather than
   * pretending something was read.
   */
  const onAttachAfterSubmit = useCallback(
    (files: File[]) => {
      const accepted = acceptFiles(files);
      if (accepted.length === 0) return;
      const names = accepted.map((one) => one.file.name);
      setAddedDocuments((current) => [
        ...current,
        ...names.map((name, index) => ({
          id: `d_${Date.now()}_${index}`,
          name,
        })),
      ]);
      // One sentence for the batch, not one per file: three documents added in
      // one action is one thing the client did.
      const line = t('sent.documentReceived', {
        names: names.join(', '),
        count: names.length,
      });
      say(line);

      /*
       * And onto the case itself, which is where that sentence says the file is
       * going. Listing it on the confirmation and nowhere else would make the
       * sentence false the moment the client navigated away.
       *
       * The sentence goes with it. The case thread is the continuation of this
       * conversation, and a document appearing there with nothing said about it
       * is the silence Decision 24 exists to close.
       */
      addSubmittedCaseDocuments(SUBMITTED_CASE.id, names, [
        { role: 'moritz', text: line, at: new Date().toISOString() },
      ]);
    },
    [acceptFiles, say, t],
  );

  /**
   * The `outcome` answer, given after the case was sent (item 7).
   *
   * Three things happen and the order is the point. The client's words go into
   * the transcript as theirs, verbatim; they go onto the case, because the
   * block that asked for them promised they would reach the lawyer pricing the
   * work; and Moritz says where they went.
   *
   * What it deliberately does not do is write to the brief. The brief is sealed
   * and every value on it was agreed on the review screen — the client would be
   * entitled to read a sent case as a record rather than as something that can
   * still change under them. This is the same rule the late-document path
   * follows, and the same one Garzai describes on the real system: the material
   * reaches drafting through the case, not by editing the case notes.
   *
   * No model turn either. The answer to "what would a good result look like" is
   * not a question, and a reply generated for it would be Moritz having an
   * opinion about the client's own objective.
   */
  const addOutcomeAfterSubmit = useCallback(
    (text: string) => {
      const at = new Date().toISOString();
      const acknowledgement = t('sent.oneMore.outcome.done');
      sayClient(text);
      say(acknowledgement);
      addSubmittedCaseTurns(SUBMITTED_CASE.id, [
        { role: 'client', text, at },
        { role: 'moritz', text: acknowledgement, at },
      ]);
    },
    [say, sayClient, t],
  );

  /**
   * Where a file goes, however it arrived (T19, Decisions 9 and 20).
   *
   * Every way in comes through here — dropped on the page, dropped on the
   * composer, picked with the paperclip — because the destination is a fact
   * about the phase and not about the gesture. It used to be the window's
   * handler only, and the composer routed its own files with a shorter rule
   * that knew about the opening screen and nothing else; the paperclip on the
   * confirmation therefore ran extraction over a brief that was already a
   * record.
   *
   * The guard half is unconditional and lives in the hook: cancelling the
   * browser's default for a dropped file is what stops a near miss from
   * replacing the page with a PDF viewer and taking the conversation with it.
   * That was the actual defect. "Drop anywhere" is what the guard makes
   * possible once the default is dead.
   *
   * Where the file goes depends on the phase, and the two destinations are
   * genuinely different actions rather than one with a flag. Before submission
   * the file is *held* until send, so the document and the client's description
   * arrive together and are read as one thing (A, Decision 1) — on the opening
   * screen and mid-conversation alike, because attaching is not sending in
   * either. After submission it is acknowledged and listed, never extracted,
   * because the brief is a record by then (Decision 24).
   *
   * `sending` takes nothing. There is no button on screen in that state for the
   * same reason: the case is in the act of being submitted and its contents
   * must not change underneath it (Decision 8).
   */
  const receiveFiles = useCallback(
    (files: File[]) => {
      // Checked here rather than only on the window's `enabled` flag, which
      // now covers one of the three ways in. The rule is about the case, not
      // about where the client let go of the file.
      if (phase === 'sending') return;
      /*
       * `quoted` routes with `sent`, not with the intake.
       *
       * Both are past submission, so a document dropped in either goes to the
       * case rather than into the brief — and the brief is read-only by then
       * (`isSubmitted`), so extracting into it would spend a model call writing
       * values nothing can display. `isSubmitted` is the test rather than two
       * literals, so a seventh phase cannot be added and silently miss this.
       */
      if (isSubmitted(phase)) {
        onAttachAfterSubmit(files);
        return;
      }
      stageFiles(files);
    },
    [onAttachAfterSubmit, stageFiles, phase],
  );

  /*
   * One drag, one target (Decision 9, settled).
   *
   * This is now the only thing on the screen that reacts to a held file. The
   * composer used to light up on its own while the cursor was over it and the
   * page lit up everywhere else, so one file crossing one screen produced two
   * different animations and a handoff between them — which reads as a page
   * that cannot decide what it wants. The page-wide one is the one kept,
   * because it is true wherever the file is let go, and that is the whole of
   * "drop anywhere"; the composer's version was only ever true over one
   * element. `chat-column.tsx` turns that highlight off, and every drop still
   * arrives here and routes through `receiveFiles`.
   */
  const { dragging } = useWindowDrop({
    onFiles: receiveFiles,
    enabled: phase !== 'sending',
  });

  /**
   * Send a turn: extract first, then ask, with the brief between them.
   *
   * The order is the whole point of D6. Extraction lands its fields, the turn
   * call is handed that brief explicitly, and so it asks about what is *still*
   * missing instead of walking a script through questions the contract already
   * answered.
   *
   * Every send before submission goes through here, not just the first one.
   * With nothing staged it is a plain `send`, so the cost is a branch; with
   * something staged the client's message and their document travel together,
   * which is what it means for attaching not to be sending. The mid-conversation
   * drop used to extract on arrival and reply on its own, and the second half of
   * that was the visible bug: a turn answering a document the client had not
   * sent, arriving over the message they were still writing.
   *
   * The read stays silent (`announce: false`) because this turn is the reply.
   * The client is not left with nothing while it runs — their file sits in the
   * composer's dock with a spinner on it (`runExtraction` sets that), and the
   * read's own step is handed to the turn below so the work still lands on the
   * rail where it happened.
   */
  const sendWithStaged = useCallback(
    async (text: string) => {
      const staged = stagedFiles;
      if (staged.length === 0) {
        void send(text);
        return;
      }

      setStagedFiles([]);
      // Recorded on the client's own turn, so the transcript shows what they
      // handed over with the message rather than just that something happened.
      const sent = staged.map((one) => ({
        name: one.file.name,
        size: one.file.size,
      }));
      const read = await runExtraction(staged, false, text);
      await send(
        text,
        sent,
        read === null ? undefined : applyFieldUpdates(brief, read.fields),
        // Item 7, carried as the aside on the turn the call is about to write,
        // so the opening move gets the suggestion without Moritz taking two
        // turns in a row to deliver it, and without it landing between his
        // question and the chips that answer it.
        read?.suggest ?? null,
        /*
         * The read that just happened, so the reply's rail starts with it (L1).
         *
         * This read was deliberately silent — the turn call about to run is
         * what replies, and a waiting Moritz turn here would be replaced by
         * another one a second later. Silent was right for the transcript and
         * wrong for the record: dropping a contract in with the first message
         * is the path most clients take, and it was the one path where the
         * longest wait in the flow left nothing behind.
         */
        read?.step ? [read.step] : undefined,
      );
    },
    [brief, stagedFiles, runExtraction, send],
  );

  // ------------------------------------------------- the brief speaks up

  /**
   * An Accept or an Edit in the brief answers Moritz in the chat.
   *
   * The two surfaces were one decision presented twice. Moritz would ask "I've
   * got Apple as the employer, does that look correct?", the client would tap
   * Accept on the right, and the conversation would sit there waiting for them
   * to type "yes" as well. One decision, two actions, and the second one
   * pointless.
   *
   * So the panel talks. Batched, because a client working down three extracted
   * values in a row means one message, not three: every tap restarts a short
   * timer and the whole batch goes as a single sentence.
   *
   * Only while the conversation is live. On the review screen accepting *is*
   * the review, there is nothing left to ask, and narrating it back would be
   * noise at the moment the client is trying to read.
   *
   * Note the direction this does NOT go. Typing "yes" at Moritz will not
   * confirm a value the model proposed. A value the client states themselves
   * arrives tagged `client` and auto-approves already, which is the honest
   * version of the same shortcut; inferring consent from free text is the one
   * hole that lets a wrong party name reach a lawyer, and the confirm gate is
   * the only thing standing in front of it (Decision 5, invariant 1).
   */
  type BriefEdit = {
    label: string;
    value: string;
    kind: 'accepted' | 'edited';
  };
  const pendingEdits = useRef<BriefEdit[]>([]);
  const announceTimer = useRef<number | null>(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(
    () => () => {
      if (announceTimer.current !== null) {
        window.clearTimeout(announceTimer.current);
      }
    },
    [],
  );

  const announceBriefEdits = useCallback(() => {
    const batch = pendingEdits.current;
    if (batch.length === 0) return;
    pendingEdits.current = [];

    const accepted = batch.filter((edit) => edit.kind === 'accepted');
    const edited = batch.filter((edit) => edit.kind === 'edited');
    const sentences: string[] = [];

    /*
     * Every field, named, with no cap — and that is deliberate (L10).
     *
     * The review notice three rows up *does* cap its list at three and admits
     * the overflow, because it is a summary: it exists to point the client at
     * rows that are one glance below it. These two sentences are not summaries.
     * They go into the transcript, which `case-transcript.ts` copies onto the
     * case at submission, so they are the client's own statement of what they
     * checked and what they changed — read later by a lawyer who has no other
     * account of it.
     *
     * "and 4 more" in a record is a record with four things missing. So the
     * rule is: cap a summary, never cap a record. Worth writing down, because
     * applying the cap uniformly is the obvious tidy-up and it would quietly
     * shorten the one artefact here that has to be complete.
     */
    if (accepted.length > 0) {
      sentences.push(
        t('brief.checkedInChat', {
          count: accepted.length,
          fields: accepted.map((edit) => edit.label).join(', '),
        }),
      );
    }
    if (edited.length > 0) {
      sentences.push(
        t('brief.correctedInChat', {
          count: edited.length,
          changes: edited
            .map((edit) => `${edit.label} to "${edit.value}"`)
            .join(', '),
        }),
      );
    }

    void send(sentences.join(' '));
  }, [send, t]);

  /**
   * 700ms after the last tap, and not while a turn is already streaming.
   *
   * `send` drops a message outright when it is busy, so firing mid-stream would
   * lose the batch silently rather than delay it.
   */
  const scheduleBriefAnnouncement = useCallback(() => {
    if (announceTimer.current !== null) {
      window.clearTimeout(announceTimer.current);
    }
    const fire = () => {
      announceTimer.current = null;
      if (busyRef.current) {
        announceTimer.current = window.setTimeout(fire, 400);
        return;
      }
      announceBriefEdits();
    };
    announceTimer.current = window.setTimeout(fire, 700);
  }, [announceBriefEdits]);

  /** True only where narrating a change back into the chat helps. */
  const chatIsListening = phase === 'building';

  /**
   * Item 14: who this was prepared with, and when.
   *
   * Dated off `savedAt` rather than the clock, so the signature is the moment
   * the document last changed rather than the moment it was last painted. A
   * file note whose time ticked forward while the client sat reading it would
   * be the one element on the panel actively lying about the document.
   *
   * `null` until the first save, which is also what keeps it off the server
   * render: `savedAt` starts null, so there is no timestamp in the HTML for a
   * client-side clock to disagree with.
   */
  const preparedWith = useMemo(
    () =>
      savedAt === null
        ? null
        : { name: clientFullName(), timestamp: fileNoteTimestamp(savedAt) },
    [savedAt],
  );

  const onBriefConfirm = useCallback(
    (key: string) => {
      const field = brief.fields.find((one) => one.key === key);
      confirm(key);
      // A field that was already settled is not an event, so it is not news.
      if (!chatIsListening || !field || field.value === null || field.confirmed)
        return;
      pendingEdits.current.push({
        label: field.label.toLowerCase(),
        value: field.value,
        kind: 'accepted',
      });
      scheduleBriefAnnouncement();
    },
    [brief.fields, chatIsListening, confirm, scheduleBriefAnnouncement],
  );

  const onBriefEdit = useCallback(
    (key: string, value: string) => {
      const field = brief.fields.find((one) => one.key === key);
      confirm(key, value);
      if (!chatIsListening || !field || field.value === value) return;
      pendingEdits.current.push({
        label: field.label.toLowerCase(),
        value,
        kind: 'edited',
      });
      scheduleBriefAnnouncement();
    },
    [brief.fields, chatIsListening, confirm, scheduleBriefAnnouncement],
  );

  // ----------------------------------------------------------------- recap

  // Name the case once every required field has a value. Runs once, a title
  // is a name, not a live readout, and it stays renameable afterwards.
  const recapRequested = useRef(false);
  /**
   * Item 16: the recap is a wait, so it is named like one.
   *
   * It is the only wait in the flow that happens somewhere other than the
   * chat, and it used to be the only one with no indication at all: the brief
   * sat under its fallback heading while a call was out naming the case. State
   * rather than a derived `title === null`, because that is also true before
   * the call starts and long before it is ever going to.
   */
  const [recapPending, setRecapPending] = useState(false);
  useEffect(() => {
    if (
      !canEnterReview(brief) ||
      brief.title !== null ||
      recapRequested.current
    )
      return;
    recapRequested.current = true;
    setRecapPending(true);

    void (async () => {
      try {
        const response = await fetch('/api/recap', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ brief }),
        });
        const result = (await response.json()) as {
          title?: string;
          description?: string;
        };
        if (!response.ok) return;
        setRecap({
          ...(typeof result.title === 'string' ? { title: result.title } : {}),
          ...(typeof result.description === 'string'
            ? { description: result.description }
            : {}),
        });
      } catch {
        // A missing title is survivable; the confirmation falls back to the
        // matter type rather than blocking the client.
      } finally {
        // In `finally` so a failed or rejected call takes the label down too.
        // A wait that is named and never ends is worse than one that was never
        // named: it says work is happening that has in fact stopped.
        setRecapPending(false);
      }
    })();
  }, [brief, setRecap]);

  // ------------------------------------------------------------------ demo

  useEffect(() => {
    if (!hydrated) return;
    const seed = demoSeed(
      new URLSearchParams(window.location.search).get('demo'),
    );
    if (!seed) return;
    if (brief.fields.some((field) => field.value !== null)) return;

    applyUpdates(seed.updates);
    for (const key of seed.confirmKeys) confirm(key);
    // A correction goes through `confirm` with a value, which is what a client
    // typing over an extracted value does, so the superseded value and the
    // disagreement it records are produced rather than fabricated.
    for (const correction of seed.corrections) {
      confirm(correction.key, correction.value);
    }
    if (seed.confirmAll) confirmAll();
    if (seed.recap) setRecap(seed.recap);
    if (seed.quote) setQuoteOutcome(seed.quote);

    // A message as well, so the demo opens in the conversation view where the
    // brief actually lives. Seeding only the brief would land on the opening
    // screen, which shows the outline and none of the rows being reviewed.
    /*
     * A lookup rather than a nested ternary, and not for readability.
     * `copy-keys.test.ts` reads the quoted strings out of the first argument of
     * every `t(...)` to check they resolve, and it handles one level of ternary
     * by taking everything after the first `?` — so a second condition inside
     * the branches puts `'quoted'` in front of it as a key, and the guard goes
     * red on `intake.quoted`. Worth keeping the guard strict and writing the
     * call plainly rather than the other way round.
     */
    say(t(DEMO_SEED_MESSAGE[seed.stage]));
    setStage(seed.stage);

    /*
     * The document the seeded brief quotes, put in the library as though the
     * client had attached it.
     *
     * Without this the demo's two document rows cite a file that is not there,
     * so "show this in the document" can only apologise — on the one feature
     * whose whole claim is that a value can be traced to the page it came from.
     * It is the real file from `public/demo`, the same one the seeded quotes
     * were cut from and the same one `demo-brief.test.ts` checks them against,
     * so nothing here is a mock of provenance: it is the provenance, arriving
     * by a different door.
     */
    void (async () => {
      try {
        const response = await fetch(DEMO_DOCUMENT.path);
        if (!response.ok) return;
        const blob = await response.blob();
        addDocuments([
          {
            file: new File([blob], DEMO_DOCUMENT.name, {
              type: DEMO_DOCUMENT.mediaType,
            }),
            kind: 'pdf',
            mediaType: DEMO_DOCUMENT.mediaType,
          },
        ]);
      } catch {
        // A demo that cannot reach its own fixture still demos everything
        // else; the source links fall back to saying the file is not open.
      }
    })();
    // Seed once, on arrival, when the brief is still empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ----------------------------------------------------------- source links

  /**
   * The fallback for a source that cannot show its passage.
   *
   * Most of this job moved into the row itself (L3). A verified document value
   * now carries the passage it was read from — the line before, the line
   * itself, the line after, cut verbatim from the PDF's own text layer — and
   * clicking the source opens that in place, so "check this" is something the
   * client can actually do. See `brief-field-row.tsx`.
   *
   * This is what is left: a verified quote the locator could not place in the
   * text. `verify-source.test.ts` asserts that cannot happen for anything the
   * verifier accepts, so reaching this is a bug rather than a state — and the
   * click is acknowledged rather than swallowed, because a dead control on the
   * row where the client is being asked to stand behind a value is the worst
   * place in the flow for one.
   *
   * TODO(intake): the document viewer proper, when there is one. The passage
   * answers "is this real"; opening the file named in `sourceNote` at that page
   * with the quote highlighted answers "what else does this say", which is a
   * different and larger question and wants a real viewer rather than three
   * sentences.
   */
  const openSource = useCallback(
    (field: BriefField) => {
      if (field.sourceNote === null) return;

      /*
       * The note is what the extractor wrote — "Notice period clause, page 3 of
       * MSA.pdf" — so the document is found by the file name inside it, and the
       * quote goes along for the ride. The viewer looks those exact words up in
       * the page text and lights them up where they sit, which is the answer
       * the passage on the row could only gesture at.
       */
      const opened = openDocumentByName(field.sourceNote, {
        ...(field.sourceQuote !== null ? { quote: field.sourceQuote } : {}),
        fieldKey: field.key,
      });

      /*
       * What is left once documents survive a reload (see
       * `lib/intake/document-store.ts`): a note naming a file that is not in
       * this library. A case restored on another machine, or one whose bytes
       * went with a deleted draft. Saying which document, and that the firm
       * has it, is the honest version — and it is a real state rather than an
       * unbuilt one.
       */
      if (!opened) {
        toast(t('documents.sourceUnavailable', { name: field.sourceNote }));
      }
    },
    [openDocumentByName, t],
  );

  /**
   * A document opened from the transcript, by file name.
   *
   * The chips in the conversation carry only a name and a size — a turn goes
   * to `localStorage` and `File` bytes cannot — so this is the same lookup the
   * brief's source links use, from the other side of the screen. The bytes are
   * found the same way too: the library is restored from IndexedDB on mount
   * (see `lib/intake/document-store.ts`), so a chip in a reloaded conversation
   * opens the document it names instead of apologising for it. It still
   * apologises when the file genuinely is not here, which is a different and
   * much rarer thing.
   */
  const openDocumentNamed = useCallback(
    (name: string) => {
      if (openDocumentByName(name)) return;
      toast(t('documents.sourceUnavailable', { name }));
    },
    [openDocumentByName, t],
  );

  /**
   * What the brief took from the document currently open.
   *
   * Read off the brief rather than tracked alongside it: a field already
   * records the document it was read from and the words it was read from, both
   * verified server-side, so the list of citations for a document is a view of
   * the brief and cannot fall out of step with it.
   */
  const documentCitations = useMemo((): readonly DocumentCitation[] => {
    const open = documents.active;
    if (open === null) return [];
    const name = open.name.toLowerCase();
    return brief.fields
      .filter(
        (field) =>
          field.value !== null &&
          field.sourceNote !== null &&
          field.sourceNote.toLowerCase().includes(name),
      )
      .map((field) => ({
        fieldKey: field.key,
        label: field.label,
        quote: field.sourceQuote,
      }));
  }, [brief.fields, documents.active]);

  /**
   * The panel's answer to "open this at that passage", once it has tried.
   *
   * A quote that cannot be found is the interesting case and it has a real
   * cause: the value was read from a scan, so the words are in an image and
   * not in the text layer. The document is open either way — being on the
   * right document with an explanation beats being sent nowhere.
   */
  const onRevealHandled = useCallback(
    (found: boolean) => {
      if (!found && documents.active !== null) {
        toast(t('documents.sourceNotFound', { name: documents.active.name }));
      }
      clearDocumentReveal();
    },
    [clearDocumentReveal, documents.active, t],
  );

  /*
   * A width the client chose, kept honest when the window changes under it.
   *
   * A pinned number is pinned to a screen that was that size. Drag the
   * document wide on a 27in monitor, then put the browser on half the screen,
   * and the three tracks want more room than there is — the grid overflows and
   * the page grows a horizontal scrollbar, which is the one thing a reading
   * layout must never do. So the chosen width is clamped down to what still
   * fits, and only ever down: narrowing the window is not an instruction to
   * forget what they asked for, and widening it again leaves their number
   * where it was.
   */
  useEffect(() => {
    const grid = briefPaneRef.current?.parentElement;
    if (documents.mode !== 'docked' || !canDock) return;
    if (documents.width === null || !grid) return;

    const clamp = () => {
      const chosen = documents.width;
      if (chosen === null) return;
      /*
       * The brief is not in the negotiation. On a window that has just been
       * made smaller, something has to give, and it is the document going back
       * towards its default rather than the brief being pushed under the width
       * its rows need — which is the same priority the drag itself has, applied
       * to a change the client did not make by dragging.
       */
      /*
       * `gridTrackWidth`, not the grid's own width: while a document is
       * docked the grid reserves a left gutter for the journey rail, and a
       * clamp that counted it would let the panel grow into the rail and push
       * the conversation below its floor to pay for it.
       */
      const room = gridTrackWidth(grid) - briefWidth - chatFloor;
      const max = Math.max(MIN_DOCUMENT_WIDTH, Math.round(room));
      if (chosen > max) setDocumentWidth(max);
    };

    clamp();
    const observer = new ResizeObserver(clamp);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [
    briefWidth,
    canDock,
    chatFloor,
    documents.mode,
    documents.width,
    setDocumentWidth,
  ]);

  /** Shared by the docked column and the overlay — one panel, two seats. */
  const documentPanelProps =
    documents.active !== null
      ? {
          tabs: documents.tabs,
          active: documents.active,
          citations: documentCitations,
          reveal: documents.reveal,
          onRevealHandled,
          onSelect: documents.select,
          onCloseTab: documents.closeTab,
          onClose: documents.close,
          onMaximise: documents.maximise,
          onMinimise: documents.minimise,
          /*
           * Whether minimising has a column to land in. The effect above
           * re-maximises anything docked without room, so passing this lets
           * the panel hide a toggle that the shell would only undo.
           */
          dockable: canDock,
        }
      : null;

  /**
   * The parts of the feature that are not a column: the handle on the edge of
   * the screen, and the overlay.
   *
   * `null` on the opening screen (see `documentsReachable`), and rendered in
   * every phase after it. The docked column is the only piece that belongs to
   * the grid, and it stays there.
   */
  /**
   * The documents the client has actually handed over.
   *
   * `acceptFiles` puts every accepted file into the viewer's library the
   * moment it is picked, because that is the only place a file is ever
   * accepted and the library is what the composer's chips open. But a file
   * sitting in the composer's dock has not been *given* to us yet — it is
   * staged, waiting for the client to press send with it — and counting it
   * here is what put the edge tab on screen the instant somebody attached
   * something, offering a panel for a document they had not sent.
   *
   * So the rail counts the library minus whatever is still staged. Attaching
   * changes nothing on the edge of the screen; sending is what makes the
   * document a thing there is a surface for.
   */
  const stagedNames = useMemo(
    () => new Set(stagedFiles.map((one) => one.file.name)),
    [stagedFiles],
  );
  const handedOver = useMemo(
    () => documents.documents.filter((one) => !stagedNames.has(one.name)),
    [documents.documents, stagedNames],
  );

  /**
   * Open whatever the client last looked at, or the newest document they have
   * handed over. Shared by both of the triggers below.
   */
  const openDocumentPanel = useCallback(() => {
    const last = documents.active ?? documents.tabs.at(-1) ?? handedOver.at(-1);
    if (last) documents.open(last.id);
  }, [documents, handedOver]);

  /**
   * Whether there is a document panel to be opened at all.
   *
   * Read by the two triggers, which are the only things that draw it now.
   * The edge tab is gone — see `documents-trigger.tsx` for why, and for what
   * replaced it.
   */
  const documentTriggerShowing =
    documentsReachable && documents.mode === 'closed' && handedOver.length > 0;

  const documentSurface = !documentsReachable ? null : (
    <>
      {/*
       * The way back in, on the edge the panel comes out of.
       *
       * Hidden while the panel is open — it is the handle on a closed drawer,
       * and a handle beside an open one is a second control for something
       * already done.
       *
       * `max-lg:hidden`, which is the whole of the fix that was made here.
       * The tab is `fixed`, so on a phone it landed on top of a sentence and
       * the only way to stop that was a 56px gutter held open down the right
       * of both panes — which moved the transcript and the composer
       * off-centre for the rest of the flow. From `lg` up the panes already
       * carry a `lg:pr-*` gutter and the tab sits in it, costing nothing; so
       * the tab keeps the desktop, the composer's toolbar button takes the
       * phone (`documents-trigger.tsx`), and neither width has a control
       * sitting on the words.
       */}
      {documents.mode === 'closed' && handedOver.length > 0 && (
        <DocumentRailTrigger
          count={handedOver.length}
          onOpen={openDocumentPanel}
          className="max-lg:hidden"
        />
      )}

      {documents.mode === 'maximised' && documentPanelProps !== null && (
        <DocumentOverlay {...documentPanelProps} />
      )}
    </>
  );

  // ---------------------------------------------------------------- render

  /**
   * What the composer shows docked: whatever is being read, or whatever is
   * staged and waiting for the client to press send.
   *
   * One derived value rather than a second piece of state, so removing a file
   * has exactly one place to remove it from.
   */
  /*
   * The composer's docked file chips, carrying their own glyph (§1 #8).
   *
   * `ChatComposer` has always rendered `attachment.icon` and
   * `attachment.iconClassName` — its own type comments them as "a per-file-type
   * token like `text-red-600`" — and both sides of this expression were built
   * without either, so the composer fell back to a generic page icon in slate.
   * The gap was upstream of the component that looked wrong, which is why it
   * survived: nothing in the composer was broken.
   *
   * `describeFile` is the same map the case pages and the document viewer use,
   * so a contract dropped into the composer is the red PDF it will still be on
   * the case page at the other end of the flow.
   */
  const withGlyph = (attachment: ComposerAttachment): ComposerAttachment => {
    const { Icon, colorClass } = describeFile(attachment.name);
    return { ...attachment, icon: Icon, iconClassName: colorClass };
  };

  const dockedAttachments: ComposerAttachment[] = (
    attachments.length > 0
      ? attachments
      : stagedFiles.map((one) => ({
          id: `staged_${one.file.name}`,
          name: one.file.name,
        }))
  ).map(withGlyph);

  /**
   * Whether what is docked is a message in itself.
   *
   * Staged files are: dropping a contract and pressing send with nothing typed
   * is a real opening move, and the turn goes out with the documents and no
   * words. Files being read are not — the read is already under way, there is
   * nothing for send to do, and a live Send button that does nothing when
   * pressed is the defect this distinguishes.
   */
  const dockedCanSend = attachments.length === 0 && stagedFiles.length > 0;

  /*
   * The one lawyer this flow claims is involved.
   *
   * `IntakeLawyerNote`, the Talk-to-a-person dialog, the handoff card on the
   * case and the quote all resolve through `leadForMatter`, so a client cannot
   * be told two different people are looking at their matter.
   *
   * Declared here rather than beside the quote, which is where it used to sit:
   * `onTalkToAPerson` now records *who* the message went to, so the lead has to
   * exist before the callback that closes over it.
   */
  const lead = leadForMatter(matterId);

  const leadFirstName = lead
    ? (lead.name.split(' ')[0] ?? lead.name)
    : t('email.fallbackName');

  /**
   * The quote arrives, and the client is told three ways (item 78, item 59).
   *
   * Announced in the chat because Garzai says that is where it lands — "customer
   * get a link with quota in the intake chat, they pay it there" — raised on the
   * bell because the confirmation told them they could close the tab and that
   * has to be true, and rendered as the card in the panel because that is where
   * every other decision about this case has been made.
   *
   * Keyed on the stage rather than chained inside `submitCase`, so the lawyer's
   * name resolves the same way every other surface resolves it. Chaining it
   * would have meant reading `leadForMatter` from a closure created before the
   * matter was known.
   */
  /*
   * Moritz says he is still there, once, at the moment the case goes (item 3).
   *
   * The left column after submission held one message and a great deal of
   * white, and the composer under it was live and unlabelled. That is the
   * shape of an abandoned screen, not a waiting room, and it was the reason
   * the concierge mode nobody could see might as well not have been built.
   *
   * A ref rather than a dependency on the message list, because this must fire
   * exactly once per sent case: keyed on anything derived from the transcript
   * it would re-fire on the reply it triggers. It is also the reason the line
   * is said here rather than inside `submitCase` — `?demo=sent` never calls
   * that, and a reviewer landing straight on the confirmation is precisely who
   * needs to see that the chat is still alive.
   */
  const saidWaitingIntro = useRef(false);
  useEffect(() => {
    if (stage !== 'sent' || saidWaitingIntro.current) return;
    saidWaitingIntro.current = true;
    say(t('sent.chatIntro'));
  }, [say, stage, t]);

  /**
   * The quote arriving, on request rather than on a clock (§3, Step F).
   *
   * ───────────────────────────────────────────────────────────────────────────
   * THIS WAS A TWELVE-SECOND TIMER, AND THE TIMER HAD TO GO.
   * ───────────────────────────────────────────────────────────────────────────
   *
   * `QUOTE_ARRIVES_MS = 12_000`, armed by every real submission. Twelve
   * seconds after Send, the confirmation replaced itself with the quote
   * screen on its own. The argument for it was good — the real trigger is an
   * event we do not have, a lawyer finishing a price some hours later, and a
   * short wait makes the arrival something that *happens to* the client
   * rather than a screen they were already on.
   *
   * What it did in practice is dissolve the last screen of the required flow
   * while the reviewer was reading it. The confirmation is the answer to the
   * brief's first complaint, and it had a twelve-second fuse on it.
   *
   * So the same three things happen in the same order, fired by a control the
   * reviewer presses instead:
   *
   *   1. the phase moves to `quoted`, which ticks the rail from "a lawyer
   *      prices the work" to "your price arrives here";
   *   2. Moritz says so in the chat, naming the lawyer who priced it;
   *   3. the bell raises it, with a face on it, and the card appears in the
   *      panel.
   *
   * The ordering is the point rather than an accident of how it was written:
   * a reviewer should watch the machinery work rather than arrive at a
   * finished state. See `sent-confirmation.tsx` for why the control has to
   * look like a prototype control and not a feature.
   *
   * `expectQuote` went with the timer. It existed to keep `?demo=sent` from
   * turning into `?demo=quote` on its own, and nothing arms itself any more —
   * the two demo states stay two demo states because only a press moves
   * between them. `?demo=quote` is still the second way in.
   */
  /**
   * The turn that announced the quote, so "Back to the confirmation" can take
   * it back with the phase. See `returnToConfirmation`.
   */
  const quoteLine = useRef<string | null>(null);

  const advanceToQuote = useCallback(() => {
    // Once. The control lives on the confirmation and the confirmation goes
    // when the phase moves, but a double-press inside one render should not
    // announce the same quote twice.
    if (stage !== 'sent') return;

    setQuoteOutcome('quoted');
    setStage('quoted');
    quoteLine.current = say(t('quote.arrivedChat', { name: leadFirstName }));
    raisePortalNotification(
      'NON_LEGAL',
      quoteReadyNotification({
        caseNumber: SUBMITTED_CASE.reference,
        caseTitle: brief.title ?? t('email.fallbackName'),
        href: SUBMITTED_CASE.href,
        title: t('notification.quoteTitle'),
        content: t('notification.quoteBody', {
          reference: SUBMITTED_CASE.reference,
        }),
        /*
         * The one notification in this flow with a face on it, and the reason
         * is in `quoteReadyNotification`: a person really did write this,
         * which is not true of the submission receipt.
         */
        lawyer: lead ? { name: lead.name, image: lead.imageUrl } : null,
      }),
    );
  }, [stage, say, t, leadFirstName, lead, brief.title]);

  /**
   * Back to the confirmation, for a reviewer who skipped ahead.
   *
   * The mirror of `advanceToQuote`, and it exists because a one-way door
   * strands people: the quote screen — and especially the accepted state
   * after "Accept and start", which is as far as this prototype goes — had no
   * way back to the last screen of the required flow except starting a case
   * again.
   *
   * It rewinds the conversation as well as the phase, and that is the half
   * that is easy to leave out. Without it the rail ticks back to "a lawyer
   * prices the work" while the chat two inches away still says the price
   * arrived, which is a contradiction on the screen a reviewer is judging.
   * See `rewindTo` for why that primitive is deliberately reachable only from
   * here.
   *
   * `quoteAccepted` is cleared too. It outlives the phase — it is plain state
   * rather than something derived from it — so a reviewer who accepted, went
   * back, and skipped ahead again would find the quote already accepted and
   * no way to press the button they came to look at.
   *
   * The bell is left alone. `QUOTE_READY_NOTIFICATION_ID` is fixed and the
   * mock store dedupes on it, so going forward a second time re-raises
   * nothing, and a notification that had genuinely arrived is not something a
   * rewind should be able to unsend.
   */
  const returnToConfirmation = useCallback(() => {
    if (quoteLine.current !== null) {
      rewindTo(quoteLine.current);
      quoteLine.current = null;
    }
    setQuoteAccepted(false);
    setQuoteOutcome(null);
    setStage('sent');
  }, [rewindTo]);

  const onQuoteResponse = useCallback(
    (response: QuoteResponse, message: string) => {
      const name = leadFirstName;

      if (response === 'approve') {
        /*
         * Item 46: accepting twice is not a thing a client can do.
         *
         * The guard is here rather than on the button because this is the
         * function that changes what the client owes. A disabled button is the
         * visible half and it is already handled by `accepted`; without this
         * half, a double-click or a return key held down sends two acceptances
         * and Moritz says the same sentence twice.
         */
        if (quoteAccepted) return;
        /*
         * ⭐ Three things, and §3's Step E is the list of what is *not* here.
         *
         * A line in the chat, a tick on the rail's "You accept it and pay"
         * row — `quoteAccepted` is what `caseStages` reads for that — and the
         * quote card settling into the terms that were agreed. No payment
         * screen, no disabled "Pay US$3,800 and start", no amount presented
         * as a thing still owed. Moritz's case page has a real "Pay invoice"
         * control and "Go to case" now lands on it; a greyed-out imitation of
         * a control they ship was the furthest this prototype ever strayed
         * from redesigning intake.
         */
        setQuoteAccepted(true);
        say(t('quote.approved', { name }));
        toast.success(t('quote.response.approve'));
        return;
      }

      sayClient(message);

      if (response === 'question') {
        say(t('quote.sentQuestion', { name }));
      } else if (response === 'part-only') {
        say(t('quote.sentPart', { name }));
      } else {
        /*
         * Read back off the message the card composed, which begins with the
         * chosen reason's own sentence. Compared against the copy rather than
         * threaded through as a second argument: the card already puts the
         * client's choice into the words that travel to the lawyer, and passing
         * the same fact twice is how the two come to disagree.
         */
        const holding = message.startsWith(t('quote.tooHigh.thinking'));
        say(
          t(holding ? 'quote.sentHolding' : 'quote.sentActionable', { name }),
        );
      }
    },
    [leadFirstName, quoteAccepted, say, sayClient, t],
  );

  /*
   * One composer, one send path, every phase.
   *
   * It used to take an `opening` flag to pick between the send that reads the
   * staged documents first and the one that does not. There is no longer a
   * choice to make: `sendWithStaged` is the send, and whether anything is
   * staged is a fact about the dock rather than about which screen is up.
   */
  const chatColumn = () => (
    <ChatColumn
      messages={messages}
      busy={busy}
      failure={failure}
      onRetry={retry}
      attachments={dockedAttachments}
      chipsByField={chipsByField}
      onSend={(text) => {
        void sendWithStaged(text);
      }}
      onChooseChip={(messageId, chipValue, label) => {
        chooseChip(messageId, chipValue);
        void send(label);
      }}
      onAttach={receiveFiles}
      onOpenDocument={openDocumentNamed}
      attachmentsCanSend={dockedCanSend}
      /*
       * The phone's way back into a document, beside the paperclip.
       *
       * The desktop keeps the edge tab (see `documentSurface` above); this is
       * the half of the pair for the widths with no gutter to spare. Two
       * candidates were built and compared in place for that half — this, and
       * a text control beside *Talk to a person* — and the toolbar won on the
       * count of things stacked under the input: the composer already has an
       * exit row under it and an action bar under that, and a third line
       * would have made the bottom of a phone four rows of chrome. It also
       * puts *attach a document* and *open a document* next to each other,
       * which is one subject. See `documents-trigger.tsx`.
       */
      {...(documentTriggerShowing
        ? {
            composerLeading: (
              <DocumentsTrigger
                count={handedOver.length}
                onOpen={openDocumentPanel}
                className="lg:hidden"
              />
            ),
          }
        : {})}
      /*
       * The way out, under the composer, in every phase (V22).
       *
       * Passed here rather than rendered beside the composer in each of the
       * three layouts, because "always visible" is a claim that has to be
       * structurally true rather than remembered three times. This component is
       * the only thing on screen in all of them.
       */
      beneathComposer={
        <div className="flex flex-col gap-3">
          {/*
           * The three questions, above the escape hatch and only once the case
           * has gone (items 3 and 4).
           *
           * Order matters here and it is the one thing to keep if this block is
           * ever rearranged: asking Moritz is the cheap thing to try and
           * talking to a person is the expensive one, so the cheap one comes
           * first. Reversed, the row reads as an apology for the chat.
           *
           * Gated on `submitted` rather than rendered always, because before
           * submission the flow already offers ready-made answers — the field
           * chips inside the transcript — and two chip rows on one screen, one
           * answering and one asking, is exactly the kind of ambiguity the
           * upload complaint came from.
           */}
          {submitted ? (
            <WaitingQuestions
              asked={askedQuestions}
              busy={busy}
              onAsk={(id, text) => {
                setAskedQuestions((current) => [...current, id]);
                void send(text);
              }}
            />
          ) : null}
          <TalkToAPerson matterId={matterId} />
        </div>
      }
      onRemoveAttachment={(id) => {
        // Removes that one file, not the whole set. The staged list is the only
        // source of truth and the dock is derived from it, so there is nothing
        // to keep in step.
        setStagedFiles((current) =>
          current.filter((one) => `staged_${one.file.name}` !== id),
        );
        // Clears the error too: a rejection the client has just acted on by
        // removing something should not keep telling them off.
        setError(null);
      }}
    />
  );

  const chat = chatColumn();

  /*
   * The bottom of the brief column, and the one place the primary action ever
   * appears. It stays in the same spot across all four phases so the client is
   * not hunting for the button that moved: the commercial sentence Decision 7
   * asks for sits above it, and what the button says changes with the phase.
   *
   * In `sending` there is no button at all. That is Decision 8 — the click has
   * happened and it must not be possible to make it happen twice — and it is
   * why this is a switch rather than a `disabled` prop.
   */
  /**
   * The commercial sentence, and the action, as two pieces.
   *
   * They used to be one `briefFooter` and on a desktop they still read as one
   * — the sentence sits directly above the button at the foot of the brief.
   * On a phone they now live in two different places, because they answer two
   * different questions at two different moments: the sentence is *what
   * happens when I send this*, which belongs with the brief it is about and is
   * read once; the button is *send it*, which has to be reachable at all
   * times and is the only thing in the bottom bar.
   *
   * Splitting them is also what stops the phone's action bar being three
   * lines of 10.5px disclaimer with a button under it, permanently occupying
   * the bottom fifth of a 390x844 screen.
   */
  /*
   * No stepper here any more. It is the left rail (`journey-rail.tsx`).
   *
   * This footer is inside a column that scrolls, and a stepper the client
   * has to scroll to find is not an answer to "where am I". The rail is
   * fixed to the window and is on screen for the whole flow, including the
   * confirmation, where this one used to be replaced by a second, longer
   * stepper saying the same thing in different words.
   */
  /*
   * The commercial sentence, and it has to change on `quoted` (G3).
   *
   * `quote.explanation` is written for a client who has not sent anything
   * yet ("when you send this, a lawyer reads it and prices the work"), and
   * `sent.quoteHere` for one who is waiting. Neither is true once the quote
   * has arrived, and leaving the default in place had the panel promising a
   * quote underneath the quote.
   */
  /*
   * 10.5px, which is the floor rather than a preference.
   *
   * Three sentences of explanation were the tallest thing in a footer whose
   * other two occupants — the stepper and the Send button — are the ones
   * the client acts on. `leading-[1.5]` is what keeps it readable at this
   * size: small type fails from tight leading before it fails from size,
   * and three wrapped lines at 10.5px/1.25 would be a block rather than
   * sentences. Smaller than this and it stops being copy and becomes a
   * disclaimer nobody reads, which would be a worse answer than cutting it.
   */
  const briefExplanation = (
    <p className="text-muted-foreground text-[10.5px] leading-[1.5]">
      {t(FOOTER_SENTENCE[phase])}
    </p>
  );

  /**
   * Whether the action row has to carry the documents button itself.
   *
   * ───────────────────────────────────────────────────────────────────────
   * THE GAP THIS CLOSES.
   * ───────────────────────────────────────────────────────────────────────
   *
   * On a phone the two panes are one at a time, and from `review` onwards the
   * brief opens itself (`briefLed`) because it is the only thing worth
   * reading — which hides the chat column, and with it the composer that
   * carries the documents button. So on the confirmation, on the review
   * screen and on the quote, a client who wanted to look again at the
   * contract they had just handed over had no way to: the composer was gone
   * and the edge tab is desktop-only by design.
   *
   * Keyed on `briefOpenOnMobile` rather than on the phase, because that is
   * the actual condition — *is the composer on screen right now* — and it
   * follows the client if they close the brief again, which puts the
   * composer and its button back. That keeps the one-control-per-width rule
   * intact: there is never a width or a state with two of these, or none.
   */
  const docsBesideAction = documentTriggerShowing && briefOpenOnMobile;

  /**
   * The primary action, with the documents button stacked to its left.
   *
   * A small square on the left, then the action taking everything that is
   * left — so the shape of the row still says which of the two is the thing
   * to press. It wraps only the button, never the sentence underneath it, so
   * "2 more answers and this opens" stays full width under the control it
   * explains rather than being indented past an icon.
   *
   * `lg:hidden` on the icon: from `lg` up the edge tab is the control and
   * this row is back to being one button wide.
   */
  const withDocsButton = (action: ReactNode) =>
    docsBesideAction ? (
      <div className="flex items-center gap-3">
        <DocumentsTrigger
          count={handedOver.length}
          onOpen={openDocumentPanel}
          className="shrink-0 lg:hidden"
        />
        <div className="min-w-0 flex-1">{action}</div>
      </div>
    ) : (
      action
    );

  const briefAction =
    phase === 'sending' ? (
      /*
       * Item 38. Was one spinner and one sentence, which is the complaint it
       * was built to answer arriving at the worst possible moment. See
       * `lib/intake/sending-steps.ts`.
       */
      <SendingSteps />
    ) : phase === 'sent' ? (
      withDocsButton(
        <Button asChild className="w-full">
          <Link href={SUBMITTED_CASE.href}>
            {t('sent.goToCase')}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>,
      )
    ) : phase === 'review' ? (
      <div className="flex flex-col gap-2">
        {withDocsButton(
          <Button
            type="button"
            className="w-full"
            disabled={!canSend(brief)}
            onClick={submitCase}
          >
            {t('send.action')}
          </Button>,
        )}
        {/*
         * Why the button is off. A disabled control with no explanation is
         * the version of this gate that makes people think it is broken.
         */}
        {canSend(brief) ? null : (
          <p className="text-muted-foreground text-center text-[11.5px]">
            {t('send.blocked', { count: blocking.length })}
          </p>
        )}
      </div>
    ) : phase === 'quoted' ? (
      /*
       * The one phase whose primary action is *not* in this footer, and the
       * exception is the point rather than an inconsistency.
       *
       * Everywhere else there is one thing to do next, so it belongs in the
       * one place the client has learned to look for it. On a quote there are
       * four, and they are a set: accept, ask, push back, ask for less. They
       * have to be read together and against the figure they are about, which
       * means they live on the card. A fifth full-width button down here
       * would read as the recommended one and would be competing with the
       * decision rather than supporting it.
       *
       * So this drops to the outline variant and becomes a way out of the
       * screen rather than a way through it.
       */
      withDocsButton(
        <Button asChild variant="outline" className="w-full">
          <Link href={SUBMITTED_CASE.href}>
            {t('sent.goToCase')}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>,
      )
    ) : (
      <div className="flex flex-col gap-2">
        {withDocsButton(
          <Button
            type="button"
            className="w-full"
            disabled={!canEnterReview(brief)}
            onClick={() => setStage('review')}
          >
            {t('quote.action')}
          </Button>,
        )}
        {/*
         * Why the button is off, on the phase where it is off for longest.
         *
         * `review` has carried this line from the start and `building` — the
         * whole middle of the flow — carried nothing, so the client's first
         * and longest encounter with the primary action was a grey rectangle
         * with no explanation under it. That is the state people read as
         * broken, and it is the state they are in for every turn of the
         * conversation until the last required row lands.
         *
         * `blocking` rather than a second count: it is the same list the gate
         * itself is computed from (`blockingFields`), so the sentence cannot
         * drift from the button it is under.
         */}
        {canEnterReview(brief) ? null : (
          <p className="text-muted-foreground text-center text-[11.5px]">
            {t('quote.blocked', { count: blocking.length })}
          </p>
        )}
      </div>
    );

  /** The two together: the desktop brief column's sticky foot. */
  const briefFooter = (
    <div className="flex flex-col gap-3">
      {briefExplanation}
      {briefAction}
    </div>
  );

  const briefPanel = (
    <BriefColumn
      brief={brief}
      hints={hints}
      receipts={receipts}
      progress={progress}
      /*
       * Item 3, but only while there is an intake to save. On the sent state
       * the brief is a record that has been handed over, and telling someone
       * their submitted case was just saved to their own browser is both
       * untrue in spirit and the wrong thing to draw their eye to.
       */
      savedAt={submitted ? null : savedAt}
      titlePending={recapPending}
      /*
       * Item 4, gated on the phase as well as on the key.
       *
       * `askingAbout` holds whatever the last turn said it wanted, and it is
       * still holding it when the client crosses into review. Marking a row as
       * "asking now" on a screen whose whole job is a final read of a finished
       * brief would be pointing at a question nobody is waiting on any more.
       */
      askingKey={phase === 'building' ? askingAbout || null : null}
      preparedWith={preparedWith}
      readOnly={submitted}
      /*
       * §3's progressive disclosure: the brief folds to one line once the
       * confirmation is on screen.
       *
       * `hasConfirmation`, not `submitted`, and the one phase between them is
       * the whole point. Through `sending` the brief is still the only thing
       * in this column — the confirmation does not exist yet and the sending
       * steps are four lines in the footer — so folding it there leaves an
       * empty panel with a "Show" link in it, at the exact moment the client
       * is watching for a sign that something is happening. It folds when
       * there is something to fold *behind*.
       *
       * Different claim from `readOnly` as well as different phases.
       * `readOnly` is whether the brief can still be changed, which closes on
       * the click; this is whether it is still the subject of the screen.
       */
      foldFields={hasConfirmation(phase)}
      /*
       * Kept through `sending` on purpose. Decision 18 asks for one change per
       * boundary, and the send boundary's change is the button becoming a line
       * — pulling the bar at the same moment makes it two. It goes at `sent`,
       * where the confirmation takes over the top of the panel anyway.
       */
      /*
       * Gone on both post-submission phases. The bar counts fields the client
       * has confirmed, which is a measure of work left to do; once the case has
       * been sent — and certainly once it has been priced — there is none, and a
       * full bar sitting above a quote is a progress indicator for a finished
       * thing.
       */
      showProgress={!isSubmitted(phase)}
      {...(phase === 'review'
        ? {
            notice: (
              <ReviewNotice
                unconfirmed={unconfirmed}
                onConfirmAll={confirmAll}
              />
            ),
          }
        : {})}
      {...(phase === 'sent'
        ? {
            notice: (
              <SentConfirmation
                brief={brief}
                matterId={matterId}
                addedDocuments={addedDocuments}
                onAttachDocument={onAttachAfterSubmit}
                onOpenDocument={openDocumentNamed}
                onOpenEmail={documents.openReader}
                onStartAnother={performRestart}
                /*
                 * Counted off the document library rather than
                 * `readDocuments`, and the difference is not academic.
                 *
                 * `readDocuments` is the list the submitted case is built
                 * from, filled by the receive path, and it is the right list
                 * for that job. It is the wrong one for this question, because
                 * a document can reach the case without going through that
                 * path — the demo seeds one directly, which is how the first
                 * version of this came to tell a reviewer looking at a case
                 * with a contract attached that we did not have the contract.
                 *
                 * The library is what the document tab counts and what the
                 * panel opens: if there is something in there, the client has
                 * given us a document, whatever route it took.
                 */
                documentCount={documents.documents.length}
                onAddOutcome={addOutcomeAfterSubmit}
                onSkipToQuote={advanceToQuote}
              />
            ),
          }
        : {})}
      /*
       * The quote, or the reason there is not one (G3, G2).
       *
       * In the brief column rather than in the transcript, even though Garzai
       * said the quote lands in the chat. Both are true here: Moritz announces
       * it in the chat, and the decision surface is the panel — which is where
       * every other decision about this case has been made, and where the
       * case's own status rows already are. The client is pricing the work
       * described in the brief, so the brief has to be readable while they
       * decide, and a card in a scrolling transcript is a decision that can
       * scroll away.
       */
      {...(phase === 'quoted' && quoteOutcome === 'quoted'
        ? {
            notice: (
              <div className="flex flex-col gap-6">
                <QuoteCard
                  fee={DEMO_QUOTE.fee}
                  currency={DEMO_QUOTE.currency}
                  covers={brief.description ?? brief.title ?? ''}
                  expires={quoteHeldUntil(quoteArrivedAt)}
                  lawyerFirstName={leadFirstName}
                  fields={brief.fields}
                  accepted={quoteAccepted}
                  onRespond={onQuoteResponse}
                />
                {/*
                 * The pipeline rail used to be repeated here, under the quote.
                 * It is in the left margin now, one row further on, and it has
                 * been on screen since the first message rather than appearing
                 * twice after the client presses Send.
                 */}

                {/*
                 * The way back, and it is rendered outside the card on
                 * purpose so it survives "Accept and start".
                 *
                 * `quoteAccepted` changes what `QuoteCard` draws inside
                 * itself; it does not change the phase. Putting the link here
                 * rather than in the card means the accepted state — the
                 * furthest this prototype goes, and the easiest place for a
                 * reviewer to get stranded — keeps it without the card having
                 * to know anything about prototype controls.
                 */}
                <PrototypeLink
                  action="backToConfirmation"
                  direction="back"
                  onClick={returnToConfirmation}
                />
              </div>
            ),
          }
        : {})}
      {...(phase === 'quoted' && quoteOutcome === 'no-quote'
        ? {
            notice: (
              <div className="flex flex-col gap-6">
                <NoQuoteNotice
                  reason="not-fixed-fee"
                  onSend={(message) => onQuoteResponse('question', message)}
                />
                {/* The same way back. This screen is a dead end too. */}
                <PrototypeLink
                  action="backToConfirmation"
                  direction="back"
                  onClick={returnToConfirmation}
                />
              </div>
            ),
          }
        : {})}
      /*
       * The face stays only while the brief is being filled in. At review the
       * client is checking values and the screen must not compete with that,
       * and at sent the rotating showcase takes over the same job with room to
       * do it properly.
       */
      {...(phase === 'building'
        ? {
            afterFields: (
              <IntakeLawyerNote
                matterId={matterId}
                askable
                className="border-border tall:pt-5 taller:pt-6 border-t pt-4"
              />
            ),
          }
        : {})}
      footer={briefFooter}
      mobileNote={briefExplanation}
      onConfirm={onBriefConfirm}
      onEdit={onBriefEdit}
      onUndo={undo}
      onOpenSource={openSource}
    />
  );

  /*
   * Page-wide feedback for the page-wide target. The words change with what the
   * drop will actually do: before submission the document is read into the
   * brief, after it the case takes it and the drafting team gets it. Saying
   * "I will read this" on the confirmation would promise something that
   * deliberately does not happen there.
   */
  const dropOverlay = dragging ? (
    <DropOverlay
      heading={t(isSubmitted(phase) ? 'drop.sentHeading' : 'drop.heading')}
      hint={t(isSubmitted(phase) ? 'drop.sentHint' : 'drop.hint')}
    />
  ) : null;

  const leaveDialogElement = (
    <LeaveIntakeDialog
      open={leaveDialog.open}
      onOpenChange={(open) =>
        setLeaveDialog((previous) => ({ ...previous, open }))
      }
      onCancel={() => {
        pendingHrefRef.current = null;
      }}
      onSaveDraft={onLeaveSaveDraft}
      onDiscard={onLeaveDiscard}
      reason={leaveDialog.reason}
    />
  );

  // Before anything is said, the composer is the whole point of the screen: one
  // centred column, with the brief below it as a boxed preview of what this
  // kind of matter needs. Once the conversation starts the split takes over and
  // the brief steps out of its box onto the page (Decision 18).
  if (phase === 'start') {
    return (
      /*
       * No rail on this screen, in either layout, and no tracker of any kind.
       *
       * It was here once, on the argument that "the client should never wonder
       * what step they are on" covers the step before they have started.
       * Looked at, that is wrong twice over: nothing has been started, so there
       * is no position to report, and a stepper standing beside an empty
       * composer is four labels claiming to track progress through a case that
       * does not exist yet. It also puts chrome around the one screen whose
       * whole design is a single centred column.
       *
       * A later attempt had the rail slide in on the first keystroke, taking
       * over from the card as the client typed. It read as the page snatching
       * the explanation away at the moment somebody was mid-sentence, and it
       * put a progress tracker on a case that still had not been sent. Both
       * versions failed for the same reason, so the rule is now flat: **the
       * rail belongs to the conversation, never to this screen.** It arrives
       * with the first reply, which is the first moment there is a position to
       * be in.
       *
       * What the rail would have carried here — that a person and a price are
       * on the other side of this — is already this screen's job and already
       * done better. `HowItWorksCard` says it in four steps, in the rail's own
       * words, so the client meets the vocabulary here and meets the tracker
       * when there is something to track. The lawyer note underneath says it
       * with a face.
       */
      <div className="tall:py-7 taller:py-10 mx-auto flex min-h-full w-full max-w-[940px] flex-col px-4 py-5 sm:px-6">
        {/*
         * `my-auto` rather than `justify-center`: it centres the column when
         * there is room, and quietly gives up when there is not, letting the
         * page scroll instead. Centring a flex column that overflows clips the
         * top of it, which is how a short laptop screen loses the heading.
         */}
        {/*
         * Height-first spacing, like the client homepage.
         *
         * This screen is meant to fit the window: it is the first thing a
         * client sees and a scrollbar on it says the form is longer than it
         * looks. The base values are the ones that have to survive a laptop,
         * and `tall:`/`taller:` buy the air back when the window has it. See
         * the variant definitions in `globals.css`.
         */}
        <div className="tall:gap-6 taller:gap-8 my-auto flex flex-col gap-5">
          {/*
           * The three things said once, before Moritz says anything (items 1,
           * 2 and 3).
           *
           * All three live on this screen rather than in an opening chat
           * message, and that is the firing rule rather than a layout
           * preference. This screen exists only while `phase === 'start'`, so
           * greeting the client by name, telling them the law is not their job
           * to explain, and telling them they can leave whenever they like are
           * structurally incapable of happening twice. An opening message in
           * the transcript would be three sentences the model could then
           * echo, and a scrollback the client passes on their way to the
           * bottom every time they come back.
           *
           * The prompt is told all three have been said and that none of them
           * are his to repeat. See `system-prompt.ts`.
           */}
          {/*
           * The greeting, and one line telling them what to do. Nothing else.
           *
           * Everything this used to say has an owner elsewhere on the screen:
           * the composer's placeholder says a document can be handed over, the
           * brief panel lists what will be asked for, and the four steps below
           * say how the whole case goes. A client who has not typed a word
           * yet is not reading a preamble, and copy that restates what the
           * layout already shows is the most expensive kind to keep.
           */}
          <header
            className={cn(
              'tall:gap-3 flex flex-col gap-2 text-center',
              ENTRANCE_CLASS,
            )}
            style={entrance(0)}
          >
            <h1 className="text-foreground tall:text-3xl mx-auto max-w-2xl font-serif text-2xl tracking-tight">
              {firstName === null
                ? t('start.headingAnonymous')
                : t('start.heading', { firstName })}
            </h1>
            <p className="text-muted-foreground tall:text-base mx-auto max-w-xl text-sm">
              {t('start.subheading')}
            </p>
          </header>

          {/*
           * The opening move is one action, and there is now one place to make
           * it: say what you need, drop the document, send once (A, Decision 1,
           * L2).
           *
           * There used to be a second, separate drop zone under the composer.
           * It came from a good instinct — an intake whose best input is a
           * contract should not hide the way to hand one over behind an icon —
           * but it answered that by adding a target rather than by making the
           * existing one obvious, and two places to put a document is the exact
           * shape of the complaint this redesign is answering. The zone is gone
           * and nothing it did is lost: the whole window still takes a drop
           * (`use-window-drop.ts`), the composer takes one itself and now says
           * so in the same visual language as the page (`chat-composer.tsx`),
           * and the paperclip still opens the picker. Three ways in, one place
           * they land.
           *
           * What the deletion buys is the Legora composition: one serif line as
           * the largest thing on the screen, the composer directly under it,
           * and nothing between them competing for the first glance.
           *
           * Attaching here does *not* start reading the document. The file is
           * held until send, so the description and the document arrive
           * together and the turn call sees a brief the contract has already
           * filled in.
           */}
          <div
            className={cn('flex flex-col gap-3', ENTRANCE_CLASS)}
            style={entrance(1)}
          >
            <div className="flex flex-col">{chatColumn()}</div>
            {/*
             * Permission to leave, directly under the thing they are being
             * asked to fill in (item 3).
             *
             * It was in the intro and it was wrong there: a preamble is read by
             * someone deciding whether to start, and this sentence is for
             * someone already mid-thought who has just realised they need to go
             * and find the contract. Set to match the save indicator on the
             * brief, because it is the same promise: the one says work is kept,
             * the other shows it being kept.
             */}
            {/*
             * Nothing renders here now. Both halves of this row left for a
             * reason, so both reasons are recorded rather than dropped.
             *
             * The credentials moved into the gold "how this works" panel below
             * (see its footer in `how-it-works.tsx`). This was the better
             * adjacency — a client reads this row while deciding whether to
             * upload a contract — but it was a loose strip on white with no
             * container, and the panel is the one block on the screen that
             * already explains the process. The height it frees is roughly the
             * height it costs down there, which is what made the move cheap on
             * a screen that has to fit the window.
             *
             * The reassurance line is commented out rather than deleted,
             * because the argument for where it sits is the expensive part to
             * rebuild; uncomment the `<p>` to bring it back.
             */}
            {/*
             * Italic and 7px because it is an aside: permission to leave, not
             * an instruction.
             *
             * It spent a while rendered with an inline `fontSize` while sizes
             * were compared, because the dev server was serving a stale CSS
             * chunk and every newly written arbitrary size compiled to
             * nothing, silently falling back to the inherited 16px. That is
             * why three successive attempts at "smaller" all looked
             * identical. Worth knowing the next time a size will not take.
             */}
            {/* <p className="text-muted-foreground px-1 text-[7px] italic leading-relaxed">
            {t('start.reassurance')}
          </p> */}
          </div>

          {/*
           * A way in for someone who does not know how to begin. Below the
           * composer and under a quiet lead-in: typing or dropping a document is
           * the flow, and these must not compete with it.
           */}
          <SuggestionChips
            className={ENTRANCE_CLASS}
            style={entrance(2)}
            chips={chipsByField[MATTER_TYPE_KEY] ?? []}
            label={t('start.orStartWith')}
            {...(startChoice !== undefined
              ? { selectedValue: startChoice }
              : {})}
            onSelect={(chip) => {
              setStartChoice(chip.value);
              void send(chip.label);
            }}
          />

          {/*
           * How the whole case goes, before a word has been typed.
           *
           * Four steps in the rail's own words, each with who does it and
           * when. It stays put for as long as this screen does: a client
           * halfway through their first sentence is exactly the person who
           * might glance back at it. See `how-it-works.tsx`.
           */}
          <HowItWorksCard
            matterId={matterId}
            className={ENTRANCE_CLASS}
            style={entrance(3)}
          />

          {/*
           * One real person, before a word is typed (Decision 21).
           *
           * Under the outline rather than above the composer: the client came
           * here to describe a problem, and the first thing on the screen has
           * to be the place to do that. This is what they find when they look
           * past it for reassurance that a human is involved, which is exactly
           * when it is worth something.
           */}
          <IntakeLawyerNote
            matterId={matterId}
            askable
            className={cn(
              'border-border tall:pt-5 taller:pt-6 border-t pt-4',
              ENTRANCE_CLASS,
            )}
            style={entrance(4)}
          />
        </div>

        {/*
         * No document surface here. `documentSurface` is `null` for this phase
         * and the reason is with the flag (`documentsReachable`); it is left
         * out rather than rendered-as-nothing so that reading this screen does
         * not suggest a handle appears on it.
         */}
        {dropOverlay}
        {leaveDialogElement}
      </div>
    );
  }

  const docked =
    documents.mode === 'docked' && canDock && documentPanelProps !== null;

  return (
    <div className="flex h-full w-full flex-col">
      {/*
       * The rail, lying down, for the widths with no room for a column.
       *
       * Above the row rather than inside the capped content, so it spans the
       * window the way the client reads it: one bar over everything, in the
       * same place whatever the panes below are doing. Sticky, so scrolling
       * the transcript never takes it off screen, and whatever it opens is
       * drawn over the panes rather than pushing them down.
       */}
      <JourneyBar
        phase={phase}
        accepted={quoteAccepted}
        /*
         * The brief's measure rides on this row below `lg`, where the brief
         * itself is a collapsed header — see `percent` in `journey-bar.tsx`.
         * `null` once the case is sent, under the same rule the panel uses: a
         * full bar over a submitted case is a progress indicator for a
         * finished thing.
         */
        percent={isSubmitted(phase) ? null : progress.percent}
        className="xl:hidden"
      />

      <div className="flex min-h-0 w-full flex-1">
        {/*
         * The rail's column, first in the DOM as well as on screen.
         *
         * Outside the 1600 cap below, so the cap goes on centring the pair in
         * whatever is left rather than having to make room inside itself.
         * That is also what keeps the rail in one place: the cap is removed
         * when a document docks (see `max-w-none`), and this column does not
         * care.
         */}
        <JourneyRailColumn phase={phase} accepted={quoteAccepted} />

        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            /*
             * The 1600 cap is what centres the pair on a wide display, and it is
             * also what there is no room for once a document joins them. So while
             * one is docked the composition takes the whole window and the three
             * columns run from the left edge to the right — which is what makes
             * space for the panel without touching either pane's own sizing. The
             * moment it closes, the cap comes back and the page is byte-identical
             * to what it was before.
             */
            docked ? 'max-w-none' : 'mx-auto max-w-[1600px]',
          )}
        >
          {/*
           * The phone layout, and the only place the two panes are not side by
           * side. One line for the brief, opened on a tap (Decision 18).
           */}
          {/*
           * `sticky top-0` as well as `shrink-0`, and the two are answering
           * different things. `shrink-0` keeps the row out of the panes'
           * scroll; `sticky` keeps it pinned when the whole page scrolls
           * (which it does on a short phone viewport, where the composer and
           * the action bar push the column past the window). The progress bar
           * this row now carries is the thing that has to survive both.
           *
           * `z-20` stays *below* `JourneyBar`'s `z-30` on purpose. This row is
           * the second bar on a phone and it sits directly under the first,
           * whose disclosure opens downward over it. While the two matched at
           * `z-20` this one won on DOM order and the opened journey bar was
           * drawn behind it. See the note on the `z-30` in `journey-bar.tsx`.
           */}
          <div className="bg-background sticky top-0 z-20 shrink-0 px-4 sm:px-6 lg:hidden">
            <BriefSummaryBar
              brief={brief}
              open={briefOpenOnMobile}
              onToggle={() => setBriefOpenOnMobile((open) => !open)}
              titlePending={recapPending}
            />
          </div>

          {/*
           * Two halves that actually fill the width, rather than a narrow chat
           * floating in a wide column.
           *
           * While the brief is filling in, the sizing is a compromise between two
           * things that pull against each other. Prose gets hard to read much past
           * 900px, so the chat cannot just stretch. A label-and-value list stops
           * reading as a document once the values drift far from their labels, so
           * the brief cannot either. So the brief takes what it needs and no more
           * (up to 34rem), the chat takes everything left up to a readable 56rem,
           * and the page caps at 1600. On a 1440 or 1512 laptop that lands with
           * almost nothing wasted.
           *
           * At review the two swap weight: the chat keeps a strip, because the
           * quote arrives and is paid in it, and the brief becomes the document.
           * The columns are animated across that one boundary and never move again
           * — a layout that resized as fields filled would be jumpy and would make
           * every screenshot unpredictable (Decision 18). Not resizable by hand:
           * there is no resizable primitive in their library, and a reviewer will
           * not drag a handle to rescue a bad default.
           *
           * At review the brief is ANCHORED and the chat ABSORBS the slack. Two
           * columns throughout, never stacked above `lg`; the only question is
           * which of them the leftover width goes to. It took three goes.
           *
           * First version: `20rem / 1fr`, brief capped at 44rem inside that second
           * column. The column's leftover became a band of dead space in the
           * middle of the page while the chat sat at 320px, 72px of it padding.
           * Moritz's replies wrapped to three words a line beside an empty gap.
           *
           * Second version: both tracks bounded, pair centred. That killed the gap
           * but fixed the composition at 72rem, so a wide display got 384px of
           * margin down each side and the left half read as abandoned next to a
           * dense brief. Symmetric margins are only calm when both halves carry
           * weight, and a 26rem strip does not.
           *
           * This version: the brief takes a document width and no more, the chat
           * is `1fr` and takes everything left, and the grid caps so the
           * transcript cannot stretch past readable. Slack lands in the chat
           * rather than in the margin, because the flexible track is the one that
           * grows.
           *
           * Three steps at `lg`, `xl` and `2xl`, because one cap cannot serve a
           * 13in laptop and a 27in monitor. The cap rises with the screen and the
           * brief widens with it, so a bigger display buys a bigger composition
           * instead of a bigger margin:
           *
           *   1024   chat 368   brief 640   margin 8
           *   1280   chat 496   brief 768   margin 8
           *   1512   chat 672   brief 768   margin 36
           *   1920   chat 768   brief 832   margin 160
           *
           * Past about 2000 it stops growing and centres, which is the right
           * answer for a screen nobody reads a document across in full.
           */}
          <div
            /*
             * A width the client chose wins over the width the breakpoints chose.
             *
             * Inline, because that is what "I have decided" looks like in CSS, and
             * only while docked and only once they have actually dragged — until
             * then there is no pinned number here at all and the responsive track
             * above is the whole story. The brief's track is restated unchanged so
             * the drag can only ever come out of the conversation.
             */
            {...(docked && documents.width !== null
              ? {
                  style: {
                    gridTemplateColumns: `minmax(${chatFloor}px,1fr) ${
                      briefLed
                        ? `minmax(0,${briefWidth}px)`
                        : `minmax(20rem,${briefWidth}px)`
                    } ${documents.width}px`,
                  },
                }
              : {})}
            className={cn(
              'grid min-h-0 flex-1 transition-[grid-template-columns] duration-500 ease-out motion-reduce:transition-none',
              /*
               * Nothing animates while a drag is in flight. The half-second ease
               * that makes the panel arrive gracefully makes a drag feel like it is
               * being argued with — the column chases the pointer instead of
               * following it.
               */
              documents.resizing && 'transition-none',
              /*
               * A third track, and nothing else about the two beside it changes.
               *
               * The rule is the same one the pair was built on: the flexible track
               * absorbs the slack, so the document and the brief each take a
               * document width and no more, and what is left over goes to the
               * conversation rather than into a margin. The brief holds its
               * existing floor (22rem) so it never drops below the width a
               * label-and-value list stops reading at, and the panel is bounded
               * where a page stops being worth widening.
               *
               * Measured, not guessed — the widths below are what the browser
               * computed once all three were on screen together:
               *
               *   1280   chat 384   brief 448   document 448
               *   1512   chat 520   brief 448   document 544
               *   1920   chat 800   brief 480   document 640
               *
               * Two passes to get here. The first gave the document and the brief
               * less and the conversation more, and both of the two that matter
               * suffered for it: the brief's values wrapped to three words a line
               * beside their Accept buttons, and the page fitted to 65% — small
               * type on a contract somebody is being asked to check.
               *
               * The shape of the tracks is doing the work. The document is
               * `minmax(0,34rem)`, so it takes a document width wherever there is
               * one and gives it up first where there is not; the brief keeps the
               * range it has always had; and the conversation is the flexible
               * track with a floor, so it absorbs what is left and stops when a
               * transcript stops being readable. That ordering is why 1280 lands
               * on three usable columns rather than overflowing: the document
               * yields 96px there rather than the chat going below its floor.
               *
               * Only from `xl`. Below it there is no third column worth having and
               * the panel opens as an overlay instead — see `roomToDock`. The `lg`
               * classes therefore stay exactly as they were, which is also what
               * makes the closed state provably unchanged.
               */
              docked
                ? briefLed
                  ? 'lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] xl:grid-cols-[minmax(22rem,1fr)_minmax(0,34rem)_minmax(0,34rem)] 2xl:grid-cols-[minmax(28rem,1fr)_minmax(0,40rem)_minmax(0,40rem)]'
                  : 'lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] xl:grid-cols-[minmax(24rem,1fr)_minmax(20rem,28rem)_minmax(0,34rem)] 2xl:grid-cols-[minmax(28rem,1fr)_minmax(22rem,30rem)_minmax(0,40rem)]'
                : briefLed
                  ? 'lg:mx-auto lg:w-full lg:max-w-[90rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,48rem)] 2xl:max-w-[100rem] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,52rem)]'
                  : 'lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)]',
            )}
          >
            {/*
             * One pane at a time on a phone. Both panes own their own scroll, so
             * stacking them inside a fixed-height grid gave each a slice of the
             * viewport: the brief was clipped mid-field and the conversation
             * started underneath it. Opening the brief takes the screen, and
             * closing it hands the screen back to the conversation.
             */}
            <div
              className={cn(
                // `max-lg:pb-4`: the mobile action bar below carries its own
                // top padding, so the pane's 32px would double up against it.
                'order-2 flex min-h-0 flex-col px-4 py-8 max-lg:pb-4 sm:px-6 lg:order-1 lg:flex',
                // A 40px gutter is generous beside a wide transcript and absurd
                // beside a narrow one: it was eating a fifth of the strip.
                briefLed ? 'lg:pl-7 lg:pr-6' : 'lg:pl-10 lg:pr-8',
                /*
                 * No reserved gutter here any more.
                 *
                 * There used to be a `max-lg:pe-14` on both panes, held open so
                 * the `fixed` document tab on the right edge would not sit on
                 * top of the text. It did its job and it cost the composition:
                 * the transcript, the composer and the brief all shifted 56px
                 * left the moment a document existed, so the screen was
                 * visibly off-centre for the rest of the flow. The tab is a
                 * button in the toolbar now (`documents-trigger.tsx`), which
                 * takes its space from the row it is in rather than from the
                 * page.
                 */
                briefOpenOnMobile && 'max-lg:hidden',
              )}
            >
              <div
                className={cn(
                  'mx-auto flex min-h-0 w-full flex-1 flex-col',
                  briefLed ? 'max-w-none' : 'max-w-[56rem]',
                )}
              >
                {chat}
              </div>
            </div>
            <div
              ref={briefPaneRef}
              id="intake-brief-panel"
              className={cn(
                'border-border mz-scrollbar-on-scroll order-1 min-h-0 overflow-y-auto px-4 py-8 max-lg:pb-4 sm:px-6 lg:order-2 lg:block lg:border-l lg:pl-8 lg:pr-10',
                !briefOpenOnMobile && 'hidden',
              )}
            >
              {/*
               * No inner width cap any more. The grid track is bounded at 46rem, so
               * a second cap inside it could only ever re-open the gap it was
               * introduced to close.
               */}
              <div className="h-full">{briefPanel}</div>
            </div>

            {/*
             * The document, in the track that was made for it. Third in the DOM as
             * well as on screen, after the two panes rather than between them, so
             * the tab order runs conversation → brief → document and neither pane
             * had to move to make room.
             */}
            {docked && documentPanelProps !== null && (
              <DocumentPanel
                {...documentPanelProps}
                compact
                maximised={false}
                resizeHandle={
                  <DocumentResizeHandle
                    chatFloor={chatFloor}
                    width={documents.width}
                    onResize={documents.setWidth}
                    onReset={documents.resetWidth}
                    onResizeStart={() => documents.setResizing(true)}
                    onResizeEnd={() => documents.setResizing(false)}
                  />
                }
                className="border-border order-3 hidden min-h-0 lg:border-l xl:flex"
              />
            )}
          </div>

          {/*
           * The primary action on a phone, and the point is where it is *not*.
           *
           * It used to be the brief column's sticky footer, which on a phone
           * lives inside the collapsible — so "Review and submit", the
           * sentence explaining what pressing it does, and the reason it is
           * disabled were all behind a tap on a panel that is shut by
           * default. A client could finish answering every question and never
           * see the button that finishes the case.
           *
           * Here it is a bar of its own, a sibling of the two panes rather
           * than a child of either, sitting directly under the composer. That
           * is what makes it survive both states: closing the brief does not
           * take it away, and opening the brief does not either. Below the
           * input rather than above it because the input is where the client
           * is working and the action is what comes after — and because a
           * full-width button between the transcript and the thing they are
           * typing into would read as part of the conversation.
           *
           * `lg:hidden`; from `lg` up the brief has a column of its own and
           * the footer goes back to the bottom of it, unchanged.
           */}
          <div className="border-border bg-background shrink-0 border-t px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:hidden">
            {briefAction}
          </div>
        </div>
      </div>

      {/*
       * The overlays sit outside the capped content and beside the rail,
       * because every one of them covers the whole page and the rail is part
       * of the page they cover.
       */}
      {documentSurface}

      {dropOverlay}
      {leaveDialogElement}
    </div>
  );
}
