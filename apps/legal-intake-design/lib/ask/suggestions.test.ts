import { describe, expect, it } from 'vitest';
import {
  MOCK_ADMIN_USER,
  MOCK_ASSISTANT_USER,
  MOCK_CLIENT_USER,
  MOCK_LEGAL_USER,
} from '@/lib/mocks/users';
import type { AuthUser, Role } from '@/lib/types';
import { buildAskScope } from './scope';
import { buildAskSuggestions } from './suggestions';

/**
 * The chips (task N8).
 *
 * The claim being tested is that they come from the projection rather than from
 * a list — which shows up as a *negative*: a chip must never be offered where
 * pressing it would reach the quiet state.
 */

const USERS: Record<Role, AuthUser> = {
  NON_LEGAL: MOCK_CLIENT_USER,
  LEGAL: MOCK_LEGAL_USER,
  INTERNAL_ADMIN: MOCK_ADMIN_USER,
  INTERNAL_ASSISTANT: MOCK_ASSISTANT_USER,
};

const ROLES = Object.keys(USERS) as Role[];

const suggest = (role: Role, user: AuthUser = USERS[role]) =>
  buildAskSuggestions(buildAskScope(role, user));

describe('every role', () => {
  it.each(ROLES)('%s offers at most three', (role) => {
    expect(suggest(role).length).toBeLessThanOrEqual(3);
  });

  it.each(ROLES)('%s gives every chip a distinct id and text', (role) => {
    const chips = suggest(role);
    expect(new Set(chips.map((c) => c.id)).size).toBe(chips.length);
    expect(new Set(chips.map((c) => c.text)).size).toBe(chips.length);
  });

  it.each(ROLES)('%s phrases every chip as a question', (role) => {
    for (const chip of suggest(role)) {
      expect(chip.text.endsWith('?')).toBe(true);
    }
  });
});

describe('a reader with nothing', () => {
  /*
   * The headline negative. The shipped mock lawyer has no assigned cases, so
   * the honest number of chips is zero — a row of them, each leading to "there
   * is nothing on your side about that", is worse than none.
   */
  it('is offered no chips at all rather than dead ends', () => {
    const scope = buildAskScope('LEGAL', MOCK_LEGAL_USER);
    expect(scope.cases).toEqual([]);
    expect(suggest('LEGAL')).toEqual([]);
  });

  it('is offered chips again as soon as it has work', () => {
    const catarina: AuthUser = { ...MOCK_LEGAL_USER, id: 'usr_legal_003' };
    const chips = suggest('LEGAL', catarina);
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.map((c) => c.text)).toContain('What is waiting on me?');
  });
});

describe('the client', () => {
  it('is asked about its cases by number when it has several', () => {
    const chips = suggest('NON_LEGAL');
    expect(chips.length).toBeGreaterThan(0);
    // Alex has four, so the count is used rather than a single case number.
    expect(chips[0]!.text).toContain('4');
  });

  /*
   * "My case" is how somebody with one matter thinks about it. A chip reading
   * "all 1 of my cases" is a computer talking, so the single case is named.
   */
  it('names the case directly when there is exactly one', () => {
    const soloUser: AuthUser = {
      ...MOCK_CLIENT_USER,
      id: 'usr_client_002',
      company: { ...MOCK_CLIENT_USER.company, id: 'cmp_nothing' },
    };
    const scope = buildAskScope('NON_LEGAL', soloUser);
    const chips = buildAskSuggestions(scope);
    if (scope.cases.length === 1) {
      expect(chips[0]!.text).toContain(scope.cases[0]!.caseNumber);
    }
  });

  /*
   * Every chip a client is offered has to be a question a client would ask.
   * The internal chips are the counter-example on purpose: "What work could I
   * take on?" and "Which lawyers are carrying the most work?" are the shape
   * this tab used to have for everyone.
   */
  it('offers only questions a client would ask about their own matters', () => {
    const ids = suggest('NON_LEGAL').map((c) => c.id);
    for (const internalOnly of [
      'claimable',
      'unquoted',
      'unassigned',
      'busiest',
    ]) {
      expect(ids).not.toContain(internalOnly);
    }
  });

  /*
   * "Who is working on my case?" is last in the client branch, so it only
   * lands when one of the three ahead of it did not. It is offered at all only
   * because a case has a lawyer on it to name.
   */
  it('asks about the lawyer only when a case actually has one', () => {
    const scope = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);
    expect(scope.cases.some((c) => c.assignedLawyer !== null)).toBe(true);

    const noLawyer: AuthUser = {
      ...MOCK_CLIENT_USER,
      id: 'usr_nobody',
      company: { ...MOCK_CLIENT_USER.company, id: 'cmp_nobody' },
    };
    expect(
      buildAskSuggestions(buildAskScope('NON_LEGAL', noLawyer)).map(
        (c) => c.id,
      ),
    ).not.toContain('lawyer');
  });

  it('never offers a chip about unread messages when nothing is unread', () => {
    const quietUser: AuthUser = {
      ...MOCK_CLIENT_USER,
      id: 'usr_none',
      company: { ...MOCK_CLIENT_USER.company, id: 'cmp_none' },
    };
    expect(buildAskSuggestions(buildAskScope('NON_LEGAL', quietUser))).toEqual(
      [],
    );
  });
});

describe('the internal roles', () => {
  /* The chip carries the number, so it is already part of the answer. */
  it('counts the unquoted cases in the chip itself', () => {
    const chips = suggest('INTERNAL_ADMIN');
    const unquoted = chips.find((c) => c.id === 'unquoted');
    expect(unquoted?.text).toMatch(/\d+/);
  });

  it('offers the assistant the same chips as admin', () => {
    expect(suggest('INTERNAL_ASSISTANT').map((c) => c.id)).toEqual(
      suggest('INTERNAL_ADMIN').map((c) => c.id),
    );
  });
});
