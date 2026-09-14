import { describe, expect, it } from 'vitest';
import { demoSessionDecision } from './demo-session';

/**
 * The three rows of the rule, and the one that is the bug this module exists
 * for: a second demo link arriving over the first one's saved session.
 */
describe('demoSessionDecision', () => {
  it('leaves a real intake alone and forgets the marker', () => {
    expect(demoSessionDecision(null, null)).toEqual({
      clearSession: false,
      marker: null,
    });
    // Somebody who used a demo and then started a real case: the session is
    // theirs now, so it survives, and the marker must not claim otherwise.
    expect(demoSessionDecision(null, 'quote')).toEqual({
      clearSession: false,
      marker: null,
    });
  });

  it('keeps the session when the same demo link is opened again', () => {
    // A refresh after correcting a value. Wiping here would lose the edit on
    // the screen built to prove edits stick.
    expect(demoSessionDecision('1', '1')).toEqual({
      clearSession: false,
      marker: '1',
    });
  });

  it('clears the session when a different demo link is opened', () => {
    // The reported failure: ?demo=1 then ?demo=quote in one tab.
    expect(demoSessionDecision('quote', '1')).toEqual({
      clearSession: true,
      marker: 'quote',
    });
    // And the first demo of the session, over whatever a previous visit left.
    expect(demoSessionDecision('sent', null)).toEqual({
      clearSession: true,
      marker: 'sent',
    });
  });

  it('treats every documented demo link as distinct from every other', () => {
    // `NOTE.md` hands over these five and asks the reader to try them, which
    // nobody does in five tabs. Every ordered pair has to re-seed.
    const links = ['1', 'review', 'sent', 'quote', 'noquote'];
    for (const from of links) {
      for (const to of links) {
        const decision = demoSessionDecision(to, from);
        expect(decision.marker).toBe(to);
        expect(decision.clearSession).toBe(from !== to);
      }
    }
  });
});
