import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Badge } from '@repo/ui/components/badge';
import { Label } from '@repo/ui/components/label';
import { FormattedDate } from '@/components/formatted-date';
import { DocumentList } from '@/components/cases/document-list';
import { RichTextViewer } from '@/components/rich-text/rich-text-viewer';
import { ProposalActions } from '@/components/cases/legal/proposal-actions';
import { H3 } from '@/components/design/design-system/typography';
import { getQuoteRoundById } from '@/lib/mocks/quotes';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = { title: 'Quote' };

interface PageProps {
  params: Promise<{ legalCaseId: string }>;
}

export default async function QuoteRoundDetailPage({ params }: PageProps) {
  const { legalCaseId } = await params;
  const round = getQuoteRoundById(legalCaseId);
  if (!round) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/legal/quotes">
          <ArrowLeft className="h-4 w-4" /> Back to quotes
        </Link>
      </Button>

      <header className="flex flex-wrap items-center gap-3">
        <H3 asChild>
          <h1>{round.caseTitle}</h1>
        </H3>
        <Badge variant="secondary" className="font-mono text-xs">
          {round.caseNumber}
        </Badge>
        {round.conflictReported && (
          <Badge variant="destructive">Conflict</Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextViewer value={round.description} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={round.documents}
                emptyState="No documents attached to this round."
              />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Auction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-muted-foreground text-xs">Benchmark</Label>
              <div className="text-xl font-semibold">
                {round.benchmarkAmount
                  ? formatCurrency(round.benchmarkAmount, round.currency)
                  : 'None'}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Your quote
              </Label>
              <div>
                {round.yourQuoteAmount
                  ? formatCurrency(round.yourQuoteAmount, round.currency)
                  : 'Not yet submitted'}
              </div>
              <div className="text-muted-foreground text-xs">
                Status: {round.yourQuoteStatus}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Expires</Label>
              <div>
                <FormattedDate
                  date={round.expiresAt}
                  options={{ dateStyle: 'medium', timeStyle: 'short' }}
                />
              </div>
            </div>
            <ProposalActions caseId={round.caseId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
