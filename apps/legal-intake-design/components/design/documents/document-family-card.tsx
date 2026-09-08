'use client';

import { ChevronDown, Download } from '@repo/ui/icons';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/design/foundations/components/collapsible';
import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/design-system/button';
import { FormattedDate } from '@/components/formatted-date';
import {
  DocumentFileIcon,
  DocumentVersionRow,
  downloadDocument,
} from './document-version-row';
import { type DocumentFamily } from './document-model';

/**
 * One logical document rendered as a borderless row in the notification-inbox
 * design language: a leading rounded file-type tile, the name with its upload
 * date, a hover-revealed download, and any older versions tucked into a
 * collapsible history that indents under the name so the panel stays scannable.
 */
export function DocumentFamilyCard({ family }: { family: DocumentFamily }) {
  const { latest, versions } = family;
  const hasHistory = versions.length > 1;

  return (
    <Collapsible className="hover:bg-muted/60 rounded-xl transition-colors">
      <div className="group/row flex items-center gap-3 px-3 py-2.5">
        <span className="bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
          <DocumentFileIcon name={latest.name} className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-foreground truncate text-sm font-medium">
              {family.name}
            </span>
            {latest.version > 1 && (
              <Badge
                variant="secondary"
                className="shrink-0 self-center tabular-nums"
              >
                v{latest.version}
              </Badge>
            )}
          </div>
          {hasHistory && (
            <CollapsibleTrigger className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mt-0.5 flex cursor-pointer items-center gap-1 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 [&[data-state=open]_svg.chevron]:rotate-180">
              {versions.length} versions
              <ChevronDown className="chevron size-3.5 transition-transform" />
            </CollapsibleTrigger>
          )}
        </div>

        <div className="relative flex shrink-0 items-center justify-end">
          <FormattedDate
            date={latest.uploadedAt}
            className="text-muted-foreground text-xs tabular-nums transition-opacity group-hover/row:opacity-0"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground absolute -right-1.5 top-1/2 size-7 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/row:opacity-100"
            onClick={() => downloadDocument(latest)}
            aria-label={`Download latest version of ${family.name}`}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasHistory && (
        <CollapsibleContent>
          <ul className="pb-1 pe-3 ps-[3.75rem]">
            {versions.map((version) => (
              <li key={version.id}>
                <DocumentVersionRow version={version} />
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
