import { describe, expect, it } from 'vitest';
import { schoolOf, schoolsOf } from './credentials';
import type { OnboardingLawyer } from '@/components/design/new-case/lawyers';
import { ONBOARDING_LAWYERS } from '@/components/design/onboarding/onboarding-lawyers';

describe('reading the institution out of an education line', () => {
  it.each([
    ['Harvard Law School, J.D.', 'Harvard'],
    ['NYU School of Law, J.D.', 'NYU'],
    ['Duke Law School, LL.M.', 'Duke'],
    ['University of Oxford', 'Oxford'],
    ['Paris-Panthéon-Assas University, LL.M.', 'Paris-Panthéon-Assas'],
    ['Católica Global School of Law, LL.M.', 'Católica'],
    ['KU Leuven, LL.M.', 'KU Leuven'],
  ])('%s is %s', (education, expected) => {
    expect(schoolOf(education)).toBe(expected);
  });

  /*
   * The case the suffix ordering exists for. "School of" appears in the middle
   * of this name, not as a kind-of-institution suffix, and a rule that strips
   * it leaves "London" — which is a different institution, printed in a row
   * whose only value is being checkable.
   */
  it('does not shorten a name whose middle contains "School of"', () => {
    expect(schoolOf('London School of Economics, LL.M.')).toBe(
      'London School of Economics',
    );
  });

  it.each([
    ['empty', ''],
    ['whitespace', '   '],
    ['a bare comma', ','],
  ])('gives nothing back for %s', (_name, education) => {
    expect(schoolOf(education)).toBe('');
  });
});

function lawyer(education: string, id: string): OnboardingLawyer {
  return {
    id,
    name: 'A Lawyer',
    title: 'Counsel',
    initials: 'AL',
    imageUrl: '',
    tagline: '',
    education,
  };
}

describe('the schools behind a bench', () => {
  it('names up to three and counts the rest', () => {
    const { named, more } = schoolsOf([
      lawyer('Harvard Law School, J.D.', 'a'),
      lawyer('University of Oxford', 'b'),
      lawyer('NYU School of Law, J.D.', 'c'),
      lawyer('Duke Law School, J.D.', 'd'),
      lawyer('KU Leuven, LL.M.', 'e'),
    ]);
    expect(named).toEqual(['Harvard', 'Oxford', 'NYU']);
    expect(more).toBe(2);
  });

  /*
   * Two Harvard J.D.s on the bench is one fact about where the bench trained.
   * Printing it twice is padding, and padding is the failure mode this row is
   * most exposed to.
   */
  it('counts one school once', () => {
    const { named, more } = schoolsOf([
      lawyer('Harvard Law School, J.D.', 'a'),
      lawyer('Harvard Law School, J.D.', 'b'),
    ]);
    expect(named).toEqual(['Harvard']);
    expect(more).toBe(0);
  });

  it('drops a lawyer whose education it cannot read', () => {
    const { named, more } = schoolsOf([
      lawyer('', 'a'),
      lawyer('University of Oxford', 'b'),
    ]);
    expect(named).toEqual(['Oxford']);
    expect(more).toBe(0);
  });

  it('is empty for nobody', () => {
    expect(schoolsOf([])).toEqual({ named: [], more: 0 });
  });

  /*
   * Run against the real roster, not a fixture. The whole claim of this row is
   * that it is derived rather than written, so a school that stops resolving
   * when somebody's education line is edited has to fail here.
   */
  it('resolves a school for every lawyer actually on the roster', () => {
    const unreadable = ONBOARDING_LAWYERS.filter(
      (one) => schoolOf(one.education) === '',
    ).map((one) => one.id);
    expect(unreadable).toEqual([]);
  });
});
