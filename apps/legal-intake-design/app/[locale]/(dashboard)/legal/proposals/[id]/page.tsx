import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { PartyInfoCard } from '@/components/cases/party-info-card';
import { CaseTitle } from '@/components/cases/case-title';
import CaseStatusBadge from '@/components/cases/case-status-badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Label } from '@repo/ui/components/label';
import { ProposalActions } from '@/components/cases/legal/proposal-actions';
import { RichTextViewer } from '@/components/rich-text/rich-text-viewer';
import { FormattedDate } from '@/components/formatted-date';
import { getCaseById } from '@/lib/mocks/cases';
import { getInitials } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const legalCase = getCaseById(id);
  if (!legalCase || legalCase.status !== 'READY_FOR_CLAIM') notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/legal/proposals">
          <ArrowLeft className="h-4 w-4" /> Back to proposals
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <CaseTitle title={legalCase.title} />
        <CaseStatusBadge status={legalCase.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <PartyInfoCard
              title="Client"
              name={legalCase.client.companyName ?? legalCase.client.name}
              subName={legalCase.client.name}
              detail={`Country: ${legalCase.country}`}
              initials={getInitials(
                legalCase.client.companyName ?? legalCase.client.name,
              )}
              colorClass="bg-[var(--actor-client)]"
            />
            {legalCase.opposingParty && (
              <PartyInfoCard
                title="Opposing party"
                name={
                  legalCase.opposingParty.companyName ??
                  legalCase.opposingParty.name
                }
                subName={legalCase.opposingParty.name}
                initials={getInitials(legalCase.opposingParty.name)}
                colorClass="bg-[var(--actor-opposing)]"
              />
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextViewer
                value={legalCase.anonDescription ?? legalCase.description}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Cost & deadline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">Benchmark</Label>
              <div className="text-2xl font-semibold">
                {legalCase.quoteAmount
                  ? `${legalCase.currency} ${legalCase.quoteAmount.toLocaleString()}`
                  : 'No benchmark yet'}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Claim deadline
              </Label>
              <div>
                {legalCase.claimDeadline ? (
                  <FormattedDate
                    date={legalCase.claimDeadline}
                    options={{ dateStyle: 'medium', timeStyle: 'short' }}
                  />
                ) : (
                  'None'
                )}
              </div>
            </div>
            <ProposalActions caseId={legalCase.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
