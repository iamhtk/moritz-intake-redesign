/**
 * The lawyer's side of QA: what they submit, and what the QA agent says back.
 *
 * The feedback types mirror the `qaFeedback` zod schema the backend will emit,
 * field for field, so the screens can be lifted onto the real payload without a
 * translation layer. The only additions are `id`s, which React needs for keys
 * and the UI needs to link a finding to the thing it is about — the agent's
 * output is positional, so ids are assigned when a verdict is recorded.
 */

/** A section of text that should be written differently. */
export type FixRewrite = {
  id: string;
  type: 'REWRITE';
  /** What the text is currently saying. */
  currentText: string;
  /** What the text should actually contain. */
  shouldBe: string;
};

export type FixMissingReference = {
  id: string;
  type: 'MISSING_REFERENCE';
  currentText: string;
  /** Description of the reference needed. */
  referenceNeeded: string;
};

/** Anything else that needs to be fixed. */
export type FixGeneric = {
  id: string;
  type: 'GENERIC';
  /** A complete and unambiguous description of what needs to be fixed. */
  description: string;
};

export type ThingToFix = FixRewrite | FixMissingReference | FixGeneric;

export type QaStatus = 'PASSED' | 'FAILED';

/** One of the checks we always force the agent to perform, and its result. */
export type QaCheck = {
  id: string;
  title: string;
  description: string;
  status: QaStatus;
  thingsToFix: ThingToFix[];
};

export type QaFeedback = {
  verdict: QaStatus;
  /** A brief explanation of the results. */
  brief: string;
  checks: QaCheck[];
  /** Other things to fix, highlighted by the agent. */
  otherThingsToFix: ThingToFix[];
};

/**
 * What the drafting agent did about one thing QA flagged. It can apply a fix QA
 * stated precisely, but a finding that turns on facts or judgement it does not
 * have is handed back rather than guessed at.
 */
export type DraftFixAttempt = {
  fixId: string;
  outcome: 'ADDRESSED' | 'NEEDS_LAWYER';
  note: string;
};

/**
 * The drafting agent's answer to a failed verdict: a revised document that
 * attempts the fixes, and an account of what it did about each finding. The
 * lawyer is never handed a bare list of complaints — the agent has a go first,
 * and what arrives is a draft to check rather than work to redo.
 */
export type DraftRevision = {
  id: string;
  fileName: string;
  createdAt: string;
  summary: string;
  attempts: DraftFixAttempt[];
};

/**
 * One round of work the lawyer sent for review. The lawyer sees a form, but a
 * submission is the same append-only record the backend keeps as a
 * conversation — so every round stays readable after the next one lands.
 */
export type WorkSubmission = {
  id: string;
  /** 1-based round number, shown as "Submission 1". */
  round: number;
  submittedAt: string;
  fileName: string;
  /** The lawyer's own note to whoever reads the work. */
  comment: string;
  /** `reviewing` while the agent is still working; feedback arrives with `complete`. */
  state: 'reviewing' | 'complete';
  feedback?: QaFeedback;
  /**
   * Only on a failed round: the drafting agent is handed the findings and has a
   * go at them, so `drafting` runs after the verdict lands and `ready` brings a
   * revised draft with it.
   */
  revisionState?: 'drafting' | 'ready';
  revision?: DraftRevision;
};

/**
 * Context the intake agent forwarded from the case — counterparty redlines, a
 * clarification from the client, a new deadline. The lawyer is not in the client
 * conversation, so this is the channel that reaches them, and it is deliberately
 * shapeless: a title, a summary and whatever files came with it.
 */
export type ForwardedUpdate = {
  id: string;
  forwardedAt: string;
  title: string;
  summary: string;
  fileNames: string[];
};

export type ReviewWorkspace = {
  caseId: string;
  submissions: WorkSubmission[];
  /** Set once a passing round has been sent on to the client. */
  delivered?: { at: string; fileName: string };
};

/**
 * The QA agent, canned. The first round comes back failed with something of
 * every kind to fix so the screens can be read against real content; the second
 * passes. Rounds past the second reuse the passing verdict.
 */
