import { describe, expect, it } from 'vitest';
import { MOCK_CASES } from '@/lib/mocks/cases';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import {
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
  MOCK_USERS,
} from '@/lib/mocks/users';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import type { AuthUser, Role } from '@/lib/types';
import {
  ASK_CLIENT_SYSTEM_PROMPT,
  ASK_SYSTEM_PROMPT,
  askSystemPrompt,
  buildAskContext,
} from './context';
import { buildAskScope } from './scope';

/**
 * ⚠️ B, made permanent (task N3). **This is the non-negotiable test.**
 *
 * `projection.test.ts` checks the projections are the right shape. This one
 * checks the thing that can actually leak: the **serialised string the model
 * receives**. The distinction matters more than it looks. A correct projection
 * plus a serialiser that reaches past it for one convenient field — an
 * `ownerCompanyName` here, a `participants` list there — is a leak that every
 * projection test in the world passes.
 *
 * String containment is therefore the right assertion, and it is the assertion
 * §8.3 asks for by name: for each role, the context must contain **zero**
 * out-of-scope case numbers. Case numbers are the ideal probe because they are
 * unique, they are the thing a client would recognise as somebody else's, and
 * they are exactly what a leak would read back.
 */

const NOW = new Date('2026-09-12T19:00:00.000Z');

const USERS: Record<Role, AuthUser> = {
  NON_LEGAL: MOCK_CLIENT_USER,
  LEGAL: MOCK_LEGAL_USER,
  INTERNAL_ADMIN: MOCK_ADMIN_USER,
  INTERNAL_ASSISTANT: MOCK_ASSISTANT_USER,
};

const ROLES = Object.keys(USERS) as Role[];

/** Everyone who reads the block from inside Moritz, i.e. not the client. */
const INTERNAL_ROLES = ROLES.filter((role) => role !== 'NON_LEGAL');

const contextFor = (role: Role, user: AuthUser = USERS[role]) =>
  buildAskContext(buildAskScope(role, user), NOW);

describe('zero out-of-scope case numbers, per role', () => {
  /*
   * The headline assertion. Every case number the mocks hold is checked against
   * every role's context: in scope, it must be there; out of scope, it must be
   * absent. Both directions, because a serialiser that emits nothing at all
   * would pass a leak test and fail the product.
   */
  it.each(ROLES)('%s', (role) => {
    const scope = buildAskScope(role, USERS[role]);
    const context = contextFor(role);
    const allowed = new Set(
      [...scope.cases, ...scope.claimable].map((c) => c.caseNumber),
    );

    const leaked: string[] = [];
    const missing: string[] = [];
    for (const legalCase of MOCK_CASES) {
      const present = context.includes(legalCase.caseNumber);
      if (present && !allowed.has(legalCase.caseNumber)) {
        leaked.push(legalCase.caseNumber);
      }
      if (!present && allowed.has(legalCase.caseNumber)) {
        missing.push(legalCase.caseNumber);
      }
    }

    expect(leaked).toEqual([]);
    expect(missing).toEqual([]);
  });

  /*
   * The specific leak, named. These are the five cases
   * `getCasesForRole('NON_LEGAL')` would have handed to Alex. If this test ever
   * fails, someone has replaced the boundary with the list helper.
   */
  it.each([
    'M-2026-0094',
    'M-2026-0118',
    'M-2026-0122',
    'M-2026-0124',
    'M-2026-0125',
  ])('the client context never names %s', (caseNumber) => {
    expect(contextFor('NON_LEGAL')).not.toContain(caseNumber);
  });

  it('the client context does name all four of their own cases', () => {
    const context = contextFor('NON_LEGAL');
    for (const caseNumber of [
      'M-2026-0114',
      'M-2026-0121',
      'M-2026-0123',
      'M-2026-0126',
    ]) {
      expect(context).toContain(caseNumber);
    }
  });
});

