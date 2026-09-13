import { describe, expect, it } from 'vitest';
import { MOCK_ADMIN_USER, MOCK_CLIENT_USER } from '@/lib/mocks/users';
import { countCitedCases, extractAskActions } from './actions';
import { buildAskScope } from './scope';

/**
 * The hallucination guard (task N7).
 *
 * §8.8 names the case to test and it is the **negative** one: a fabricated
 * `M-2026-9999` must yield no action. Everything else here exists to make sure
 * that negative is not passing for the wrong reason — a function that returned
 * `[]` unconditionally would satisfy it perfectly.
 */

const clientScope = buildAskScope('NON_LEGAL', MOCK_CLIENT_USER);
const adminScope = buildAskScope('INTERNAL_ADMIN', MOCK_ADMIN_USER);

describe('the reference lookup', () => {
  /* ⭐ §8.8's named case. */
  it('gives a fabricated case number no action at all', () => {
    const answer = 'I looked at M-2026-9999 and it is progressing well.';
    expect(extractAskActions(answer, clientScope)).toEqual([]);
  });

  /*
   * The more dangerous negative, and the one an unscoped lookup would fail: a
   * reference that is entirely real, resolves against the mocks, and belongs to
   * somebody else. It must be just as inert.
   */
  it('gives a real but out-of-scope case number no action', () => {
    const answer = 'See M-2026-0118 for the Oakworks position.';
    expect(extractAskActions(answer, clientScope)).toEqual([]);
  });

  /* And the positive, so the two negatives above mean something. */
  it('gives an in-scope case number an action pointing at that case', () => {
    const actions = extractAskActions(
      'The MSA review is M-2026-0126 and it is with us now.',
      clientScope,
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]!.label).toBe('M-2026-0126');
    expect(actions[0]!.href).toBe('/client/cases/case_009');
  });

  it('keeps the good reference and drops the bad one from the same answer', () => {
    const actions = extractAskActions(
      'Your open matters are M-2026-0126 and M-2026-9999.',
      clientScope,
    );
    expect(actions.map((a) => a.label)).toEqual(['M-2026-0126']);
  });

  it('matches a reference the model wrote in lower case', () => {
    const actions = extractAskActions('see m-2026-0126', clientScope);
    expect(actions.map((a) => a.label)).toEqual(['M-2026-0126']);
  });

  it('does not match a number that merely looks similar', () => {
    for (const answer of ['M-2026-012', 'M-26-0126', 'X-2026-0126']) {
      expect(extractAskActions(answer, clientScope)).toEqual([]);
    }
  });
});

describe('the action list', () => {
  it('mentions each case once, however often the answer repeats it', () => {
    const actions = extractAskActions(
      'M-2026-0126 is open. M-2026-0126 has no lawyer yet. M-2026-0126 is new.',
      clientScope,
    );
    expect(actions).toHaveLength(1);
  });

  it('keeps the order the answer mentions them in', () => {
    const actions = extractAskActions(
      'First M-2026-0121, then M-2026-0114.',
      clientScope,
    );
    expect(actions.map((a) => a.label)).toEqual(['M-2026-0121', 'M-2026-0114']);
  });

  it('caps at three, even when the answer names four', () => {
    const actions = extractAskActions(
      'M-2026-0126, M-2026-0114, M-2026-0121, M-2026-0123.',
      clientScope,
    );
    expect(actions).toHaveLength(3);
  });

  it('offers nothing for an answer that cites nothing', () => {
    expect(
      extractAskActions('There is nothing waiting on you today.', clientScope),
    ).toEqual([]);
    expect(extractAskActions('', clientScope)).toEqual([]);
  });

  /*
   * "No second path", as a property of the type rather than a convention: an
   * action is a destination. There is no shape in which one of these mutates
   * anything.
   */
  it('only ever produces links into this role’s own area', () => {
    const actions = extractAskActions(
      'M-2026-0126 and M-2026-0114.',
      clientScope,
    );
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(action.href.startsWith('/client/')).toBe(true);
    }
  });
});

describe('people', () => {
  it('offers a person an internal role can actually look up', () => {
    const actions = extractAskActions(
      'Marcus Lee has been working on it.',
      adminScope,
    );
    expect(actions.map((a) => a.label)).toContain('Marcus Lee');
  });

  /*
   * A client has no directory in their scope, so a name in an answer must not
   * become a link — the same boundary, reached by a different route.
   */
  it('offers a client no person link, because they have no directory', () => {
    const actions = extractAskActions(
      'Marcus Lee has been working on it.',
      clientScope,
    );
    expect(actions).toEqual([]);
  });

  it('puts cases before people', () => {
    const actions = extractAskActions(
      'Jordan Pierce is handling M-2026-0126.',
      adminScope,
    );
    expect(actions[0]!.label).toBe('M-2026-0126');
  });
});

describe('countCitedCases', () => {
  /* §8.6 rule 3: state the basis. The number has to be checkable. */
  it('counts distinct in-scope cases', () => {
    expect(countCitedCases('M-2026-0126 and M-2026-0114.', clientScope)).toBe(
      2,
    );
  });

  it('counts a repeated reference once', () => {
    expect(
      countCitedCases('M-2026-0126, M-2026-0126, M-2026-0126', clientScope),
    ).toBe(1);
  });

  it('counts an invented or out-of-scope reference as zero', () => {
    expect(countCitedCases('M-2026-9999', clientScope)).toBe(0);
    expect(countCitedCases('M-2026-0118', clientScope)).toBe(0);
  });

  it('counts nothing for an answer with no references', () => {
    expect(countCitedCases('Nothing is waiting on you.', clientScope)).toBe(0);
  });
});