const CANNED_FEEDBACK: QaFeedback[] = [
  {
    verdict: 'FAILED',
    brief:
      'The notice is structurally sound and the argument on the renewal window holds up. Two standard checks did not pass: the cure period contradicts the agreement it cites, and the clause reference is missing. Both are quick fixes.',
    checks: [
      {
        id: 'chk_authority',
        title: 'Cited authority exists and says what we say it says',
        description:
          'Every statute, case and contractual provision the work relies on is real, current, and supports the proposition it is cited for.',
        status: 'PASSED',
        thingsToFix: [],
      },
      {
        id: 'chk_references',
        title: 'Clause references are complete',
        description:
          'Any obligation the work asserts is tied to the specific clause of the agreement that creates it.',
        status: 'FAILED',
        thingsToFix: [
          {
            id: 'fix_ref_1',
            type: 'MISSING_REFERENCE',
            currentText:
              'The Supplier failed to provide the required notice of renewal within the agreed window.',
            referenceNeeded:
              'Cite the clause that sets the renewal notice window — Section 14.2 of the Master Services Agreement dated 4 April 2024. Without it the recipient cannot check the obligation being asserted.',
          },
        ],
      },
      {
        id: 'chk_remedy',
        title: 'Remedies and deadlines match the agreement',
        description:
          'Cure periods, notice periods and remedies stated in the work are the ones the underlying contract actually provides.',
        status: 'FAILED',
        thingsToFix: [
          {
            id: 'fix_rewrite_1',
            type: 'REWRITE',
            currentText:
              'You are required to remedy this breach within fourteen (14) days of receipt of this notice.',
            shouldBe:
              'You are required to remedy this breach within thirty (30) days of receipt of this notice, as provided by Section 18.1 of the Master Services Agreement.',
          },
        ],
      },
      {
        id: 'chk_positions',
        title: 'Client-approved positions are respected',
        description:
          'The work stays inside the positions the client signed off on and does not concede anything outside them.',
        status: 'PASSED',
        thingsToFix: [],
      },
      {
        id: 'chk_privilege',
        title: 'No privileged or internal material is exposed',
        description:
          'Internal analysis, fee discussion and privileged correspondence do not appear in anything addressed to a counterparty.',
        status: 'PASSED',
        thingsToFix: [],
      },
    ],
    otherThingsToFix: [
      {
        id: 'fix_generic_1',
        type: 'GENERIC',
        description:
          'The letter is addressed to "Counsel" but the counterparty has not appointed external counsel on this matter. Address it to the Supplier\'s contract manager named in Schedule 2, and copy the notices address in Section 22.',
      },
    ],
  },
  {
    verdict: 'PASSED',
    brief:
      'All standard checks passed. The cure period now matches Section 18.1, the renewal clause is cited, and the notice is addressed to the contract manager. Nothing further to fix — this has been sent on to the client.',
    checks: [
      {
        id: 'chk_authority',
        title: 'Cited authority exists and says what we say it says',
        description:
          'Every statute, case and contractual provision the work relies on is real, current, and supports the proposition it is cited for.',
        status: 'PASSED',
        thingsToFix: [],
      },
      {
        id: 'chk_references',
        title: 'Clause references are complete',
        description:
          'Any obligation the work asserts is tied to the specific clause of the agreement that creates it.',
        status: 'PASSED',
        thingsToFix: [],
      },
      {
        id: 'chk_remedy',
        title: 'Remedies and deadlines match the agreement',
        description:
          'Cure periods, notice periods and remedies stated in the work are the ones the underlying contract actually provides.',
        status: 'PASSED',
        thingsToFix: [],
      },
      {
        id: 'chk_positions',
        title: 'Client-approved positions are respected',
        description:
          'The work stays inside the positions the client signed off on and does not concede anything outside them.',
        status: 'PASSED',
        thingsToFix: [],
      },
      {
        id: 'chk_privilege',
        title: 'No privileged or internal material is exposed',
        description:
          'Internal analysis, fee discussion and privileged correspondence do not appear in anything addressed to a counterparty.',
        status: 'PASSED',
        thingsToFix: [],
      },
    ],
    otherThingsToFix: [],
  },
];

/** The verdict a given round comes back with; later rounds keep passing. */
export function feedbackForRound(round: number): QaFeedback {
  const index = Math.min(round, CANNED_FEEDBACK.length) - 1;
  return CANNED_FEEDBACK[Math.max(index, 0)]!;
}

/** Whether a verdict has anything at all for the lawyer to act on. */
export function fixCount(feedback: QaFeedback): number {
  return (
    feedback.checks.reduce(
      (total, check) => total + check.thingsToFix.length,
      0,
    ) + feedback.otherThingsToFix.length
  );
}

/** Every finding in a verdict, checks and loose flags alike, in reading order. */
export function allThingsToFix(feedback: QaFeedback): ThingToFix[] {
  return [
    ...feedback.checks.flatMap((check) => check.thingsToFix),
    ...feedback.otherThingsToFix,
  ];
}

