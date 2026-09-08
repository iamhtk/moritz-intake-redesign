'use client';

import { Check, ChevronDown, Download, FileDiff, Wand2 } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { FormattedDate } from '@/components/formatted-date';
import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { DocumentFileIcon } from '@/components/design/documents/document-version-row';
import {
  CasePanelToggle,
  caseTopBar,
} from '@/components/cases/case-header-primitives';
import type { LegalCase } from '@/lib/types';

import { ApproveHandoffDialog } from './first-draft/approve-handoff-dialog';
import { DraftDocumentPreview } from './first-draft/draft-document-preview';
import { downloadVersion } from './first-draft/draft-version-attachment';
import type { FirstDraftWorkspaceState } from './first-draft/use-first-draft-workspace';
import { findVersion, type DraftDocument } from './first-draft/workspace-data';

/**
 * The first draft as a view of the case rather than a screen of its own: the
 * documents take the wide column the conversation usually has, so the clause a
 * lawyer is arguing about in the thread is a toggle away from the clause ops is
 * revising. Reading only — a document changes by asking the agent, which cuts a
 * new version and leaves the stored file alone.
 */
export function AdminCaseFirstDraft({
  legalCase,
  workspace,
  isPanelOpen,
  onTogglePanel,
}: {
  legalCase: LegalCase;
  workspace: FirstDraftWorkspaceState;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}) {
  const panelToggle = (
    <CasePanelToggle isPanelOpen={isPanelOpen} onTogglePanel={onTogglePanel} />
  );

  if (!workspace.hasWorkspace) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={cn(caseTopBar, 'justify-end')}>{panelToggle}</div>
        <div className="flex min-h-0 flex-1 items-center justify-center pb-6">
          <Empty className="border-field max-w-md rounded-2xl border py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileDiff />
              </EmptyMedia>
              <EmptyTitle>No first draft yet</EmptyTitle>
              <EmptyDescription>
                Generate a starting point from the case brief, the customer
                playbook and the documents on this case, then work on it with
                the agent before it reaches the lawyer.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={workspace.generateFirstDraft}
                disabled={workspace.generating}
              >
                {workspace.generating ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Wand2 data-icon="inline-start" />
                )}
                {workspace.generating ? 'Generating…' : 'Generate first draft'}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  const document = workspace.activeDocument!;
  const version = findVersion(document, workspace.viewingVersionId);
  const isLatest = version.version === document.versions.length;
  const download = () => downloadVersion(document, version);

  return (
    <div className="@container -mb-10 flex min-h-0 flex-1 flex-col">
      {/*
       * Everything about the document on screen, then everything that can be
       * done with it — in the bar the case header runs on the conversation, so
       * the top of the case does not jump when the view changes. The name gives
       * way first, because the actions must never be pushed out of reach.
       */}
      <div className={caseTopBar}>
        <div className="flex min-w-0 shrink items-center gap-1.5">
          <DocumentFileIcon name={document.name} className="size-4 shrink-0" />
          <span className="text-foreground min-w-0 truncate text-sm font-medium">
            {document.name}
          </span>

          <VersionMenu
            document={document}
            version={version}
            onSelect={(versionId) =>
              workspace.openVersion(document.id, versionId, false)
            }
          />

          {/* A first version has nothing behind it to compare against, so the
              control only appears once there is a change to read. */}
          {version.changes.length > 0 ? (
            <Button
              variant={workspace.compare ? 'secondary' : 'ghost'}
              size="sm"
              className="shrink-0"
              onClick={() => workspace.setCompare(!workspace.compare)}
            >
              <FileDiff data-icon="inline-start" />
              <span className="@2xl:inline hidden">
                {workspace.compare ? 'Hide changes' : 'Show changes'}
              </span>
              {/* Dimmed rather than recoloured: the button inverts when the
                  redline is on, and a fixed muted tone disappears into it. */}
              <span className="tabular-nums opacity-60">
                {version.changes.length}
              </span>
            </Button>
          ) : null}

          {!isLatest ? (
            <Badge variant="warning" className="@xl:inline-flex hidden">
              Earlier version
            </Badge>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={download}
            aria-label="Download"
          >
            <Download data-icon="inline-start" />
            <span className="@2xl:inline hidden">Download</span>
          </Button>

          {workspace.handoff ? (
            <Badge variant="success">
              <Check data-icon="inline-start" />
              Sent to {workspace.handoff.lawyerName}
            </Badge>
          ) : (
            <ApproveHandoffDialog
              document={document}
              version={version}
              lawyer={legalCase.assignedLawyer}
              onApprove={workspace.approve}
            />
          )}

          {panelToggle}
        </div>
      </div>

      {workspace.handoff ? (
        <div className="border-success/30 bg-success/10 text-foreground mb-2 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-xs">
          <Badge variant="success">
            <Check data-icon="inline-start" />
            Handed off
          </Badge>
          <span>
            {workspace.handoff.items.length} document
            {workspace.handoff.items.length === 1 ? '' : 's'} sent to{' '}
            {workspace.handoff.lawyerName} by {workspace.handoff.approvedBy} on{' '}
            <FormattedDate
              date={workspace.handoff.approvedAt}
              options={{
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              }}
            />
            . Portal notification sent.
          </span>
          <span className="text-muted-foreground">
            {workspace.handoff.items
              .map((item) => `${item.documentName} (${item.versionLabel})`)
              .join(', ')}
          </span>
        </div>
      ) : null}

      <div className="border-field mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border">
        <DraftDocumentPreview
          document={document}
          versionId={version.id}
          compare={workspace.compare}
          onDownload={download}
          onRevert={workspace.revertChange}
        />
      </div>
    </div>
  );
}

/** Which version is on screen, and the way back to the ones before it. */
function VersionMenu({
  document,
  version,
  onSelect,
}: {
  document: DraftDocument;
  version: ReturnType<typeof findVersion>;
  onSelect: (versionId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="shrink-0">
          v{version.version} of {document.versions.length}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Version history</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={version.id} onValueChange={onSelect}>
          {[...document.versions].reverse().map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              {/* One line, so the checked dot has a single row to sit against.
                  The highlight fills with `primary`, so the item's own colours
                  have to step aside for it — what a version changed is the
                  agent's to explain, so this only says which one it is. */}
              <span className="text-foreground group-focus:text-primary-foreground shrink-0 text-sm font-medium">
                v{item.version}
                {item.version === document.versions.length ? ' · latest' : ''}
              </span>
              <span className="text-muted-foreground group-focus:text-primary-foreground/80 ml-auto truncate text-xs">
                <FormattedDate
                  date={item.createdAt}
                  options={{
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  }}
                />
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
