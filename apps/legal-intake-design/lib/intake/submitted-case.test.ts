import { describe, expect, it } from 'vitest';
import { getCaseById, getCasesForCompany } from '@/lib/mocks/cases';
import { applySubmission } from '@/lib/mocks/submitted-cases';
import { SUBMITTED_CASE } from './submitted-case';

/**
 * The case "Go to case" lands on (Decision 8, T18, §3's Decision 1).
 *
 * Worth testing for a mock, because every one of these was a way the button
 * could read as broken. The date assertions in particular are not theatre: the
 * first version of this mock built its timestamps by hand and produced
 * `T09:00.000Z` — no seconds — which parsed as Invalid Date and took the whole
 * case page down with "This page couldn't load".
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO CASES USED TO BE ASSERTED HERE AND ARE DELIBERATELY GONE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * "was created today, so it never reads as stale" and "sits at step one of the
 * client timeline" were the argument for pointing this at `case_009`, a
 * fixture written for the job. The target is `case_006` now, because that is
 * what Moritz's own confirmation card links to and matching their handoff
 * exactly was judged worth more than the two properties — see the note on
 * `SUBMITTED_CASE_ID`.
 *
 * They are replaced rather than deleted. What was given up is asserted below,
 * so the trade-off is a fact in the codebase that a later reader can weigh,
 * rather than two tests that quietly disappeared in a diff.
 */
describe('the submitted case', () => {
  const legalCase = getCaseById(SUBMITTED_CASE.id);

  it('exists, so the confirmation does not link into nothing', () => {
    expect(legalCase).toBeDefined();
  });

  it('shows the same reference the confirmation quotes', () => {
    expect(SUBMITTED_CASE.reference).toBe(legalCase?.caseNumber);
    expect(SUBMITTED_CASE.reference).not.toBe(SUBMITTED_CASE.id);
  });

  it('has parseable dates on every timestamp it carries', () => {
    for (const key of [
      'createdAt',
      'updatedAt',
      'receivedAt',
      'sentToFirmsAt',
      'lawyerAssignedAt',
      'claimDeadline',
    ] as const) {
      const value = legalCase?.[key];
      if (value === null || value === undefined) continue;
      expect(Number.isNaN(new Date(value).getTime()), `${key} = ${value}`).toBe(
        false,
      );
    }
  });

  /*
   * ⭐ The target is the one their own confirmation card uses, and that is
   * the whole reason for the choice. A reviewer comparing the old flow with
   * this one sees the same handoff, and lands on the page where the quote and
   * the payment actually happen in Moritz's product.
   */
  it('is the case their existing card already links to', () => {
    expect(SUBMITTED_CASE.id).toBe('case_006');
  });

  /*
   * ⭐ And what that costs, written down rather than discovered.
   *
   * `case_009` was built for this: created today, no quote, no lawyer, which
   * put their five-step client timeline at step one and let it do the "where
   * am I" work for free. `case_006` is none of those things, so a client who
   * presses "Go to case" seconds after being told nobody is assigned until
   * they accept a quote lands on a case with both.
   *
   * Asserted, not lamented. If any of these three ever changes — the fixture
   * is retired, or the overlay grows the power to reset a status — this fails
   * and somebody re-reads the decision instead of inheriting it.
   */
  it('is mid-flight, which is the accepted cost of that choice', () => {
    expect(legalCase?.status).toBe('IN_PROGRESS');
    expect(legalCase?.quoteAmount).not.toBeNull();
    expect(legalCase?.assignedLawyer).not.toBeNull();
    const created = new Date(legalCase?.createdAt ?? 0);
    expect(created.toISOString().slice(0, 10)).not.toBe(
      new Date().toISOString().slice(0, 10),
    );
  });

  /*
   * The half of it the overlay does cover. A client who sent an employment
   * matter must not open "Go to case" and find a commercial lease: the title,
   * the description and the dates are laid over the fixture with what they
   * actually sent. See `applySubmission`.
   */
  it('is retitled by the submission, so the page is about their matter', () => {
    const merged = applySubmission(legalCase!, {
      id: SUBMITTED_CASE.id,
      title: 'Employment offer review, IBM',
      description: 'A recap of the matter.',
      documentNames: [],
      submittedAt: new Date().toISOString(),
    });
    expect(merged.title).toBe('Employment offer review, IBM');
    expect(merged.createdAt.slice(0, 10)).toBe(
      new Date().toISOString().slice(0, 10),
    );
  });

  /*
   * The fixture that used to be the target is still in the list and nothing
   * points at it. Retiring it is a fixture cleanup rather than part of this
   * change, and this is the reminder.
   */
  it('has left case_009 orphaned, and it is still there', () => {
    expect(getCaseById('case_009')).toBeDefined();
    expect(SUBMITTED_CASE.id).not.toBe('case_009');
  });

  it('belongs to the mock client, so it shows up in their case list', () => {
    const owned = getCasesForCompany(legalCase?.ownerCompanyId ?? '');
    expect(owned.map((one) => one.id)).toContain(SUBMITTED_CASE.id);
  });

  it('points at a client route, not an admin or legal one', () => {
    expect(SUBMITTED_CASE.href).toBe(`/client/cases/${SUBMITTED_CASE.id}`);
  });
});
