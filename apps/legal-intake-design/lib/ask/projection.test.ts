import { describe, expect, it } from 'vitest';
import { MOCK_CASES, getCasesForRole } from '@/lib/mocks/cases';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import {
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
} from '@/lib/mocks/users';
import type { AuthUser, Role } from '@/lib/types';
import { buildAskScope, findInScopeCase, inScopeCaseNumbers } from './scope';

/**
 * The projections themselves (task N1).
 *
 * `scope.test.ts` is the companion and the stricter one: it asserts against the
 * serialised string the model actually sees, which is the artefact that can
 * leak. This file asserts the projection is the right *shape* first, because a
 * string assertion on a wrong projection passes for the wrong reason.
 *
 * The contract under test is §8.3 of `notes/final-plan.md`.
 */

/** Every case number in the mocks, in scope or not. */
const ALL_CASE_NUMBERS = MOCK_CASES.map((c) => c.caseNumber);

const numbersOf = (cases: { caseNumber: string }[]) =>
  cases.map((c) => c.caseNumber).sort();

describe('the client projection', () => {
  const scope = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);

  it('includes only their own company’s cases', () => {
    expect(numbersOf(scope.cases)).toEqual(
      ['M-2026-0114', 'M-2026-0121', 'M-2026-0123', 'M-2026-0126'].sort(),
    );
  });

  /*
   * ⚠️ B, asserted directly. This is the whole reason `lib/ask/scope.ts`
   * exists, so the difference is pinned rather than described: if someone
   * "tidies" the two helpers together, this is the test that says what broke.
   */
  it('is strictly narrower than getCasesForRole, which returns everything', () => {
    expect(getCasesForRole('NON_LEGAL')).toHaveLength(9);
    expect(scope.cases.length).toBeLessThan(9);

    const leaked = numbersOf(getCasesForRole('NON_LEGAL')).filter(
      (number) => !numbersOf(scope.cases).includes(number),
    );
    // The five that would have been read back to Alex by the list helper.
    expect(leaked).toEqual([
      'M-2026-0094',
      'M-2026-0118',
      'M-2026-0122',
      'M-2026-0124',
      'M-2026-0125',
    ]);
  });

  it('names no other company’s case', () => {
    for (const legalCase of scope.cases) {
      expect(legalCase.ownerCompanyId).toBe(MOCK_CLIENT_USER.company.id);
    }
  });

  it('is never offered unclaimed work', () => {
    expect(scope.claimable).toEqual([]);
  });

  /* §8.3 Never: any user list, firm-wide counts, company admin data. */
  it('carries no directory, no company list and no audit log', () => {
    expect(scope.people).toEqual([]);
    expect(scope.companies).toEqual([]);
    expect(scope.auditLog).toEqual([]);
  });

  it('carries only documents for its own cases', () => {
    const ownDocumentIds = new Set(
      scope.cases
        .flatMap((c) => [...c.documents, ...c.draftDocuments])
        .map((d) => d.id),
    );
    for (const document of scope.documents) {
      expect(ownDocumentIds.has(document.id)).toBe(true);
    }
  });

  /*
   * ⭐ A client gets no quote rounds at all, and this test exists because the
   * old code looked right. `quoteRoundsOf(cases)` matched on case, so the
   * rounds it returned genuinely were on the client's own matters and every
   * leak test passed.
   *
   * A `QuoteRound` is the *lawyer's* side of pricing, though, and every field
   * is named from that seat: `yourQuoteAmount` is a firm's bid,
   * `benchmarkAmount` is Moritz's internal price benchmark, `adminNotes`
   * records how many firms were invited. Alex's own case M-2026-0123 carries
   * `qr_002`, whose bid is $3,900 against a $3,500 benchmark, while the price
   * Alex is actually quoted is `case.quoteAmount` at $5,600.
   *
   * So the round was both the wrong vocabulary and the wrong number, and the
   * "What am I being charged for?" chip pointed straight at it.
   */
  it('is handed no quote rounds, because a round is the bidding record', () => {
    expect(scope.quoteRounds).toEqual([]);

    // Not vacuous: there is a round on one of this client's own cases, and the
    // old projection did return it.
    const own = new Set(scope.cases.map((c) => c.caseNumber));
    const onOwnCase = MOCK_QUOTE_ROUNDS.filter((round) =>
      own.has(round.caseNumber),
    );
    expect(onOwnCase).toHaveLength(1);
    expect(onOwnCase[0]!.caseNumber).toBe('M-2026-0123');
  });

  /* The client-facing replacement, which needed nothing built. */
  it('carries the client’s own price on the case instead', () => {
    const leased = scope.cases.find((c) => c.caseNumber === 'M-2026-0123');
    expect(leased!.quoteAmount).toBe(5_600);
  });
});

