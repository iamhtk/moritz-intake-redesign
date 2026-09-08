import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Info,
  MessagesSquare,
  Scale,
  Sparkles,
  User,
  Wand2,
} from '@repo/ui/icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Label } from '@repo/ui/components/label';
import { Button } from '@/components/design/design-system/button';
import { Textarea } from '@/components/design/design-system/textarea';
import { getCaseById } from '@/lib/mocks/cases';
import { getMessagesForCase } from '@/lib/mocks/messages';
import { MOCK_ADMIN_USER } from '@/lib/mocks/users';
import { CaseTitle } from './case-title';
import CaseStatusBadge from './case-status-badge';
import { AdminCaseOverviewSection } from './admin-case-overview-section';
import { AdminBillingPanel } from './admin-billing-panel';
import { CasePropertiesUpdateForm } from './case-properties-update-form';
import { ClaimableCompaniesForm } from './claimable-companies-form';
import { DocumentList } from './document-list';
import { SidebarChat } from './sidebar-chat';
import { AdminQuoteRoundPanel } from '@/components/quotes/admin-quote-round-panel';
import { TablistHelper, TablistHelperItem } from '@/components/tablist-helper';

export function AdminCaseDetailView({ caseId }: { caseId: string }) {
  const legalCase = getCaseById(caseId);
  if (!legalCase) return null;
  const messages = getMessagesForCase(legalCase.id);

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-shrink-0 flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/admin/cases">
            <ArrowLeft className="h-4 w-4" /> Back to cases
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <CaseTitle title={legalCase.title} />
          <CaseStatusBadge status={legalCase.status} />
          <span className="text-muted-foreground font-mono text-xs">
            {legalCase.caseNumber}
          </span>
        </div>
      </header>

      <TablistHelper className="w-full max-w-lg">
        <TablistHelperItem
          id="overview"
          label="Overview"
          icon={<Info className="h-4 w-4" />}
        >
          <AdminCaseOverviewSection legalCase={legalCase} />
        </TablistHelperItem>

        <TablistHelperItem
          id="client"
          label="For client"
          icon={<User className="h-4 w-4" />}
        >
          <Accordion type="multiple" defaultValue={['billing']}>
            <AccordionItem value="billing">
              <AccordionTrigger className="text-base font-semibold">
                Billing
              </AccordionTrigger>
              <AccordionContent>
                <AdminBillingPanel legalCase={legalCase} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="documents">
              <AccordionTrigger className="text-base font-semibold">
                Documents
              </AccordionTrigger>
              <AccordionContent>
                <DocumentList documents={legalCase.documents} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TablistHelperItem>

        <TablistHelperItem
          id="lawyer"
          label="For lawyer"
          icon={<Scale className="h-4 w-4" />}
        >
          <Accordion type="multiple" defaultValue={['properties']}>
            <AccordionItem value="properties">
              <AccordionTrigger className="text-base font-semibold">
                Update case properties
              </AccordionTrigger>
              <AccordionContent>
                <CasePropertiesUpdateForm legalCase={legalCase} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="publish">
              <AccordionTrigger className="text-base font-semibold">
                Publish proposal
              </AccordionTrigger>
              <AccordionContent>
                <ClaimableCompaniesForm legalCase={legalCase} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quote">
              <AccordionTrigger className="text-base font-semibold">
                Quote round
              </AccordionTrigger>
              <AccordionContent>
                <AdminQuoteRoundPanel legalCase={legalCase} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="draft">
              <AccordionTrigger className="text-base font-semibold">
                Populate first draft
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <Wand2 className="h-4 w-4" /> Generate first draft
                  </Button>
                  <Button variant="ghost" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Regenerate
                  </Button>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">
                    First message draft
                  </Label>
                  <Textarea
                    rows={6}
                    defaultValue={legalCase.draftResponseMarkdown ?? ''}
                    className="mt-1"
                  />
                </div>
                <DocumentList
                  documents={legalCase.draftDocuments}
                  emptyState="No draft documents generated yet."
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TablistHelperItem>

        <TablistHelperItem
          id="messages"
          label="Messages"
          icon={<MessagesSquare className="h-4 w-4" />}
          isFillHeight
        >
          <SidebarChat
            caseId={legalCase.id}
            caseTitle={legalCase.title}
            messages={messages}
            currentUserId={MOCK_ADMIN_USER.id}
          />
        </TablistHelperItem>
      </TablistHelper>
    </div>
  );
}
