'use client';

import { useMemo, useSyncExternalStore } from 'react';

import {
  toCaseTranscript,
  type TranscriptTurn,
} from '@/lib/intake/case-transcript';
import type { Document, LegalCase, Message } from '@/lib/types';

/**
 * The case the intake actually sent, as opposed to the fixture it lands on.
 *
 * `lib/mocks/cases.ts` carries one case reserved for the intake's submission
 * (`SUBMITTED_CASE_ID`) so the confirmation, the email and the notification all
 * have somewhere real to point. What it cannot carry is what *this* client
 * wrote: its title and description are fixture prose, so a client who sent an
 * employment matter opened "Your cases" and found a warehousing MSA under
 * today's date.
 *
 * So the submission is kept here and laid over the fixture on the client's own
 * surfaces. Beside the fixtures rather than inside them, for the same reason
 * `portal-notifications.ts` sits beside `notifications.ts`: a fixture is the
 * same on every load, this is the consequence of something the client just did,
 * and it is stored so a reload, or a visit a day later, still shows it.
 *
 * Deliberately scoped to the client's view. `anonDescription` — the line the
 * firm's lawyers see before a case is claimed — is an anonymisation step this
 * prototype has no backend to perform, so the legal and admin surfaces keep
 * reading the fixture rather than being handed un-anonymised client prose.
 */

export type SubmittedCase = {
  /** The mock case this submission stands for. */
  id: string;
  /** The brief's name for the matter (Decision 14). */
  title: string;
  /** The recap paragraph, or `null` when the recap call failed. */
  description: string | null;
  /** Every document handed over, by name, in the order they arrived. */
  documentNames: string[];
  /**
   * The intake conversation, so the case has the thread behind the brief.
   *
   * Optional, because a submission recorded before this existed has none, and a
   * case that shows its title and documents is worth more than one that throws
   * on a missing field.
   */
  transcript?: TranscriptTurn[];
  /** ISO. When the client pressed send. */
  submittedAt: string;
};

const STORAGE_KEY = 'playground:submitted-cases';

type Submissions = Record<string, SubmittedCase>;

const NONE: Submissions = {};

const listeners = new Set<() => void>();
let submissions: Submissions = NONE;
let loaded = false;

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) submissions = JSON.parse(stored) as Submissions;
  } catch {
    submissions = NONE;
  }
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Record what was sent.
 *
 * Overwrites rather than dedupes, which is the opposite of how the "case
 * received" notification behaves, and on purpose. There is one case id for
 * every submission this prototype can make, so a client who sends a case,
 * starts another and sends that one has to find the second case under it — a
 * dedupe would leave them looking at the title of the matter before last.
 */
export function recordSubmittedCase(submission: SubmittedCase): void {
  load();
  submissions = { ...submissions, [submission.id]: submission };
  write();
}

/**
 * Documents handed over after the case was sent (Decision 24).
 *
 * A no-op when there is no submission to add them to: the late-document path
 * only exists on the confirmation, so being called without one means something
 * upstream is confused, and inventing a submission here would put a case in
 * "Your cases" that was never sent.
 */
export function addSubmittedCaseDocuments(
  id: string,
  names: readonly string[],
  /**
   * What Moritz said when they arrived, so the case thread keeps the exchange
   * rather than growing a document nobody mentioned.
   */
  turns: readonly TranscriptTurn[] = [],
): void {
  load();
  const current = submissions[id];
  if (!current || names.length === 0) return;
  submissions = {
    ...submissions,
    [id]: {
      ...current,
      documentNames: [...current.documentNames, ...names],
      transcript: [...(current.transcript ?? []), ...turns],
    },
  };
  write();
}

/**
 * Words added to a case after it was sent.
 *
 * The sibling above takes documents and the turns that came with them; this
 * takes turns on their own, which had no route onto the case at all. The
 * transcript was snapshotted once at submission and never appended to again, so
 * everything the client said on the confirmation screen — a question answered
 * by concierge mode, the one thing they came back to add — existed in React
 * state and nowhere a lawyer would ever look.
 *
 * Garzai's description of the real system is the standard being met here:
 * "anything added after submission is picked up by the agent in the background
 * and forwarded into drafting if it matters". A prototype that shows the client
 * a reply and drops their words is worse than one with no chat after submit,
 * because it looks like the message landed.
 *
 * A no-op without a submission to append to, for the reason `addSubmitted-
 * CaseDocuments` gives: inventing one here would put a case in "Your cases"
 * that was never sent.
 */
