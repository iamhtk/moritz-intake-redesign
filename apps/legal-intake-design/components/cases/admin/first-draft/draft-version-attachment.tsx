'use client';

import { ChevronDown, Download } from '@repo/ui/icons';
import { toast } from 'sonner';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import { DocumentFileIcon } from '@/components/design/documents/document-version-row';
import { FormattedDate } from '@/components/formatted-date';

import {
  findVersion,
  type DraftDocument,
  type DraftDocumentVersion,
} from './workspace-data';

/**
 * Hands the file over.
 *
 * The workspace never edits the stored document, so a download is always a
 * particular version exactly as it was written.
 */
export function downloadVersion(
  document: DraftDocument,
  version: DraftDocumentVersion,
) {
  toast.success(`Downloading ${document.name}`, {
    description: `Version ${version.version}, in the format it was stored.`,
  });
}

/**
 * A version of the draft, in the conversation that produced it.
 *
 * Where there is no document column — the first slice of the feature — the
 * chat is the only place the draft exists, so each version the agent cuts
 * arrives as a file ops can take away. The card belongs to the version in the
 * message above it; the menu beside it reaches the ones before.
 */
export function DraftVersionAttachment({
  document,
  versionId,
}: {
  document: DraftDocument;
  versionId: string;
}) {
  const version = findVersion(document, versionId);
  const earlier = [...document.versions]
    .reverse()
    .filter((item) => item.id !== version.id);

  return (
    <Attachment size="sm" className="mt-2 w-full">
      <AttachmentMedia>
        <DocumentFileIcon name={document.name} />
      </AttachmentMedia>

      <AttachmentContent>
        <AttachmentTitle>{document.name}</AttachmentTitle>
        <AttachmentDescription>
          v{version.version} · {extensionOf(document.name)} ·{' '}
          {document.sizeLabel}
        </AttachmentDescription>
      </AttachmentContent>

      <AttachmentActions className="self-center">
        <AttachmentAction
          aria-label={`Download v${version.version}`}
          onClick={() => downloadVersion(document, version)}
        >
          <Download />
        </AttachmentAction>

        {earlier.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AttachmentAction aria-label="Earlier versions">
                <ChevronDown />
              </AttachmentAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Earlier versions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {earlier.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => downloadVersion(document, item)}
                >
                  <Download data-icon="inline-start" />
                  <span className="shrink-0">v{item.version}</span>
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
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </AttachmentActions>
    </Attachment>
  );
}

function extensionOf(name: string) {
  const extension = name.split('.').pop();
  return extension ? extension.toUpperCase() : 'File';
}