describe('what else must never appear', () => {
  /*
   * A case number is the sharpest probe but not the only one. These cover the
   * other three columns of §8.3's *Never*: other companies by name, the user
   * directory, and the audit log.
   */
  it('the client context names no other company', () => {
    const context = contextFor('NON_LEGAL');
    const others = MOCK_COMPANIES.filter(
      (company) => company.id !== MOCK_CLIENT_USER.company.id,
    );
    expect(others.length).toBeGreaterThan(0);
    for (const company of others) {
      expect(context).not.toContain(company.name);
    }
  });

  it('the client context lists no other user', () => {
    const context = contextFor('NON_LEGAL');
    const others = MOCK_USERS.filter(
      (person) => person.company.id !== MOCK_CLIENT_USER.company.id,
    );
    expect(others.length).toBeGreaterThan(0);
    for (const person of others) {
      expect(context).not.toContain(person.email);
    }
  });

  it.each(['LEGAL', 'INTERNAL_ASSISTANT'] as const)(
    '%s gets an empty audit log section',
    (role) => {
      expect(contextFor(role)).toContain('AUDIT LOG (0)');
    },
  );

  it('admin is the only role whose audit log has entries', () => {
    expect(contextFor('INTERNAL_ADMIN')).not.toContain('AUDIT LOG (0)');
  });

  /*
   * The client does not get an *empty* audit log section, it gets no audit log
   * section. The distinction is the whole point of the client block: an empty
   * heading still tells the model that audit trails are a thing this
   * conversation is about.
   */
  it('the client context has no audit log section at all, not an empty one', () => {
    const context = contextFor('NON_LEGAL');
    expect(context).not.toContain('AUDIT LOG');
  });

  /*
   * The lawyer case, using a lawyer who actually has assignments. The shipped
   * mock lawyer has none, so testing only that one would prove the boundary by
   * accident: an empty context leaks nothing whatever the code does.
   */
  it('a lawyer’s context names no other lawyer’s matter', () => {
    const catarina: AuthUser = { ...MOCK_LEGAL_USER, id: 'usr_legal_003' };
    const context = contextFor('LEGAL', catarina);

    for (const caseNumber of ['M-2026-0118', 'M-2026-0122', 'M-2026-0125']) {
      expect(context).toContain(caseNumber);
    }
    // Aélita's and Daniel's.
    for (const caseNumber of [
      'M-2026-0124',
      'M-2026-0114',
      'M-2026-0121',
      'M-2026-0123',
    ]) {
      expect(context).not.toContain(caseNumber);
    }
  });

  it('a lawyer’s context carries no company or directory data', () => {
    const catarina: AuthUser = { ...MOCK_LEGAL_USER, id: 'usr_legal_003' };
    const context = contextFor('LEGAL', catarina);
    expect(context).toContain('COMPANIES (0)');
    expect(context).toContain('PEOPLE (0)');
  });

  /* No document text, only metadata — the V40 stance and the cheaper request. */
  it('carries document names but never document contents', () => {
    const context = contextFor('NON_LEGAL');
    expect(context).toContain('DOCUMENTS');
    // The long-form client narrative is not in the block either.
    const fullDescription = MOCK_CASES[0]!.description;
    expect(context).not.toContain(fullDescription);
  });
});

describe('the block the model reads', () => {
  it('states the time it was generated, so deadlines can resolve', () => {
    expect(contextFor('INTERNAL_ADMIN')).toContain(
      `generated at: ${NOW.toISOString()}`,
    );
  });

  it('names who is asking', () => {
    const context = contextFor('NON_LEGAL');
    expect(context).toContain(`asking: ${MOCK_CLIENT_USER.name}`);
  });

  /*
   * `role: NON_LEGAL` is our own taxonomy and it describes the reader by what
   * they are not. The internal roles keep it because their block is a working
   * tool; the client's does not, because the client prompt already says who it
   * is talking to and the token does nothing but sit there waiting to be
   * quoted.
   */
  it('states the role for the internal reader and not for the client', () => {
    expect(contextFor('NON_LEGAL')).not.toContain('NON_LEGAL');
    expect(contextFor('INTERNAL_ADMIN')).toContain('role: INTERNAL_ADMIN');
    expect(contextFor('LEGAL')).toContain('role: LEGAL');
  });

  /*
   * Every section present even when empty, which is what makes the quiet state
   * possible: `CASES (0)` and `none` is a fact the model can report, where an
   * absent section is a gap it may try to fill.
   *
   * Asserted over the internal roles only. The client block keeps the same rule
   * over its own three sections, below.
   */
  it.each([
    'CASES',
    'CLAIMABLE',
    'QUOTE ROUNDS',
    'DOCUMENTS',
    'CASE TYPES',
    'COMPANIES',
    'PEOPLE',
    'AUDIT LOG',
  ])('every internal role always has a %s section, even at zero', (heading) => {
    for (const role of INTERNAL_ROLES) {
      expect(contextFor(role)).toContain(`${heading} (`);
    }
  });

  it('says "none" rather than leaving a section blank', () => {
    // The shipped lawyer has no cases at all, so this is the real empty case.
    const context = contextFor('LEGAL');
    expect(context).toContain('CASES (0)\nnone');
  });

  it('counts the cases it lists', () => {
    expect(contextFor('NON_LEGAL')).toContain('YOUR CASES (4)');
    expect(contextFor('INTERNAL_ADMIN')).toContain('CASES (9)');
  });

  it('is deterministic for a fixed clock', () => {
    expect(contextFor('INTERNAL_ADMIN')).toBe(contextFor('INTERNAL_ADMIN'));
  });
});

