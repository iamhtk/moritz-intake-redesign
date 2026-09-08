import { getCasesForRole } from '@/lib/mocks/cases';
import { MOCK_QUOTE_ROUNDS } from '@/lib/mocks/quotes';
import type { LegalCase, QuoteRound } from '@/lib/types';

export type LegalHomeSummary = {
  /** IN_PROGRESS cases, most recently updated first. */
  activeCases: LegalCase[];
  closedCount: number;
  /** Cases with unread messages, most unread first. */
  unreadCases: LegalCase[];
  totalUnread: number;
  /** Active cases with an AI first draft ready to review. */
  draftsReadyCount: number;
  /** Quote rounds still awaiting a response, soonest to expire first. */
  quoteRoundsToRespond: QuoteRound[];
  submittedQuotesCount: number;
};

/**
 * Derives the lawyer homepage summary from the existing LEGAL mocks. All values
 * are deterministic (no clock dependency), so this is safe to run server-side.
 */
export function getLegalHomeSummary(): LegalHomeSummary {
  const cases = getCasesForRole('LEGAL');

  const activeCases = cases
    .filter((c) => c.status === 'IN_PROGRESS')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const unreadCases = cases
    .filter((c) => c.unreadCount > 0)
    .sort((a, b) => b.unreadCount - a.unreadCount);

  const quoteRoundsToRespond = MOCK_QUOTE_ROUNDS.filter(
    (q) => q.yourQuoteStatus === 'NONE',
  ).sort((a, b) => (a.expiresAt < b.expiresAt ? -1 : 1));

  return {
    activeCases,
    closedCount: cases.filter((c) => c.status === 'CLOSED').length,
    unreadCases,
    totalUnread: cases.reduce((sum, c) => sum + c.unreadCount, 0),
    draftsReadyCount: activeCases.filter((c) => c.draftResponseMarkdown != null)
      .length,
    quoteRoundsToRespond,
    submittedQuotesCount: MOCK_QUOTE_ROUNDS.filter(
      (q) => q.yourQuoteStatus === 'SUBMITTED',
    ).length,
  };
}
