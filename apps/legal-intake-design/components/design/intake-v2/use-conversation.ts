'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyFieldUpdates,
  newlyFilledRequired,
  type Brief,
} from '@/lib/intake/brief';
import {
  failureKindOfResponse,
  isRetryable,
  type FailureKind,
} from '@/lib/intake/failure';
import {
  MESSAGES_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from '@/lib/intake/session-storage';
import { readEventStream } from '@/lib/intake/stream-client';
import {
  finishStep,
  startStep,
  type TimelineStep,
} from '@/lib/intake/timeline';
import { documentsOnlyMessage, isSendable } from '@/lib/intake/outgoing-turn';
import { extractPartialReply } from '@/lib/intake/turn-schema';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /**
   * Epoch ms, stamped when the turn is created.
   *
   * The transcript is copied onto the case at submission (`case-transcript.ts`)
   * and a case thread is a dated record: date separators, read receipts and the
   * handoff into counsel all read off the clock. Stamped at creation rather
   * than at submission, so the times on the case are the times the
   * conversation actually happened rather than a spread invented after it.
   *
   * Optional, because a session saved before this existed comes back without
   * it, and a whole restored conversation is worth more than its timestamps.
   */
  at?: number;
  /** Files sent with a user message. The bytes are never kept here. */
  attachments?: { name: string; size: number }[];
  /** True while the model is still writing this one. */
  pending?: boolean;
  /**
   * The work behind this turn, as it happened (L1). See `lib/intake/timeline.ts`.
   *
   * Held on the turn because the waits that render here are different pieces of
   * work: a document being read, and a reply being written against the brief.
   * Naming them at the transcript level would need one label to cover both,
   * which is the "Thinking…" this replaces.
   *
   * This used to be a single `activity` string — the label of whichever wait
   * was live. A list instead, because a string can only ever describe the
   * present: it was overwritten by the next wait and gone by the time the reply
   * landed, so the flow had no record of having read anything. These survive
   * the turn settling and are written into the saved session with it, which is
   * what makes the rail answerable three turns later.
   */
  steps?: TimelineStep[];
  /**
   * A sentence that belongs to the turn without being part of what Moritz
   * said in answer, rendered under the turn's chips rather than in its prose.
   *
   * There is exactly one of these: item 7's "the two documents you did not
   * think to send". It used to be appended to the reply text, and that put it
   * in the worst possible place. A reply ends with a question, so the client
   * read a question, then an unrelated request for two more documents, and
   * then found the ready-made answers to the question underneath both. It
   * looked like Moritz had asked something and talked straight over it before
   * they could answer. The sentence is an aside about optional paperwork, so it
   * is held and rendered as one.
   */
  aside?: string;
  /**
   * One-tap answers the model wrote for *this* question, in its order.
   *
   * Distinct from `chipsFor`, and takes priority over it. `chipsFor` names a
   * field whose *preset* chips the UI then looks up; this is the model offering
   * answers it composed for the question it just asked — which is the only way
   * a question like "is IBM the only other party, or is there a recruiter you
   * want named?" can have buttons under it, because no preset list anticipates
   * that sentence.
   */
  options?: readonly string[];
  /** Field key this turn asked about, when that field has ready-made answers. */
  chipsFor?: string;
  /** The chip the client picked, which stays shown as the chosen one. */
  chipChoice?: string;
};

/** Matches the window the turn route keeps; sending more would be discarded. */
const TRANSCRIPT_WINDOW = 6;

/**
 * Something went wrong, in a sentence, and whether trying again could help.
 *
 * Two fields rather than a bare string because the sentence and the control
 * under it are one decision. A line that says "give it a moment and send it
 * again" with no button is asking the client to retype what they just wrote,
 * and a Try again button under "it is not something you can fix" is a control
 * that cannot succeed.
 */
export type IntakeFailure = { text: string; retryable: boolean };

