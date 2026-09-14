import { describe, expect, it } from 'vitest';
import { commandFilter, type RankKind } from './command-filter';

/**
 * The ranking, as an ordering rather than as numbers.
 *
 * Asserting the exact weights would pin the tuning and fail on any adjustment
 * that left the behaviour intact, so almost every case here asserts a
 * *comparison* instead: this row must come above that one. Those are the claims
 * that matter, and they survive a re-tune.
 */

const score = (value: string, search: string, kind: RankKind = 'action') =>
  commandFilter(value, search, [kind]);

describe('match quality', () => {
  it('ranks exact above prefix above word-start above substring', () => {
    const exact = score('north', 'north');
    const prefix = score('northwind ltd', 'north');
    const wordStart = score('acme northwind', 'north');
    const substring = score('funorthodox', 'north');

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(0);
  });

  it('hides a row it does not match at all', () => {
    expect(score('Northwind Ltd', 'zzz')).toBe(0);
  });

  it('is case-insensitive on both sides', () => {
    expect(score('NORTHWIND', 'northwind')).toBe(
      score('northwind', 'NORTHWIND'),
    );
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(score('Northwind Ltd', '  north  ')).toBe(
      score('Northwind Ltd', 'north'),
    );
  });

  /*
   * The separators our own labels use. A case row reads
   * `M-2026-0126 · MSA review`, so `msa` has to count as a word start there
   * rather than as a buried substring, and `0126` has to find the number in a
   * hyphenated reference.
   */
  it.each(['·', ',', '/', '-', '_', ' '])(
    'treats %s as a word boundary',
    (separator) => {
      expect(score(`acme${separator}northwind`, 'north')).toBe(
        score('acme northwind', 'north'),
      );
    },
  );

  it('finds a segment of a hyphenated case number', () => {
    expect(score('M-2026-0126 · MSA review', '0126')).toBeGreaterThan(0);
  });

  it('returns 1 for every row when the query is empty', () => {
    expect(score('anything at all', '')).toBe(1);
    expect(score('anything at all', '   ')).toBe(1);
  });
});

describe('kind', () => {
  /*
   * The reason the weights exist. Section names are short, so on a two-letter
   * query every destination matches as a prefix and scores near the top; the
   * case the reader actually searched for matches less well and would lose.
   */
  it('puts an entity above a nav destination that matches better', () => {
    const nav = commandFilter('Cases', 'ca', ['nav']);
    const entity = commandFilter('Northwind capacity dispute', 'ca', [
      'entity',
    ]);
    expect(entity).toBeGreaterThan(nav);
  });

  it('ranks the four kinds entity > action > filter > nav on equal matches', () => {
    const ranked = (['entity', 'action', 'filter', 'nav'] as const).map(
      (kind) => commandFilter('northwind', 'north', [kind]),
    );
    expect(ranked).toEqual([...ranked].sort((a, b) => b - a));
    expect(new Set(ranked).size).toBe(4);
  });

  it('treats a row with no kind as an action', () => {
    expect(commandFilter('northwind', 'north')).toBe(
      commandFilter('northwind', 'north', ['action']),
    );
    expect(commandFilter('northwind', 'north', [])).toBe(
      commandFilter('northwind', 'north', ['action']),
    );
  });

  it('treats an unrecognised kind as an action rather than hiding the row', () => {
    expect(commandFilter('northwind', 'north', ['nonsense'])).toBe(
      commandFilter('northwind', 'north', ['action']),
    );
  });

  /* A non-match stays hidden however well its kind is trusted. */
  it('does not let kind rescue a row that does not match', () => {
    expect(commandFilter('Northwind Ltd', 'zzz', ['entity'])).toBe(0);
  });
});