/** `Notice.docx` -> `Notice (Moritz revision r1).docx`. */
function revisedFileName(fileName: string, round: number): string {
  const dot = fileName.lastIndexOf('.');
  const suffix = ` (Moritz revision r${round})`;
  if (dot <= 0) return `${fileName}${suffix}`;
  return `${fileName.slice(0, dot)}${suffix}${fileName.slice(dot)}`;
}

/**
 * What the drafting agent can do about a finding on its own. QA states a rewrite
 * and a missing citation precisely enough to apply, so those come back done. A
 * generic note is, by its nature, whatever the agent could not pin down — acting
 * on it would mean inventing facts, so it goes back to the lawyer named.
 */
function attemptFor(fix: ThingToFix): DraftFixAttempt {
  switch (fix.type) {
    case 'REWRITE':
      return {
        fixId: fix.id,
        outcome: 'ADDRESSED',
        note: 'Replaced with the wording QA asked for.',
      };
    case 'MISSING_REFERENCE':
      return {
        fixId: fix.id,
        outcome: 'ADDRESSED',
        note: 'Citation inserted and checked against the agreement on the case.',
      };
    case 'GENERIC':
      return {
        fixId: fix.id,
        outcome: 'NEEDS_LAWYER',
        note: 'Needs a call this agent should not make on your behalf.',
      };
  }
}

/**
 * The drafting agent's pass over a failed round. Built from the verdict itself,
 * so it stays honest about which findings it actually closed.
 */
export function revisionFor(
  submission: WorkSubmission,
  feedback: QaFeedback,
): DraftRevision {
  const attempts = allThingsToFix(feedback).map(attemptFor);
  const addressed = attempts.filter(
    (attempt) => attempt.outcome === 'ADDRESSED',
  ).length;
  const remaining = attempts.length - addressed;

  return {
    id: `rev_${submission.id}`,
    fileName: revisedFileName(submission.fileName, submission.round),
    createdAt: new Date().toISOString(),
    summary:
      remaining === 0
        ? `Applied all ${addressed} of QA's findings to your document. Read it over and resubmit if you are happy with it.`
        : `Applied ${addressed} of QA's ${attempts.length} findings to your document. ${remaining === 1 ? 'One is' : `${remaining} are`} left for you — flagged below.`,
    attempts,
  };
}

const FORWARDED_UPDATES: Record<string, ForwardedUpdate[]> = {
  case_001: [
    {
      id: 'fwd_001_redlines',
      forwardedAt: '2026-05-21T09:20:00.000Z',
      title: 'Counterparty returned redlines',
      summary:
        'The Supplier came back on the renewal clause and struck the 30-day cure period, offering 14 days instead. They also added a carve-out for force majeure delays. The client wants to hold the 30 days.',
      fileNames: ['MSA - Supplier redlines (May 21).docx'],
    },
    {
      id: 'fwd_001_deadline',
      forwardedAt: '2026-05-22T11:40:00.000Z',
      title: 'Client confirmed the filing deadline',
      summary:
        'The client needs the notice served before the renewal window closes on 5 June. Anything after that changes the argument, so treat 5 June as hard.',
      fileNames: [],
    },
  ],
};

export function forwardedUpdatesForCase(caseId: string): ForwardedUpdate[] {
  return FORWARDED_UPDATES[caseId] ?? [];
}

const storageKey = (caseId: string) => `playground:lawyer-review:${caseId}`;

export function seedReviewWorkspace(caseId: string): ReviewWorkspace {
  return { caseId, submissions: [] };
}

export function loadReviewWorkspace(caseId: string): ReviewWorkspace {
  if (typeof window === 'undefined') return seedReviewWorkspace(caseId);
  try {
    const raw = window.localStorage.getItem(storageKey(caseId));
    if (!raw) return seedReviewWorkspace(caseId);
    const parsed = JSON.parse(raw) as ReviewWorkspace;
    if (!Array.isArray(parsed.submissions)) return seedReviewWorkspace(caseId);
    return { ...parsed, caseId };
  } catch {
    return seedReviewWorkspace(caseId);
  }
}

export function saveReviewWorkspace(workspace: ReviewWorkspace) {
  try {
    window.localStorage.setItem(
      storageKey(workspace.caseId),
      JSON.stringify(workspace),
    );
  } catch {
    // Session-only if storage is unavailable.
  }
}
