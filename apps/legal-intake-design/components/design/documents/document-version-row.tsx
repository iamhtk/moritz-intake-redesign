'use client';

import { toast } from 'sonner';
import { Download } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/design/foundations/components/avatar';
import { Button } from '@/components/design/design-system/button';
import { FormattedDate } from '@/components/formatted-date';
import { describeFile } from '@/components/design/new-case/file-utils';
import MoritzSymbol from '@/components/icons/moritz-symbol';
import { actorColorClass, getInitials } from '@/lib/utils';
import type { Document } from '@/lib/types';
import { uploaderImage, uploaderSideLabel } from './document-model';

/**
 * Colored file-type glyph (Word/PDF/Excel/…) keyed off the file extension —
 * the same treatment used by the case-intake attachments.
 */
export function DocumentFileIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { Icon, colorClass } = describeFile(name);
  return <Icon aria-hidden="true" className={cn(colorClass, className)} />;
}

/**
 * Small avatar attributing a version to the party that uploaded it: the Moritz
 * mark for the AI drafting service, otherwise the uploader's initials tinted by
 * actor. Mirrors the transcript's `MessageAvatar` so sides read consistently.
 */
export function DocumentPartyAvatar({ doc }: { doc: Document }) {
  if (doc.uploaderActor === 'ai') {
    return (
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="text-foreground bg-transparent">
          <MoritzSymbol className="size-[85%]" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size="sm" className="shrink-0">
      <AvatarImage src={uploaderImage(doc)} alt={doc.uploadedBy} />
      <AvatarFallback
        className={cn(
          'text-[10px] font-medium',
          actorColorClass(doc.uploaderActor),
        )}
      >
        {getInitials(doc.uploadedBy)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Mock download — the playground has no backend, so we just toast. */
export function downloadDocument(doc: Document) {
  toast.success(`Downloading “${doc.name}” (v${doc.version})`);
}

/**
 * A single document version inside a family's expanded history. Attributes the
 * version to its party (avatar + side label) and ends with a hover-revealed
 * download action.
 */
export function DocumentVersionRow({ version }: { version: Document }) {
  return (
    <div className="group/version hover:bg-muted/60 -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors">
      <DocumentPartyAvatar doc={version} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground truncate text-xs font-medium">
            {uploaderSideLabel(version.uploaderActor)}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-xs tabular-nums">
          v{version.version} · <FormattedDate date={version.uploadedAt} />
        </p>
        {version.reviewNote ? (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {version.reviewNote}
          </p>
        ) : null}
      </div>

      <Button
        size="icon-sm"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground -me-1 size-7 shrink-0 transition-opacity sm:opacity-0 sm:group-focus-within/version:opacity-100 sm:group-hover/version:opacity-100"
        onClick={() => downloadDocument(version)}
        aria-label={`Download version ${version.version} of ${version.name}`}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