describe('the lawyer projection', () => {
  /*
   * The shipped mock lawyer has no assignments: `MOCK_LEGAL_USER` is
   * `usr_legal_001` and every assigned case names `usr_legal_003/004/005`.
   * Asserted rather than worked around, because it is the honest state of the
   * data and it is what a lawyer will actually see. Widening the projection to
   * the lawyer's firm would fill the screen and break §8.3's "Never: other
   * lawyers' assigned matters".
   */
  it('is empty for the shipped mock lawyer, who has no assignments', () => {
    const scope = buildAskScope('LEGAL', MOCK_LEGAL_USER);
    expect(scope.cases).toEqual([]);
    expect(
      MOCK_CASES.some((c) => c.assignedLawyer?.id === MOCK_LEGAL_USER.id),
    ).toBe(false);
  });

  /* The same projection, against a lawyer who does have work. */
  const catarina: AuthUser = {
    ...MOCK_LEGAL_USER,
    id: 'usr_legal_003',
    name: 'Catarina Milagre',
  };
  const scope = buildAskScope('LEGAL', catarina);

  it('includes exactly the cases assigned to that lawyer', () => {
    expect(numbersOf(scope.cases)).toEqual(
      ['M-2026-0118', 'M-2026-0122', 'M-2026-0125'].sort(),
    );
  });

  it('excludes every other lawyer’s assigned matters', () => {
    for (const legalCase of scope.cases) {
      expect(legalCase.assignedLawyer?.id).toBe(catarina.id);
    }
    // Aélita's and Daniel's matters, specifically.
    expect(numbersOf(scope.cases)).not.toContain('M-2026-0124');
    expect(numbersOf(scope.cases)).not.toContain('M-2026-0114');
  });

  it('carries no company admin data', () => {
    expect(scope.companies).toEqual([]);
    expect(scope.people).toEqual([]);
    expect(scope.auditLog).toEqual([]);
  });

  /*
   * No mock case carries READY_FOR_CLAIM today, so this is empty. Asserted
   * anyway: the projection is the thing under test, and a seed expansion that
   * adds a claimable case should light this up rather than surprise anyone.
   */
  it('offers claimable work as a separate list, empty in the current mocks', () => {
    expect(scope.claimable).toEqual([]);
    expect(MOCK_CASES.some((c) => c.status === 'READY_FOR_CLAIM')).toBe(false);
  });
});

describe('the internal projections', () => {
  it('gives admin everything, including the audit log', () => {
    const scope = buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER);
    expect(numbersOf(scope.cases)).toEqual([...ALL_CASE_NUMBERS].sort());
    expect(scope.companies.length).toBeGreaterThan(0);
    expect(scope.people.length).toBeGreaterThan(0);
    expect(scope.auditLog.length).toBeGreaterThan(0);
  });

  /* §8.3: the assistant is admin "minus audit log". That is the only gap. */
  it('gives the assistant the same as admin, minus the audit log', () => {
    const admin = buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER);
    const assistant = buildAskScope('INTERNAL_ASSISTANT', MOCK_ASSISTANT_USER);

    expect(numbersOf(assistant.cases)).toEqual(numbersOf(admin.cases));
    expect(assistant.companies).toEqual(admin.companies);
    expect(assistant.people).toEqual(admin.people);
    expect(assistant.quoteRounds).toEqual(admin.quoteRounds);
    expect(assistant.auditLog).toEqual([]);
    expect(admin.auditLog.length).toBeGreaterThan(0);
  });
});

describe('the lookups that guard against a hallucinated reference', () => {
  const scope = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);

  it('lists every case number the scope may mention, and no others', () => {
    expect([...inScopeCaseNumbers(scope)].sort()).toEqual(
      numbersOf(scope.cases),
    );
  });

  it('finds an in-scope case by number and by id', () => {
    expect(findInScopeCase(scope, 'M-2026-0126')?.caseNumber).toBe(
      'M-2026-0126',
    );
    expect(findInScopeCase(scope, 'case_009')?.caseNumber).toBe('M-2026-0126');
  });

  /*
   * The two negatives that matter. A fabricated number must not resolve, and
   * neither must a *real* case that this reader is not entitled to — the second
   * is the more dangerous of the two, because it exists and would look right.
   */
  it('does not find a fabricated case number', () => {
    expect(findInScopeCase(scope, 'M-2026-9999')).toBeUndefined();
    expect(inScopeCaseNumbers(scope).has('M-2026-9999')).toBe(false);
  });

  it('does not find a real case belonging to another company', () => {
    expect(MOCK_CASES.some((c) => c.caseNumber === 'M-2026-0118')).toBe(true);
    expect(findInScopeCase(scope, 'M-2026-0118')).toBeUndefined();
    expect(inScopeCaseNumbers(scope).has('M-2026-0118')).toBe(false);
  });
});

describe('every role', () => {
  const users: Record<Role, AuthUser> = {
    NON_LEGAL: MOCK_CLIENT_USER,
    LEGAL: MOCK_LEGAL_USER,
    INTERNAL_ADMIN: MOCK_ADMIN_USER,
    INTERNAL_ASSISTANT: MOCK_ASSISTANT_USER,
  };

  /* D1: all four roles ship a real projection. A stub would prove nothing. */
  it.each(Object.keys(users) as Role[])('%s builds a scope', (role) => {
    const scope = buildAskScope(role, users[role]);
    expect(scope.role).toBe(role);
    expect(scope.user).toBe(users[role]);
    expect(Array.isArray(scope.cases)).toBe(true);
  });

  it.each(Object.keys(users) as Role[])(
    '%s only ever names cases that exist in the mocks',
    (role) => {
      const scope = buildAskScope(role, users[role]);
      for (const legalCase of [...scope.cases, ...scope.claimable]) {
        expect(ALL_CASE_NUMBERS).toContain(legalCase.caseNumber);
      }
    },
  );
});