/**
 * The client's block is a different block, not the internal one with zeroes in
 * it. These are the assertions that stop the two being "tidied" back together:
 * the sections a client cannot have rows in are *absent*, and the fields that
 * are present are labelled from the reader's own seat.
 */
describe('the block a client reads', () => {
  const context = contextFor('NON_LEGAL');

  it('has exactly the three sections a client can have rows in', () => {
    expect(context).toContain('YOUR CASES (');
    expect(context).toContain('YOUR DOCUMENTS (');
    expect(context).toContain('SERVICES MORITZ OFFERS (');
  });

  it.each(['CLAIMABLE', 'QUOTE ROUNDS', 'COMPANIES', 'PEOPLE', 'AUDIT LOG'])(
    'has no %s section, not even an empty one',
    (heading) => {
      expect(context).not.toContain(heading);
    },
  );

  /* The quiet state still has to work, so the zero-with-`none` rule holds. */
  it('gives a client with no cases a zero it can report', () => {
    const stranger: AuthUser = {
      ...MOCK_CLIENT_USER,
      id: 'usr_nobody',
      company: { ...MOCK_CLIENT_USER.company, id: 'cmp_nobody' },
    };
    expect(contextFor('NON_LEGAL', stranger)).toContain('YOUR CASES (0)\nnone');
  });
});

/**
 * ⭐ The bug this rework was really about.
 *
 * `quoteRoundsOf(cases)` matched on case, so the projection looked correct and
 * every leak test passed: the round it handed Alex *was* on Alex's own case.
 * What it was is the lawyer's side of pricing. A client pressing "What am I
 * being charged for?" was grounded on a firm's bid and Moritz's internal
 * benchmark, and the most likely answer was a wrong number with "your" in front
 * of it.
 */
describe('the lawyer’s pricing view never reaches the client', () => {
  const context = contextFor('NON_LEGAL');
  const round = MOCK_QUOTE_ROUNDS.find((r) => r.caseNumber === 'M-2026-0123');

  /* Guards the three below from passing because the fixture moved. */
  it('is a round on a case the client really does own', () => {
    expect(round).toBeDefined();
    expect(contextFor('NON_LEGAL')).toContain('M-2026-0123');
  });

  it('never names the bid a firm submitted', () => {
    expect(round!.yourQuoteAmount).toBe(3_900);
    expect(context).not.toContain('3,900');
    expect(context).not.toContain('your quote');
  });

  it('never names Moritz’s internal benchmark', () => {
    expect(round!.benchmarkAmount).toBe(3_500);
    expect(context).not.toContain('3,500');
    expect(context.toLowerCase()).not.toContain('benchmark');
  });

  it('never names the conflict flag or the round’s expiry', () => {
    expect(context.toLowerCase()).not.toContain('conflict');
    expect(context).not.toContain('expires');
  });

  /* And the replacement: the figure that is on the client's own screen. */
  it('gives the client the price from their own case instead', () => {
    const own = MOCK_CASES.find((c) => c.caseNumber === 'M-2026-0123');
    expect(own!.quoteAmount).toBe(5_600);
    expect(context).toContain('your price: $5,600');
  });

  it('says "not quoted yet" rather than "none" where no price is set', () => {
    expect(context).toContain('your price: not quoted yet');
  });
});