/**
 * Everything a turn needs to go out, kept so a failed one can go out again.
 *
 * The retry is the whole reason this is a value rather than four locals inside
 * `send`: an API that is down for four seconds used to cost the client their
 * message, because the only copy of what they had written was the bubble on
 * screen and the only way to send it again was to type it again.
 */
type OutgoingTurn = {
  /** What goes in the client-message slot. Never empty; see `send`. */
  message: string;
  /** The transcript window as it stood *before* this turn's own message. */
  transcript: { role: 'user' | 'assistant'; text: string }[];
  /** The brief the model reasons about, and the one the turn is measured against. */
  brief: Brief;
  /** Item 7's aside, resolved after this turn's updates land. */
  suggestDocuments: ((next: Brief) => string | null) | null;
  /**
   * Work already finished before this turn went out, for the rail (L1).
   *
   * There is exactly one source: the opening move, where a document is read
   * *before* the turn call and that read is deliberately silent — it has no
   * bubble of its own, because the turn call about to run is what replies, and
   * two Moritz turns covering the same ground reads as a stutter. Without this
   * the rail on that reply would start at "Reading what you have told me" and
   * the contract read, which is the longest wait in the whole flow, would be
   * the one piece of work with no record of ever having happened.
   *
   * Carried on the outgoing turn rather than appended to the bubble afterwards
   * so that `retry` replays it: the read is not re-run by a retry, so a rail
   * rebuilt from scratch would lose it.
   */
  seedSteps: readonly TimelineStep[];
};

function newId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredMessages(): ChatMessage[] | null {
  const parsed = readStoredJson<unknown>(MESSAGES_STORAGE_KEY);
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(
    (item): item is ChatMessage =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ChatMessage).text === 'string',
  );
}

/**
 * The conversation, and the one thing it is allowed to do to the brief.
 *
 * Reply text is rendered from the stream as it arrives, so the client sees
 * words appear rather than a spinner. Field updates are applied only from the
 * final `done` event, which the server has already validated, partial JSON is
 * for reading, never for changing the case.
 */
