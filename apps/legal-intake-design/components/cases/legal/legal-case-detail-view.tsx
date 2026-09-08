import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { Card, CardContent } from '@/components/design/design-system/card';
import { Label } from '@repo/ui/components/label';
import { CaseTitle } from '@/components/cases/case-title';
import CaseStatusBadge from '@/components/cases/case-status-badge';
import { SidebarChat } from '@/components/cases/sidebar-chat';
import { DocumentList } from '@/components/cases/document-list';
import { ParticipantList } from '@/components/cases/participant-list';
import { RichTextViewer } from '@/components/rich-text/rich-text-viewer';
import { FormattedDate } from '@/components/formatted-date';
import { Muted } from '@/components/design/design-system/typography';
import type { LegalCase, Message } from '@/lib/types';

type Props = {
  legalCase: LegalCase;
  messages: Message[];
  currentUserId: string;
};

export function LegalCaseDetailView({
  legalCase,
  messages,
  currentUserId,
}: Props) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CaseTitle title={legalCase.title} />
          <CaseStatusBadge status={legalCase.status} />
          <span className="text-muted-foreground font-mono text-xs">
            {legalCase.caseNumber}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Client">
                  {legalCase.client.name}{' '}
                  <span className="text-muted-foreground">
                    ({legalCase.ownerCompanyName})
                  </span>
                </Detail>
                <Detail label="Created">
                  <FormattedDate date={legalCase.createdAt} />
                </Detail>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="caseInfo">
            <TabsList>
              <TabsTrigger value="caseInfo">Case info</TabsTrigger>
              <TabsTrigger value="firstDraft">First draft</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
            </TabsList>

            <TabsContent value="caseInfo" className="mt-4">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <Label className="text-muted-foreground text-xs">Brief</Label>
                  <RichTextViewer value={legalCase.description} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="firstDraft" className="mt-4">
              <Card>
                <CardContent className="space-y-3 p-4">
                  {legalCase.draftResponseMarkdown ? (
                    <RichTextViewer value={legalCase.draftResponseMarkdown} />
                  ) : (
                    <Muted>
                      Moritz has not generated a first-draft response for this
                      case yet.
                    </Muted>
                  )}
                  <DocumentList
                    documents={legalCase.draftDocuments}
                    emptyState="No draft documents yet."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <DocumentList documents={legalCase.documents} />
            </TabsContent>

            <TabsContent value="participants" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <ParticipantList participants={legalCase.participants} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-2">
          <SidebarChat
            caseId={legalCase.id}
            caseTitle={legalCase.title}
            messages={messages}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="text-sm">{children}</div>
    </div>
  );
}
