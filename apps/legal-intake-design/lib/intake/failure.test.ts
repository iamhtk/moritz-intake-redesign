import { describe, expect, it } from 'vitest';
import {
  failureKindOf,
  failureKindOfStatus,
  isFailureKind,
  isRetryable,
} from './failure';

/**
 * The classifier, tested for the two things that go wrong silently.
 *
 * One: a kind off the wire that we have no copy for must not be passed through,
 * because `next-intl` prints a missing key verbatim and the client would read
 * `intake.error.quotaExceeded` at the moment something already failed.
 *
 * Two: a retry offered where retrying cannot work. `unauthorized` is the whole
 * reason `isRetryable` exists as a function rather than as a boolean on the
 * error line: the deployment is missing a key, and a Try again button under
 * that sentence is a control that will fail identically every time it is
 * pressed.
 */
describe('isFailureKind', () => {
  it('accepts every kind that has copy', () => {
    for (const kind of [
      'offline',
      'unauthorized',
      'busy',
      'refused',
      'truncated',
      'unreadable',
      'unknown',
    ]) {
      expect(isFailureKind(kind)).toBe(true);
    }
  });

  it.each([
    ['a kind we removed', 'rateLimited'],
    ['a kind we never had', 'quotaExceeded'],
    ['the empty string', ''],
    ['a number', 503],
    ['null', null],
    ['an object', { kind: 'busy' }],
  ])('rejects %s', (_name, value) => {
    expect(isFailureKind(value)).toBe(false);
  });
});

describe('failureKindOf', () => {
  it('reads the kind a route sent', () => {
    expect(failureKindOf({ kind: 'refused', error: 'extract failed' })).toBe(
      'refused',
    );
  });

  it.each([
    ['a body with no kind', { error: 'Invalid JSON body' }],
    ['a body with an unknown kind', { kind: 'teapot' }],
    ['an empty body', {}],
    ['a string body', 'Internal Server Error'],
    ['no body', null],
  ])('falls back to unknown for %s', (_name, body) => {
    expect(failureKindOf(body)).toBe('unknown');
  });
});

describe('failureKindOfStatus', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [429, 'busy'],
    [500, 'busy'],
    [502, 'busy'],
    [503, 'busy'],
    [529, 'busy'],
  ])('%i is %s', (status, kind) => {
    expect(failureKindOfStatus(status)).toBe(kind);
  });

  it('does not call a missing route transient', () => {
    // A 404 on /api/intake is a build or a routing problem. Calling it `busy`
    // would tell the client to wait for something that is never coming.
    expect(failureKindOfStatus(404)).toBe('unknown');
  });

  it('treats our own 400 as unknown rather than as the client being at fault', () => {
    // The route answers a malformed body with a 400, which only happens when
    // this app sends one. It is our bug, and "something went wrong" is the
    // honest sentence for it.
    expect(failureKindOfStatus(400)).toBe('unknown');
  });
});

describe('isRetryable', () => {
  it('offers a retry where the same request could succeed', () => {
    expect(isRetryable('offline')).toBe(true);
    expect(isRetryable('busy')).toBe(true);
    // A schema miss is a re-roll: the same request usually parses next time.
    expect(isRetryable('unreadable')).toBe(true);
    expect(isRetryable('unknown')).toBe(true);
  });

  it('does not offer a retry that cannot work', () => {
    // Nothing the client presses sets an environment variable.
    expect(isRetryable('unauthorized')).toBe(false);
    // The same message declined once will be declined again.
    expect(isRetryable('refused')).toBe(false);
    // The same request against the same max_tokens runs past it again.
    expect(isRetryable('truncated')).toBe(false);
  });
});
