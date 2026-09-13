/**
 * What each role is allowed to be told about — the privacy boundary for Ask
 * and for the command palette (tasks N1, K3).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DO NOT REPLACE THIS WITH `getCasesForRole()` FROM `lib/mocks/cases.ts`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * There is a helper in that file named almost exactly for this job, and reusing
 * it is the obvious move. It is also wrong, and the comment it carries says so
 * in its own words:
 *
 *   > "Design playground: surface every mock case in the client view so the
 *   > list demonstrates all statuses and conversations, not just Northwind's."
 *
 * `getCasesForRole('NON_LEGAL')` returns **all nine** mock cases. For a table
 * that exists to demonstrate five statuses, that is the right call. For a
 * grounded answer it is a leak: a client asking "list every case you know
 * about" would get Oakworks' and Trellis Logistics' matters read back by name —
 * a believable-looking confidentiality breach, in a legal product, in a demo
 * built to be inspected.
 *
 * So there are two functions with two purposes, and this comment exists at both
 * ends so that neither gets "tidied" into the other.
 *
 * **Two further reasons this must live in code and not in the prompt.** First,
 * "only discuss the user's own cases" is a suggestion to a model, not a
 * boundary; the intake flow already learned that a rule the model follows
 * unreliably is a coin it flips. Second, a projection is testable —
 * `scope.test.ts` asserts that the string the model actually sees contains zero
 * out-of-scope case numbers, which is an assertion no amount of prompt review
 * can replace.
 *
 * Pure on purpose: the route resolves the role from the cookie server-side and
 * passes it in, and the palette passes the role it already has. Nothing here
 * reads a cookie, a header or `window`, so the same boundary runs on both
 * sides and there is only one of it to get right.
 */

import { MOCK_AUDIT_LOG } from '@/lib/mocks/audit-log';
import { MOCK_CASES } from '@/lib/mocks/cases';
import { MOCK_CASE_TYPES } from '@/lib/mocks/case-types';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import { MOCK_USERS } from '@/lib/mocks/users';
import type {
  AuditLogEntry,
  AuthUser,
  CaseType,
  Company,
  Document,
  LegalCase,
  QuoteRound,
  Role,
} from '@/lib/types';

/**
 * Everything a role may be told about, and nothing else.
 *
 * Every list is empty rather than absent where a role has no access, so a
 * consumer never has to ask "is this undefined because there is none, or
 * because I am not allowed?" — the answer to both is an empty array, and the
 * consumer cannot accidentally fall back to an unscoped source.
 */
export type AskScope = {
  role: Role;
  /** The person asking. Used for "my cases" and for the generated-at line. */
  user: AuthUser;
  /**
   * The only cases that may be named. Anything not in here does not exist as
   * far as Ask and the palette are concerned.
   */
  cases: LegalCase[];
  /**
   * `LEGAL` only: unclaimed work this lawyer could take on. Separate from
   * `cases` because it is offered rather than owned, and conflating the two
   * would let a lawyer's "my matters" answer include work that is not theirs.
   */
  claimable: LegalCase[];
  /**
   * Quote rounds for cases already in scope. Never a firm-wide list.
   *
   * Lawyer and internal roles only — **always empty for a client**, because a
   * round is the bidding record rather than the client's price. See the note in
   * the `NON_LEGAL` branch of `buildAskScope`.
   */
  quoteRounds: QuoteRound[];
  /** Documents attached to cases already in scope, drafts included. */
  documents: Document[];
  /** Case types. Reference data, not anyone's private information. */
  caseTypes: CaseType[];
  /** Companies. Admin and assistant only. */
  companies: Company[];
  /** The user directory. Admin and assistant only. */
  people: AuthUser[];
  /** The audit log. Admin only — the assistant is deliberately excluded. */
  auditLog: AuditLogEntry[];
};

/** Every document on a set of cases, de-duplicated, drafts included. */
function documentsOf(cases: LegalCase[]): Document[] {
  const byId = new Map<string, Document>();
  for (const legalCase of cases) {
    for (const document of [
      ...legalCase.documents,
      ...legalCase.draftDocuments,
    ]) {
      byId.set(document.id, document);
    }
  }
  return [...byId.values()];
}

/**
 * Quote rounds belonging to cases in scope.
 *
 * Matched on `caseId` *and* `caseNumber` because the two mock sets were
 * authored separately and a round referring to a case by number alone would
 * otherwise slip through as out of scope. Matching on either is the safe
 * direction here: the risk being guarded against is a round for an
 * out-of-scope case being *included*, and both identifiers are checked against
 * the same in-scope set.
 */
function quoteRoundsOf(cases: LegalCase[]): QuoteRound[] {
  const caseIds = new Set(cases.map((c) => c.id));
  const caseNumbers = new Set(cases.map((c) => c.caseNumber));
  return MOCK_QUOTE_ROUNDS.filter(
    (round) => caseIds.has(round.caseId) && caseNumbers.has(round.caseNumber),
  );
}

/**
 * The client projection.
 *
 * Their own matters, by either of the two ways the mocks express ownership: the
 * case names them as the client, or it belongs to their company. The company
 * arm is what makes this right for a team rather than for an individual —
 * Northwind's operations lead should see Northwind's cases, including any a
 * colleague opened.
 */
function clientCases(user: AuthUser): LegalCase[] {
  return MOCK_CASES.filter(
    (c) => c.client.id === user.id || c.ownerCompanyId === user.company.id,
  );
}

