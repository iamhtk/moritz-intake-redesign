import { describe, expect, it } from 'vitest';
import { capNames, joinNames } from './name-list';

describe('capping a list of names', () => {
  it('names up to the limit and counts the rest', () => {
    expect(capNames(['a', 'b', 'c', 'd', 'e'], 3)).toEqual({
      named: ['a', 'b', 'c'],
      more: 2,
    });
  });

  it('counts nothing when everything fits', () => {
    expect(capNames(['a', 'b'], 3)).toEqual({ named: ['a', 'b'], more: 0 });
    expect(capNames(['a', 'b', 'c'], 3)).toEqual({
      named: ['a', 'b', 'c'],
      more: 0,
    });
  });

  it('handles an empty list', () => {
    expect(capNames([], 3)).toEqual({ named: [], more: 0 });
  });

  /*
   * A legitimate request rather than an error: a caller that wants a pure
   * "n things" phrasing with no names in it at all.
   */
  it.each([0, -1])(
    'names nothing and counts everything at a limit of %s',
    (limit) => {
      expect(capNames(['a', 'b'], limit)).toEqual({ named: [], more: 2 });
    },
  );

  it('does not hand back the caller its own array', () => {
    const names = ['a', 'b'];
    const { named } = capNames(names, 3);
    named.push('c');
    expect(names).toEqual(['a', 'b']);
  });
});

describe('joining names into a sentence', () => {
  it.each([
    [[], ''],
    [['Harvard'], 'Harvard'],
    [['Harvard', 'Oxford'], 'Harvard and Oxford'],
    [['Harvard', 'Oxford', 'NYU'], 'Harvard, Oxford and NYU'],
    [['a', 'b', 'c', 'd'], 'a, b, c and d'],
  ])('%j reads as "%s"', (names, expected) => {
    expect(joinNames(names)).toBe(expected);
  });

  /*
   * No Oxford comma, asserted rather than left to chance. This is the detail
   * that made the joiner worth sharing: two copies of it is how one surface
   * ends up with the comma and the other without, on the same screen.
   */
  it('never puts a comma before the and', () => {
    expect(joinNames(['a', 'b', 'c'])).not.toContain(', and');
  });
});
