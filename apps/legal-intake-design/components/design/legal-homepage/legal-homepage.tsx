import { FirmTeam } from './firm-team';
import { LegalActiveCases } from './legal-active-cases';
import { LegalAttentionList } from './legal-attention-list';
import { LegalHomeStats } from './legal-home-stats';
import { LegalHomepageHero } from './legal-homepage-hero';
import { getLegalHomeSummary, type LegalHomeSummary } from './summary';

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** Builds the hero subline from deterministic counts (no clock dependency). */
function buildSubline(summary: LegalHomeSummary): string {
  const parts: string[] = [];
  if (summary.totalUnread > 0) {
    parts.push(
      `${summary.totalUnread} unread message${summary.totalUnread === 1 ? '' : 's'}`,
    );
  }
  if (summary.quoteRoundsToRespond.length > 0) {
    const n = summary.quoteRoundsToRespond.length;
    parts.push(`${n} quote round${n === 1 ? '' : 's'} awaiting your response`);
  }

  if (parts.length === 0) {
    return "You're all caught up — nothing needs your attention right now.";
  }
  return `You have ${joinWithAnd(parts)}.`;
}

/**
 * Lawyer homepage — a light work dashboard for the LEGAL role. Reuses the client
 * homepage's calm design vocabulary but is re-thought around what a lawyer
 * actually does: respond to quote rounds, reply to unread messages, review AI
 * drafts, and progress assigned cases.
 */
export function LegalHomepage({
  userName,
  firmName,
  firmCompanyId,
}: {
  userName: string;
  firmName: string;
  firmCompanyId: string;
}) {
  const summary = getLegalHomeSummary();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pb-10 pt-8 sm:gap-12 sm:pt-10">
      <LegalHomepageHero name={userName} subline={buildSubline(summary)} />
      <LegalHomeStats summary={summary} />
      <LegalAttentionList summary={summary} />
      <LegalActiveCases cases={summary.activeCases} />
      <FirmTeam companyId={firmCompanyId} firmName={firmName} />
    </div>
  );
}