/**
 * The lawyer projection.
 *
 * Strictly the cases assigned to *this* lawyer. Deliberately **not** widened to
 * the lawyer's firm (`legalCompanyId === user.company.id`), even though that
 * would be a one-word change and would make the surface look fuller: §8.3 of
 * the plan lists "other lawyers' assigned matters" under *Never*, and a
 * boundary relaxed to improve a demo is not a boundary.
 *
 * Known consequence, which is a mock-data shortcoming and not a scoping bug:
 * the shipped `MOCK_LEGAL_USER` is `usr_legal_001`, and every assigned case in
 * `MOCK_CASES` names `usr_legal_003`, `usr_legal_004` or `usr_legal_005`. So
 * this returns **nothing** for the lawyer the playground actually signs in as,
 * and Ask's quiet state is what a lawyer sees. That is the honest answer to the
 * data as it stands. `scope.test.ts` covers the populated case with a synthetic
 * lawyer, so the projection is proven to include as well as exclude.
 */
function lawyerCases(user: AuthUser): LegalCase[] {
  return MOCK_CASES.filter((c) => c.assignedLawyer?.id === user.id);
}

/** Unclaimed work any lawyer may be offered. Empty in the current mocks. */
function claimableCases(): LegalCase[] {
  return MOCK_CASES.filter((c) => c.status === 'READY_FOR_CLAIM');
}

/**
 * Build the scope for a role.
 *
 * The `switch` is exhaustive over `Role` with no `default`, so adding a fifth
 * role is a type error here rather than a silent fall-through to whichever
 * branch happened to be last. A new role failing to compile is the outcome we
 * want; a new role quietly inheriting the admin projection is the one we do not.
 */
export function buildAskScope(role: Role, user: AuthUser): AskScope {
  switch (role) {
    case 'NON_LEGAL': {
      const cases = clientCases(user);
      return {
        role,
        user,
        cases,
        // A client is never offered unclaimed work.
        claimable: [],
        /*
         * ─────────────────────────────────────────────────────────────────────
         * A CLIENT GETS NO QUOTE ROUNDS. This is not a tidy-up; it is a fix.
         * ─────────────────────────────────────────────────────────────────────
         *
         * `QuoteRound` is the *lawyer's* side of pricing, and every field on it
         * is written from that seat: `yourQuoteAmount` is the bid a particular
         * firm submitted, `yourQuoteStatus` is whether that firm won it,
         * `benchmarkAmount` is Moritz's own internal price benchmark, and
         * `adminNotes` records how many firms were invited.
         *
         * `quoteRoundsOf(cases)` matched on case, so it did include the
         * client's own matters, and the projection looked correct. What it
         * actually handed Alex Morgan was `qr_002` on their own case
         * M-2026-0123:
         *
         *   your quote: $3,900 | status: SUBMITTED | benchmark: $3,500
         *
         * None of those three numbers is the client's. The price Alex is
         * actually quoted is `case.quoteAmount`, which is $5,600 and is the
         * figure on their own screen. So a client pressing the "What am I being
         * charged for?" chip was grounded on a lawyer's bid and an internal
         * benchmark, and the likeliest answer was a wrong number with the word
         * "your" in front of it, plus a disclosure of what Moritz thinks the
         * work is worth.
         *
         * The client-facing equivalent already exists and needs nothing built:
         * `case.quoteAmount` is in the case line. That is the whole replacement.
         */
        quoteRounds: [],
        documents: documentsOf(cases),
        caseTypes: MOCK_CASE_TYPES,
        // No company directory, no user list, no firm-wide counts. A client
        // asking "who else uses Moritz" gets nothing to answer from.
        companies: [],
        people: [],
        auditLog: [],
      };
    }

    case 'LEGAL': {
      const cases = lawyerCases(user);
      const claimable = claimableCases();
      return {
        role,
        user,
        cases,
        claimable,
        // Rounds for their own matters and for work they could claim. Not the
        // firm's whole quote book.
        quoteRounds: quoteRoundsOf([...cases, ...claimable]),
        documents: documentsOf(cases),
        caseTypes: MOCK_CASE_TYPES,
        // Company admin data is out of scope for a lawyer.
        companies: [],
        people: [],
        auditLog: [],
      };
    }

    case 'INTERNAL_ADMIN':
      return {
        role,
        user,
        cases: MOCK_CASES,
        claimable: claimableCases(),
        quoteRounds: MOCK_QUOTE_ROUNDS,
        documents: documentsOf(MOCK_CASES),
        caseTypes: MOCK_CASE_TYPES,
        companies: MOCK_COMPANIES,
        people: MOCK_USERS,
        auditLog: MOCK_AUDIT_LOG,
      };

    case 'INTERNAL_ASSISTANT':
      return {
        role,
        user,
        cases: MOCK_CASES,
        claimable: claimableCases(),
        quoteRounds: MOCK_QUOTE_ROUNDS,
        documents: documentsOf(MOCK_CASES),
        caseTypes: MOCK_CASE_TYPES,
        companies: MOCK_COMPANIES,
        people: MOCK_USERS,
        // The one difference from admin, per §8.3. The audit log records who
        // read what, which is a different class of information from the records
        // themselves.
        auditLog: [],
      };
  }
}

/**
 * Every case number a scope may mention.
 *
 * The lookup `extractAskActions` uses to decide whether a reference the model
 * produced is real. A number not in here must yield no button, which is what
 * turns a hallucinated citation into a plain sentence rather than into a
 * control that goes somewhere wrong.
 */
export function inScopeCaseNumbers(scope: AskScope): Set<string> {
  return new Set([...scope.cases, ...scope.claimable].map((c) => c.caseNumber));
}

/** A case from the scope by id or number, or `undefined` if out of scope. */
export function findInScopeCase(
  scope: AskScope,
  idOrNumber: string,
): LegalCase | undefined {
  return [...scope.cases, ...scope.claimable].find(
    (c) => c.id === idOrNumber || c.caseNumber === idOrNumber,
  );
}