describe('the client block is labelled from the client’s seat', () => {
  const context = contextFor('NON_LEGAL');

  /*
   * `notes/NOTE.md` §7 lists "the prompt that disagreed with the screen about
   * your own pipeline" among the defects that only showed up in the real app.
   * The badge says "In progress", so the block says "In progress".
   */
  it('uses the words on the status badge, not the enum', () => {
    expect(context).toContain('status: In progress');
    expect(context).toContain('status: Awaiting review');
    expect(context).not.toContain('IN_PROGRESS');
    expect(context).not.toContain('READY_FOR_SUBMISSION_REVIEW');
  });

  it('names the service rather than its primary key', () => {
    expect(context).toContain('type: Quick contract review');
    expect(context).not.toContain('ct_');
  });

  it('calls the lawyer theirs, and says plainly when there is not one yet', () => {
    expect(context).toContain('your lawyer: Aélita Jacob');
    expect(context).toContain('your lawyer: not assigned yet');
    // "unassigned" describes Moritz's queue rather than the client's matter.
    expect(context).not.toContain('unassigned');
  });

  it('does not read the reader’s own name back to them as the client', () => {
    expect(context).not.toContain(
      `opened by a colleague: ${MOCK_CLIENT_USER.name}`,
    );
  });

  it('carries no claim deadline, which is Moritz’s clock and not theirs', () => {
    expect(context.toLowerCase()).not.toContain('claim deadline');
  });

  /*
   * `anonDescription` is the anonymised blurb written for lawyers bidding on a
   * matter: it calls the reader "a non-legal company". Putting it in the
   * client's block makes Nora describe them to themselves in the third person.
   */
  it('carries none of the anonymised bidding blurbs', () => {
    const { cases } = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);
    const withBlurb = cases.filter((c) => c.anonDescription);
    expect(withBlurb.length).toBeGreaterThan(0);
    for (const legalCase of withBlurb) {
      expect(context).not.toContain(legalCase.anonDescription);
    }
  });

  /* The one forward-looking thing in a client's block. */
  it('says what each service needs from them', () => {
    expect(context).toContain('what we need from you:');
  });
});

describe('the client system prompt', () => {
  it('is the one a client is actually served, and only a client', () => {
    expect(askSystemPrompt('NON_LEGAL')).toBe(ASK_CLIENT_SYSTEM_PROMPT);
    for (const role of INTERNAL_ROLES) {
      expect(askSystemPrompt(role)).toBe(ASK_SYSTEM_PROMPT);
    }
  });

  /* Same reasoning as for the internal prompt: the boundary is the projection. */
  it('does not try to enforce scoping by instruction', () => {
    expect(ASK_CLIENT_SYSTEM_PROMPT.toLowerCase()).not.toContain(
      'only discuss the user',
    );
    expect(ASK_CLIENT_SYSTEM_PROMPT.toLowerCase()).not.toContain(
      'do not reveal',
    );
  });

  it('keeps the rules of answering that are right for anyone', () => {
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain(
      'Never give a case number that is not in the context block',
    );
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain(
      'Never say you have done something',
    );
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain('complete and useful reply');
  });

  /*
   * The asymmetry that was backwards: the general-legal tab already refused to
   * advise, and the grounded tab, which is the one holding the client's actual
   * contract, did not.
   */
  it('gives information rather than advice, and names who advises', () => {
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain('Give information, not advice');
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain('Their lawyer at Moritz');
  });

  it('keeps Moritz’s pricing and internal process out of the answer', () => {
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain('never mention benchmarks');
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain('Do not explain Moritz');
  });

  it('writes to the reader about their own case', () => {
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain(
      'You are speaking to the client themselves',
    );
    expect(ASK_CLIENT_SYSTEM_PROMPT).toContain(
      'Never describe them to themselves in the third person',
    );
  });
});

describe('the system prompt', () => {
  /*
   * The scoping rule must NOT be in the prompt. Not because saying it would
   * hurt, but because saying it invites the belief that it is doing the work —
   * and a rule a model follows unreliably is a coin it flips, which is the
   * lesson the intake flow already paid for. The boundary is the projection.
   */
  it('does not try to enforce scoping by instruction', () => {
    expect(ASK_SYSTEM_PROMPT.toLowerCase()).not.toContain(
      'only discuss the user',
    );
    expect(ASK_SYSTEM_PROMPT.toLowerCase()).not.toContain('do not reveal');
  });

  it('tells the model to name its basis and to refuse to invent a reference', () => {
    expect(ASK_SYSTEM_PROMPT).toContain(
      'Never give a case number that is not in the context block',
    );
  });

  /* Rule 1 of §8.6: nothing acts alone. */
  it('tells the model it cannot act', () => {
    expect(ASK_SYSTEM_PROMPT).toContain('Never say you have done something');
  });

  /* Rule 4 of §8.6: a quiet state, rather than filler. */
  it('tells the model that saying nothing is a complete answer', () => {
    expect(ASK_SYSTEM_PROMPT).toContain('complete and useful reply');
  });
});