export function useConversation({
  brief,
  applyUpdates,
  hydrated,
  waitLabels,
  progressNote,
  recordObservation,
  errorText,
  fieldsWritten,
  persist = true,
  mode = 'intake',
}: {
  brief: Brief;
  applyUpdates: (updates: readonly unknown[]) => void;
  hydrated: boolean;
  /**
   * Which conversation this is, which `/api/intake` reads as a system prompt.
   *
   * `intake` is the interviewer filling the brief in. `waiting` is the same
   * voice after the case has gone, answering questions about it and collecting
   * nothing, which is what the composer on the confirmation screen has always
   * been wired to and never had a prompt for.
   *
   * A prop rather than something derived in here from `persist`, even though
   * the two flip at the same moment today. They mean different things: one is
   * about whether there is a draft worth saving, the other about who the client
   * is talking to, and a hook that inferred the second from the first would be
   * one refactor away from a sealed case getting interviewed again.
   */
  mode?: 'intake' | 'waiting';
  /**
   * Whether the transcript is still a draft worth saving (false once sent).
   *
   * The chat stays live after submission — late documents are acknowledged in
   * it (Decision 24) — so without this every post-submit line would re-save a
   * session that was cleared at the moment of sending, and the next visit to
   * "Start a case" would resume the case the client had already sent.
   */
  persist?: boolean;
  /**
   * What to call the wait, for the first turn and for every one after it.
   *
   * Three labels rather than one because each is genuinely a different job.
   * On the first there is no brief yet, so Moritz is reading what the client
   * said; later he is checking it against what is already down; and after the
   * case has gone he is doing neither, because there is nothing left to check
   * it against. Supplied by the caller so the strings stay in `en.json` with
   * the rest of the copy.
   *
   * `sent` is the one that had to be added rather than borrowed. Showing
   * "Checking that against the rest of your case" while answering "can I still
   * send you something" is a label describing work that is not happening, which
   * is the exact defect `waits.ts` exists to stop.
   */
  waitLabels: { first: string; reply: string; sent: string };
  /**
   * The "the work got smaller" line, or `null` when this turn has not earned
   * one (item 9).
   *
   * The hook owns the *rule* because it is the only place that holds the brief
   * from before the turn and the brief from after it. The caller owns the
   * *sentence*, because that is copy. `filled` is how many required fields
   * went from empty to answered on this turn, which is the number the rule
   * fires on.
   */
  /**
   * The "the work got smaller" sentence, or `null`.
   *
   * `asking` is whether this turn ended on a question. See the call inside the
   * `done` branch: without it the note can claim there is nothing left to ask
   * in the same breath as the reply asking something.
   */
  progressNote: (filled: number, next: Brief, asking: boolean) => string | null;
  /**
   * Record the one observation, and say whether this turn's was the one that
   * took (item 6).
   *
   * Returns a boolean rather than void because the reply only carries the
   * sentence when it was actually recorded. A second observation is dropped by
   * `noteObservation`, and showing the client a sentence that was not written
   * down for the lawyer would be the one place this feature lies.
   */
  recordObservation: (text: string) => boolean;
  /**
   * The sentence for a failure kind (T32).
   *
   * Supplied by the caller for the same reason `waitLabels` is: the hook owns
   * which kind a failure *is*, and `en.json` owns what is said about it (D25).
   * Before this, the hook put `err.message` on screen, so a client describing a
   * redundancy could be shown an SDK sentence about `apiKey` and `authToken`.
   */
  errorText: (kind: FailureKind) => string;
  /**
   * The rail's nested count for a turn, as a sentence (L1).
   *
   * Supplied by the caller for the same reason `waitLabels`, `progressNote` and
   * `errorText` are: the hook owns *which* number is the true one, `en.json`
   * owns what is said about it (D25). Here the true number is every field the
   * turn wrote, optional ones included — which is not the number in
   * `progressNote`, and deliberately so. See the call site.
   */
  fieldsWritten: (count: number) => string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<IntakeFailure | null>(null);
  /** Field key the last reply asked about, so the UI can offer its chips. */
  const [askingAbout, setAskingAbout] = useState<string>('');

  // The brief changes while a turn is in flight; a ref keeps the request
  // reading the latest one without making `send` a new function every render.
  const briefRef = useRef(brief);
  briefRef.current = brief;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  /*
   * Same treatment as the brief, for the same reason: a turn reads it as the
   * request is built, and `retry` has to keep working across the one render
   * where it changes. See the `mode` line in the request body.
   */
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const skipNextWrite = useRef(true);

  useEffect(() => {
    const stored = readStoredMessages();
    if (stored && stored.length > 0) setMessages(stored);
  }, []);

  useEffect(() => {
    if (!hydrated || !persist) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    // Never persist a half-written reply: on the next visit it would look like
    // Moritz stopped mid-sentence.
    writeStoredJson(
      MESSAGES_STORAGE_KEY,
      messages.filter((message) => !message.pending),
    );
  }, [messages, hydrated, persist]);

  const replaceText = useCallback((id: string, text: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, text } : message,
      ),
    );
  }, []);

  /**
   * @param detail the real number this turn's work produced, for the rail's
   * nested line. Optional, because a turn where nothing landed on the brief has
   * no honest number to print and "0 fields written" is a sentence about the
   * software rather than about the case.
   */
  const settle = useCallback(
    (
      id: string,
      text: string,
      chipsFor?: string,
      aside?: string | null,
      detail?: string | null,
      options?: readonly string[],
    ) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id
            ? {
                ...message,
                text,
                pending: false,
                // Ticked here rather than in a second pass, because the step
                // finishing and the bubble settling are one moment: a rail left
                // spinning over a finished reply is the defect in miniature.
                ...(message.steps
                  ? { steps: finishStep(message.steps, detail) }
                  : {}),
                ...(chipsFor ? { chipsFor } : {}),
                ...(options && options.length > 0 ? { options } : {}),
                ...(aside ? { aside } : {}),
              }
            : message,
        ),
      );
    },
    [],
  );

  /**
   * Record which chip was picked. The chips stay on the message that offered
   * them, with the chosen one filled in and the rest locked, so the transcript
   * still reads as a record of what was asked and answered.
   */
  const chooseChip = useCallback((messageId: string, value: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, chipChoice: value } : message,
      ),
    );
  }, []);

  /**
   * The failed turn, so it can be sent again without being retyped.
   *
   * A ref rather than state: nothing renders from it, and a retry has to read
   * the turn as it was rather than as it was two renders ago.
   */
  const lastTurn = useRef<OutgoingTurn | null>(null);

  /**
   * Put one turn on the wire, and settle or fail the bubble it is writing into.
   *
   * Split out of `send` so that `retry` exists at all. Everything above this
   * (appending the client's own bubble, deciding what goes in the message slot,
   * refusing an empty turn) happens once per thing the client does; everything
   * in here can happen twice for the same thing they did.
   */
  const runTurn = useCallback(
    async (outgoing: OutgoingTurn) => {
      setFailure(null);
      setBusy(true);
      // A new turn answers whatever was asked; the old chips go away.
      setAskingAbout('');

      const replyId = newId();
      const before = outgoing.brief;
      const { suggestDocuments } = outgoing;

      /**
       * End the turn on a named failure.
       *
       * Drops the empty reply bubble rather than leaving it spinning forever,
       * and leaves the client's own message where it is: it is the only copy of
       * what they wrote, and `retry` sends exactly it.
       */
      const failTurn = (kind: FailureKind) => {
        setFailure({ text: errorText(kind), retryable: isRetryable(kind) });
        setMessages((current) =>
          current.filter((message) => message.id !== replyId),
        );
      };

      /*
       * The wait is named before the request goes out, so the label is on
       * screen for the whole of it rather than appearing once it is over.
       *
       * `waitId` is the `INTAKE_WAITS` id, carried alongside the sentence so a
       * reviewer reading a rail row can find the one place the sentence is
       * written and the test that stops it being reused. `timeline.test.ts`
       * asserts both of these ids are in that registry, which is what keeps a
       * new rail row from being invented at a call site.
       */
      const waiting = modeRef.current === 'waiting';
      const first = outgoing.transcript.length === 0;
      /*
       * The sent case's own wait, which is not either of the other two.
       *
       * Checked before `first` rather than after, because a client who opens
       * the confirmation in a fresh tab has an empty transcript and is
       * emphatically not on the first turn of an intake.
       */
      const steps = startStep(outgoing.seedSteps, {
        waitId: waiting ? 'waiting-turn' : first ? 'first-turn' : 'later-turn',
        label: waiting
          ? waitLabels.sent
          : first
            ? waitLabels.first
            : waitLabels.reply,
      });

      setMessages((current) => [
        ...current,
        {
          id: replyId,
          role: 'assistant',
          text: '',
          at: Date.now(),
          pending: true,
          steps,
        },
      ]);

      try {
        const response = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            brief: before,
            transcript: outgoing.transcript,
            message: outgoing.message,
            /*
             * Read through a ref rather than closed over.
             *
             * The mode changes at the moment the client presses send, and a
             * turn already in flight when that happens must keep the mode it
             * was started in: a reply being written by the interviewer does not
             * become a concierge reply halfway through. The ref is read once
             * here, as the request is built, which is exactly when the turn
             * commits to a mode. Closing over `mode` instead would put it in
             * `runTurn`'s dependency list and rebuild `retry` on the send,
             * which is the one callback that has to survive the transition.
             */
            mode: modeRef.current,
          }),
        });

        if (!response.ok) {
          /*
           * No stream, so no `kind` event is coming. The route may still have
           * put one in the body — `failureResponse` does — and believing it is
           * what makes a missing `ANTHROPIC_API_KEY` read as `unauthorized`
           * instead of as a 503-shaped `busy` with a retry button on it. The
           * status is the fallback, for a proxy or an edge timeout whose body
           * is not ours.
           */
          failTurn(await failureKindOfResponse(response));
          return;
        }

        let buffer = '';
        let finalReply = '';
        let asked = '';
        // The model's own one-tap answers for this question, in its order.
        let options: readonly string[] = [];
        let note: string | null = null;
        let observation: string | null = null;
        // How many fields the turn wrote, for the rail's nested line. Captured
        // in the loop because `event` does not outlive it, and counted from the
        // `done` payload rather than from the brief afterwards so a client
        // accepting a value mid-stream cannot be credited to the turn.
        let written = 0;
        // The brief as it stood once this turn's updates landed, which is what
        // the aside has to be written from. Stays null if the stream broke
        // before `done`, and the aside then falls back to `before`.
        let after: Brief | null = null;

        for await (const event of readEventStream(response)) {
          if (event.type === 'delta') {
            buffer += event.text;
            const partial = extractPartialReply(buffer);
            if (partial !== null) replaceText(replyId, partial);
            continue;
          }

          if (event.type === 'error') {
            /*
             * The bubble goes, even though there may be half a reply in it.
             *
             * Keeping a truncated sentence on screen under a line explaining
             * that something failed reads as Moritz having said something he
             * did not finish saying, and it would be saved into the transcript
             * that goes to the firm. The failure line is the whole message.
             */
            failTurn(event.kind);
            return;
          }

          // done, the only event allowed to change the brief.
          finalReply = event.turn.reply;
          written = event.turn.fieldUpdates.length;
          applyUpdates(event.turn.fieldUpdates);
          setAskingAbout(event.turn.askingAbout);
          asked = event.turn.askingAbout;
          options = event.turn.options;

          /*
           * Item 9, decided here and nowhere else.
           *
           * Against `before`, which is the brief this turn actually reasoned
           * about, rather than against whatever the brief looks like by the
           * time the state settles. A client tapping Accept on the panel while
           * a reply streams changes the brief mid-turn, and measuring the
           * difference at the end would credit the turn with the client's own
           * work and tell them a question got answered that they answered
           * themselves.
           *
           * `applyFieldUpdates` is run a second time here rather than being
           * threaded out of `applyUpdates`, because it is pure and cheap and
           * the alternative is a setState that reports back. Both calls are
           * given the same inputs, so they cannot disagree.
           */
          after = applyFieldUpdates(before, event.turn.fieldUpdates);
          /*
           * `asked` goes in, and it is the fix for a sentence that contradicted
           * the reply it was attached to.
           *
           * The note's own arithmetic is about required fields, so on a turn
           * that closed the last of them it said "which is all of them.
           * Nothing left to ask" — directly underneath a reply that had just
           * asked about the optional one. Two sentences from the same voice,
           * one of them false, and the false one is the confident one.
           *
           * The model already reports what it is asking about, and the panel
           * already marks that row "asking now". So the note is told too.
           */
          note = progressNote(
            newlyFilledRequired(before, after),
            after,
            asked !== '',
          );

          /*
           * Item 6. Offered by the model on any turn, accepted at most once per
           * intake, and only shown when it was accepted.
           */
          if (event.turn.observation !== '') {
            if (recordObservation(event.turn.observation)) {
              observation = event.turn.observation;
            }
          }
        }

        const reply = finalReply || extractPartialReply(buffer) || '';

        /*
         * A stream that ended without a `done` and without an `error`.
         *
         * That is a dropped connection mid-turn, and it used to settle the
         * bubble with whatever prose had arrived: a reply that stops mid
         * sentence, with no field updates behind it and nothing on screen to
         * say so. It is a failure, and the retry is what the client wants.
         */
        if (after === null) {
          failTurn('offline');
          return;
        }

        /*
         * Reply, then the observation, then the count. In that order because it
         * is the order of decreasing relevance to what the client just said,
         * and because the observation has to read as part of Moritz's answer
         * rather than as a footnote under a progress line.
         *
         * The document suggestion is deliberately *not* in here. Both of these
         * are about the turn the client just took, so they read as the same
         * breath as the reply; the suggestion asks for something new, and a new
         * ask placed after the reply's question reads as Moritz asking twice
         * and waiting for neither. It goes out as the turn's aside instead.
         */
        const tail = [observation, note].filter(Boolean).join('\n\n');
        /*
         * One turn, two sentences, rather than a second Moritz turn.
         *
         * The count is the app's to state and the reply is the model's, but
         * they are one thing said at one moment. Two bubbles in a row would
         * read as Moritz talking to himself, and the transcript already has a
         * rule about that where uploads are concerned.
         */
        /*
         * The rail's nested number, and it is deliberately a different count
         * from the one in `note`.
         *
         * `note` is item 9's "the work got smaller" line and counts *required*
         * gaps that closed, because that is what the client is waiting to hear.
         * The rail counts every field the turn wrote, optional ones included,
         * because that is what the turn actually did. They are routinely
         * different numbers and both are true of different questions, which is
         * exactly why the rail nests its count under its own step instead of
         * restating the one already in the prose.
         *
         * Nothing at all when the turn wrote nothing, which is what stops a
         * fold-away control appearing under every reply in the conversation.
         * "Nothing new for the brief" is a true sentence and a worthless one:
         * a turn with one step and no number is exactly what the client just
         * watched happen, so offering to unfold it costs a glance and returns
         * nothing they have not read. `isWorthKeeping` is the other half of
         * this rule. The *read* step does the opposite and always states its
         * count — see `tracedDetail`, where zero traced values is the most
         * important thing the client could be told.
         */
        settle(
          replyId,
          tail && reply ? `${reply}\n\n${tail}` : reply,
          asked,
          suggestDocuments?.(after) ?? null,
          written > 0 ? fieldsWritten(written) : null,
          options,
        );
      } catch (caught) {
        /*
         * `fetch` rejects for one reason in practice: the request never
         * completed. A DNS failure, a dropped connection and an aborted load
         * all arrive as a `TypeError` with a message that differs per browser,
         * which is exactly the sort of string this whole module exists to keep
         * off the screen. Anything else thrown in here is our own bug.
         */
        failTurn(caught instanceof TypeError ? 'offline' : 'unknown');
      } finally {
        setBusy(false);
      }
    },
    [
      applyUpdates,
      errorText,
      fieldsWritten,
      progressNote,
      recordObservation,
      replaceText,
      settle,
      /*
       * All three labels, listed individually rather than as `waitLabels`.
       *
       * The object is rebuilt on every render of the caller, so depending on it
       * wholesale would recreate `send` every render. `sent` was the one
       * missing: it arrived with the concierge mode and the array was not
       * updated, which is the same class of omission as the label itself going
       * missing from `waitLabels` — see the note there.
       */
      waitLabels.first,
      waitLabels.reply,
      waitLabels.sent,
    ],
  );

  /**
   * @param briefOverride the brief to reason about, when the caller has just
   * changed it and cannot wait for a render.
   *
   * `briefRef` is assigned during render, so a caller that applies field
   * updates and then sends in the same tick would hand the model the brief as
   * it was *before* those updates. That is exactly the opening move: a document
   * dropped with the first message extracts, then the turn call runs, and if it
   * cannot see what the document just filled it asks about it anyway, which is
   * the one behaviour D6 exists to prevent.
   */
  const send = useCallback(
    async (
      text: string,
      attachments?: { name: string; size: number }[],
      briefOverride?: Brief,
      /**
       * The aside this turn should carry, resolved against the brief *after*
       * the turn's own field updates have landed.
       *
       * Only the opening move uses it, for item 7's document suggestion: the
       * read that earned the suggestion is deliberately silent there, so the
       * sentence has no turn of its own to travel in.
       *
       * A function rather than a string, and that is the whole fix for the
       * second half of this bug. The suggestion names two documents that are
       * specific to the kind of matter this is, and on the opening move the
       * thing that establishes the matter is *this turn*, not the document read
       * that came before it. Passing a finished sentence meant it was written
       * from a brief whose `matter-type` was still empty, so it always fell
       * back to the generic "the document at the centre of this" wording, in
       * the same breath as a reply saying "I have marked this as an employment
       * matter". Resolving it in `runTurn`, from `after`, is the only point
       * where the matter is known and the sentence has not been written yet.
       */
      suggestDocuments?: ((next: Brief) => string | null) | null,
      /**
       * Work already finished before this turn, for the reply's rail (L1).
       *
       * Only the opening move passes any: the document read that runs before it
       * is silent, so without this the longest wait in the flow would be the
       * one with no record. See `OutgoingTurn.seedSteps`.
       */
      seedSteps?: readonly TimelineStep[],
    ) => {
      const trimmed = text.trim();
      const files = attachments ?? [];
      // Documents on their own are a turn; see `isSendable`.
      if (busy || !isSendable({ text, documents: files.length })) return;

      const userMessage: ChatMessage = {
        id: newId(),
        role: 'user',
        text: trimmed,
        at: Date.now(),
        ...(files.length > 0 ? { attachments: files } : {}),
      };

      const outgoing: OutgoingTurn = {
        /*
         * The turn needs something in the client-message slot, and the route
         * rejects an empty one. When there are no words the event itself is
         * described instead, bracketed so the model reads it as a note about
         * what happened rather than as something the client said: the
         * difference between "they sent two documents and no message" and
         * putting a sentence in their mouth.
         *
         * The bubble on screen stays wordless: it shows the files, which is
         * what the client actually did.
         */
        message: trimmed || documentsOnlyMessage(files.map((one) => one.name)),
        // Read before the client's own bubble is appended, so this turn's
        // message is not also in the history behind it.
        transcript: messagesRef.current
          .filter((message) => !message.pending && message.text !== '')
          .slice(-TRANSCRIPT_WINDOW)
          .map((message) => ({ role: message.role, text: message.text })),
        brief: briefOverride ?? briefRef.current,
        suggestDocuments: suggestDocuments ?? null,
        seedSteps: seedSteps ?? [],
      };

      lastTurn.current = outgoing;
      setMessages((current) => [...current, userMessage]);
      await runTurn(outgoing);
    },
    [busy, runTurn],
  );

  /**
   * Send the failed turn again (T32).
   *
   * The brief is re-read rather than replayed. A client can accept a field on
   * the panel while a failure sits under the transcript, and re-sending the
   * brief as it was would hand the model a state the client has already moved
   * past, which on the next turn would have Moritz ask about a field they just
   * filled. Everything else (their message, the transcript window behind it,
   * the pending aside) is exactly what went out the first time.
   */
  const retry = useCallback(() => {
    const previous = lastTurn.current;
    if (previous === null || busy) return;
    void runTurn({ ...previous, brief: briefRef.current });
  }, [busy, runTurn]);

  /**
   * The client saying something that is not a turn (V22, G6).
   *
   * Appends their words to the transcript without putting anything on the wire.
   *
   * Kept, with no caller at present. *Talk to a person* used to be the one, and
   * it is a screen of its own now (`/client/talk`), so nothing writes a client
   * turn into this transcript without a request behind it. The next thing that
   * wants to — a system message the client is credited with, a resumed draft —
   * needs exactly this, and it is eight lines.
   *
   * Not routed through `send`, and that is the point rather than a shortcut. A
   * client who has just asked to speak to a person does not want the software's
   * opinion about it, and a model reply to "I would rather explain this on a
   * call" is the flow arguing with somebody who has already decided it is not
   * enough. It still reaches the firm, because the transcript is what
   * `case-transcript.ts` copies onto the case at submission — so this is the
   * same channel the whole intake travels on, not a side door.
   *
   * Recorded as `role: 'user'` because the client wrote it. A turn attributed to
   * Moritz would put words in his mouth, and one attributed to nobody would be
   * dropped from the transcript.
   */
  const sayClient = useCallback((text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    setMessages((current) => [
      ...current,
      { id: newId(), role: 'user', text: trimmed, at: Date.now() },
    ]);
  }, []);

  /**
   * Moritz speaking without the client having typed, e.g. after an upload.
   *
   * @returns the turn's id, so a caller that may have to take the line back
   * can name it later. Only the prototype controls do — see `rewindTo`.
   */
  const say = useCallback((text: string) => {
    const id = newId();
    setMessages((current) => [
      ...current,
      { id, role: 'assistant', text, at: Date.now() },
    ]);
    return id;
  }, []);

  /**
   * Drop a turn and everything said after it.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * FOR THE PROTOTYPE CONTROLS ONLY, AND THE NARROWNESS IS THE POINT.
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Nothing in the product un-says anything. A transcript is the record the
   * case is built from (`case-transcript.ts` copies it onto the matter at
   * submission), so a client-facing path that could delete turns would be a
   * record that disagrees with what the client was told — which is the exact
   * class of defect the confidence marks and the "we have kept both" line
   * exist to avoid.
   *
   * This is for the one thing that is genuinely not the product: the reviewer
   * pressing "Back to the confirmation" after skipping ahead to the quote.
   * Without it the flow rewinds the case and not the conversation, so the
   * rail ticks back to "a lawyer prices the work" while the chat two inches
   * away still says the price arrived — a contradiction on the screen a
   * reviewer is evaluating.
   *
   * Truncates rather than deletes by id, because a rewind is to a moment
   * rather than to a message: anything said while the client was on the quote
   * screen belongs to the part of the story being wound back.
   */
  const rewindTo = useCallback((id: string) => {
    setMessages((current) => {
      const index = current.findIndex((message) => message.id === id);
      return index === -1 ? current : current.slice(0, index);
    });
  }, []);

  /**
   * Moritz going quiet on a job the client started, and saying what the job is.
   *
   * Reading a dropped document is the longest wait in the flow and it used to
   * be the only one with nothing in the transcript at all: the file rows in the
   * composer got a spinner, so the feedback was next to the thing the client
   * had already finished doing rather than where the answer was going to
   * arrive. A turn that waits in the transcript and then fills itself in is the
   * same shape as every other wait here.
   *
   * Returns the turn's id. The caller settles it with what was found, or drops
   * it if the read failed, because a turn that never settles is a spinner
   * forever.
   */
  const sayWhile = useCallback(
    (wait: { waitId: string; label: string }): string => {
      const id = newId();
      setMessages((current) => [
        ...current,
        {
          id,
          role: 'assistant',
          text: '',
          at: Date.now(),
          pending: true,
          steps: startStep([], wait),
        },
      ]);
      return id;
    },
    [],
  );

  /**
   * @param detail the real number the job produced, nested under its step on
   * the rail. For a read that is how much of what came back could be traced to
   * a line in the document, which is the one number in this flow worth stating
   * without being asked: it is the difference between a value the client can
   * check and one they have to take on trust.
   */
  const finishSaying = useCallback(
    (id: string, text: string, aside?: string | null, detail?: string | null) =>
      settle(id, text, undefined, aside, detail),
    [settle],
  );

  /** Take the waiting turn back off screen, for a job that produced nothing. */
  const dropSaying = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setFailure(null);
    setAskingAbout('');
    lastTurn.current = null;
  }, []);

  /**
   * A sentence the caller composed itself, with no retry under it.
   *
   * The rejected-file lines come through here (T20): they are already specific,
   * they already name the next step, and none of them is a failure that trying
   * again would change. `null` clears.
   */
  const setError = useCallback((text: string | null) => {
    setFailure(text === null ? null : { text, retryable: false });
  }, []);

  return {
    messages,
    busy,
    /** The failure on screen, if any, and whether it offers a retry. */
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
  };
}
