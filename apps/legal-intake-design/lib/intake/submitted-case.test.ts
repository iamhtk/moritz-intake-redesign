import { describe, expect, it } from 'vitest';
import { getCaseById, getCasesForCompany } from '@/lib/mocks/cases';
import { SUBMITTED_CASE } from './submitted-case';

/**
 * The case "Go to case" lands on (Decision 8, T18).
 *
 * Worth testing for a mock, because every one of these was a way the button
 * could read as broken. The date assertions in particular are not theatre: the
 * first version of this mock built its timestamps by hand and produced
 * `T09:00.000Z` — no seconds — which parsed as Invalid Date and took the whole
 * case page down with "This page couldn't load".
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

  it('was created today, so it never reads as stale', () => {
    const created = new Date(legalCase?.createdAt ?? 0);
    expect(created.toISOString().slice(0, 10)).toBe(
      new Date().toISOString().slice(0, 10),
    );
  });

  /*
   * The point of the whole task: their five-step client timeline derives every
   * step from the one after it, so a case with no quote, no payment and no
   * lawyer sits at step one and does the "where am I" work for free.
   */
  it('sits at step one of the client timeline', () => {
    expect(legalCase?.status).toBe('READY_FOR_SUBMISSION_REVIEW');
    expect(legalCase?.quoteAmount).toBeNull();
    expect(legalCase?.assignedLawyer).toBeNull();
    expect(legalCase?.sentToFirmsAt).toBeNull();
    expect(legalCase?.lawyerAssignedAt).toBeNull();
  });

  it('belongs to the mock client, so it shows up in their case list', () => {
    const owned = getCasesForCompany(legalCase?.ownerCompanyId ?? '');
    expect(owned.map((one) => one.id)).toContain(SUBMITTED_CASE.id);
  });

  it('points at a client route, not an admin or legal one', () => {
    expect(SUBMITTED_CASE.href).toBe(`/client/cases/${SUBMITTED_CASE.id}`);
  });
});