export function addSubmittedCaseTurns(
  id: string,
  turns: readonly TranscriptTurn[],
): void {
  load();
  const current = submissions[id];
  if (!current || turns.length === 0) return;
  submissions = {
    ...submissions,
    [id]: { ...current, transcript: [...(current.transcript ?? []), ...turns] },
  };
  write();
}

function write() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch {
    // Session-only if storage is unavailable. A case the client cannot find
    // after a reload is bad; one they cannot find at all is worse.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Everything this browser has submitted, keyed by the case it landed on.
 *
 * The same object until something is recorded, which is not an optimisation:
 * `useSyncExternalStore` re-renders until a snapshot stops changing identity,
 * so a reader that built a fresh object every call would spin forever.
 */
export function readSubmissions(): Submissions {
  load();
  return submissions;
}

function getServerSnapshot(): Submissions {
  return NONE;
}

/** The same, as a subscription. */
export function useSubmissions(): Submissions {
  return useSyncExternalStore(subscribe, readSubmissions, getServerSnapshot);
}

/** "Your cases", with the client's own submission showing what they sent. */
export function useCasesWithSubmission(
  cases: readonly LegalCase[],
): LegalCase[] {
  const submitted = useSubmissions();
  return useMemo(
    () =>
      cases.map((one) => {
        const submission = submitted[one.id];
        return submission ? applySubmission(one, submission) : one;
      }),
    [cases, submitted],
  );
}

/** One case, likewise. */
export function useCaseWithSubmission(legalCase: LegalCase): LegalCase {
  const submitted = useSubmissions();
  return useMemo(() => {
    const submission = submitted[legalCase.id];
    return submission ? applySubmission(legalCase, submission) : legalCase;
  }, [legalCase, submitted]);
}

/**
 * The case's thread, with the intake conversation in front of it.
 *
 * In front rather than merged by date, then sorted like the fixtures are: the
 * intake happened before counsel joined, and that is the order the case chat's
 * own phase divider is built around.
 *
 * Takes the already-overlaid case, so a turn's files resolve to the same
 * document records the Documents tab lists.
 */
export function useMessagesWithSubmission(
  legalCase: LegalCase,
  messages: readonly Message[],
): Message[] {
  const submitted = useSubmissions();
  return useMemo(() => {
    const turns = submitted[legalCase.id]?.transcript;
    if (!turns || turns.length === 0) return [...messages];
    return [
      ...toCaseTranscript({
        caseId: legalCase.id,
        turns,
        client: legalCase.client,
        documents: legalCase.documents,
      }),
      ...messages,
    ];
  }, [legalCase, messages, submitted]);
}

/**
 * The fixture, saying what the client actually sent.
 *
 * Exported for its tests. The status, the absent quote and the absent lawyer
 * are left exactly as the fixture has them: that case was written to be a
 * just-submitted one, which is what this is, and a submission has no business
 * deciding where a case sits in the firm's queue.
 *
 * The description is only replaced when there is one. A recap that failed
 * should leave the case readable rather than blank, and the fields on the
 * brief — which is what the lawyer opens — say everything it would have
 * summarised.
 */
export function applySubmission(
  legalCase: LegalCase,
  submission: SubmittedCase,
): LegalCase {
  return {
    ...legalCase,
    title: submission.title,
    ...(submission.description
      ? { description: submission.description }
      : undefined),
    documents: [...legalCase.documents, ...submittedDocuments(submission)],
    receivedAt: submission.submittedAt,
    createdAt: submission.submittedAt,
    updatedAt: submission.submittedAt,
  };
}

/**
 * The handed-over files as document records.
 *
 * Ids are derived from the position in the list rather than generated, so the
 * same submission produces the same records on every read. `createUploadedDocuments`
 * in the documents model does the versioning-by-family job properly, but it
 * stamps `new Date()` and a random id, and a snapshot that changes identity
 * every time it is read is the one thing a `useSyncExternalStore` store cannot
 * hand out. Nothing here needs families: these are the originals.
 */
function submittedDocuments(submission: SubmittedCase): Document[] {
  return submission.documentNames.map((name, index) => ({
    id: `doc_submitted_${index + 1}`,
    familyId: `fam_submitted_${index + 1}`,
    version: 1,
    name,
    size: 0,
    mimeType: '',
    uploadedAt: submission.submittedAt,
    uploadedBy: 'You',
    uploaderActor: 'client',
    docType: 'other',
    status: 'final',
    isDraft: false,
  }));
}
