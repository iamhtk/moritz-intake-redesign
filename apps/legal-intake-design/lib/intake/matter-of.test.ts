import { describe, expect, it } from 'vitest';
import { MATTER_TYPE_KEY } from '@/components/design/new-case/intake-types';
import { MATTER_FLOWS } from '@/components/design/new-case/matters';
import { canonicalMatterType } from './matter-fields';
import { createBrief, confirmField, type Brief } from './brief';
import { fieldsForMatter } from './matter-fields';
import { matterOf, matterOfText } from './matter-of';

/**
 * The face beside the composer is chosen from this, so a wrong answer here puts
 * the wrong lawyer's name and speciality next to somebody's legal problem. That
 * is the failure worth testing, rather than the parsing for its own sake.
 */
function briefSaying(matterType: string | null): Brief {
  const base = createBrief('contract', fieldsForMatter('contract'));
  return matterType === null
    ? base
    : confirmField(base, MATTER_TYPE_KEY, matterType);
}

describe('matterOf', () => {
  it('is undefined before the client has said anything', () => {
    expect(matterOf(briefSaying(null))).toBeUndefined();
  });

  it('ignores the pinned matterId, which is always contract', () => {
    const brief = briefSaying('Employment');
    // The bug this exists to fix: the brief still claims to be a contract.
    expect(brief.matterId).toBe('contract');
    expect(matterOf(brief)).toBe('employment');
  });

  it('reads the label a chip sends', () => {
    expect(matterOf(briefSaying('Contract'))).toBe('contract');
    expect(matterOf(briefSaying('Employment'))).toBe('employment');
    expect(matterOf(briefSaying('Procurement'))).toBe('procurement');
    expect(matterOf(briefSaying('Corporate'))).toBe('corporate');
    expect(matterOf(briefSaying('M&A'))).toBe('ma');
    expect(matterOf(briefSaying('Something else'))).toBe('other');
  });

  it('reads the raw id, which is what the prompt catalog shows the model', () => {
    expect(matterOf(briefSaying('employment'))).toBe('employment');
    expect(matterOf(briefSaying('ma'))).toBe('ma');
  });

  it('reads a sentence the model wrote', () => {
    expect(matterOf(briefSaying('Employment dispute, offer withdrawn'))).toBe(
      'employment',
    );
    expect(matterOf(briefSaying('Review of a vendor agreement'))).toBe(
      'procurement',
    );
    expect(matterOf(briefSaying('Acquisition of a competitor'))).toBe('ma');
  });

  /*
   * Order matters, and these are the cases that prove it. Both contain
   * "agreement", and neither is a contract review.
   */
  it('prefers the specific type over the generic one', () => {
    expect(matterOf(briefSaying('Employment agreement dispute'))).toBe(
      'employment',
    );
    expect(matterOf(briefSaying('Share purchase agreement'))).toBe('ma');
  });

  /*
   * `ma` is two letters and a substring of ordinary English. A contains-the-id
   * rule sent "management", "formal" and "email" to the M&A lawyer.
   */
  it('does not match a matter id buried inside an unrelated word', () => {
    expect(matterOf(briefSaying('Management restructure advice'))).not.toBe(
      'ma',
    );
    expect(matterOf(briefSaying('Formal complaint about emails'))).not.toBe(
      'ma',
    );
  });

  it('is undefined for something it genuinely cannot place', () => {
    expect(matterOf(briefSaying('I need some help please'))).toBeUndefined();
    expect(matterOf(briefSaying('   '))).toBeUndefined();
  });
});

/**
 * The casing fix, which is a rendering bug with a data cause.
 *
 * The model returns `contract` as readily as `Contract`, both resolve to the
 * same matter, and only one of them looks like something a law firm wrote. The
 * rule has to be narrow: a sentence the model wrote about the client's own
 * circumstances is worth more than a tidy one-word label, so it is left alone.
 */
describe('canonicalMatterType', () => {
  it('capitalises a bare matter type however it arrived', () => {
    expect(canonicalMatterType('contract')).toBe('Contract');
    expect(canonicalMatterType('Contract')).toBe('Contract');
    expect(canonicalMatterType('  employment ')).toBe('Employment');
  });

  it('turns an id into the label a client would have tapped', () => {
    // The model is told the catalog as `employment: Employment` and returns
    // either side of that colon.
    expect(canonicalMatterType('ma')).toBe(MATTER_FLOWS.ma.label);
  });

  it('leaves a described matter exactly as it was written', () => {
    // The part a lawyer reads twice. Tidying this into one word would throw
    // away the only sentence on the row.
    const described = 'Employment dispute, offer withdrawn after acceptance';
    expect(canonicalMatterType(described)).toBe(described);
  });

  it('leaves something it does not recognise alone', () => {
    expect(canonicalMatterType('a licensing question')).toBe(
      'a licensing question',
    );
    expect(canonicalMatterType('')).toBe('');
  });
});

/**
 * Keywords must not match inside a longer word.
 *
 * The bug this locks down was live: `nda` sits inside "redu(nda)nt", so a
 * client opening with "I was made redundant last week" was routed to a
 * contract matter. That is not a cosmetic miss. It picks the commercial
 * lawyer, and it picks the contract checklist, which asks for the other side
 * and the outcome and has no row for who was involved, so the employment
 * answer has nowhere to land.
 */
describe('keyword matching', () => {
  it('does not read a keyword out of the middle of a word', () => {
    expect(matterOfText('I was made redundant last week')).toBe('employment');
  });

  it('catches both inflections a client might write', () => {
    expect(matterOfText('my redundancy consultation')).toBe('employment');
    expect(matterOfText('they made my role redundant')).toBe('employment');
  });

  it('still matches a keyword that is genuinely there', () => {
    expect(matterOfText('please review this NDA')).toBe('contract');
    expect(matterOfText('an MSA renewal')).toBe('contract');
  });

  it('still matches a stem that runs past the end of a word', () => {
    // 'offer withdraw' has to catch "withdrawn", so the back of a keyword is
    // deliberately not anchored.
    expect(matterOfText('the offer withdrawn after I accepted')).toBe(
      'employment',
    );
  });

  it('says nothing rather than guessing', () => {
    expect(matterOfText('I need some legal help')).toBeUndefined();
    expect(matterOfText('')).toBeUndefined();
  });

  it('does not route "management" or "email" to the M&A lawyer', () => {
    // The trap the ids were already guarded against, asserted so the guard
    // cannot be lost in a refactor.
    expect(matterOfText('a management question')).toBeUndefined();
    expect(matterOfText('about an email I sent')).toBeUndefined();
  });
});
