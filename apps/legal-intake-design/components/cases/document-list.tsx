import { FileText, Download } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { FormattedDate } from '@/components/formatted-date';
import { Item, ItemContent, ItemMedia } from '@repo/ui/components/item';
import type { Document } from '@/lib/types';

function formatSize(bytes: number) {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

type Props = {
  documents: Document[];
  emptyState?: React.ReactNode;
};

export function DocumentList({ documents, emptyState }: Props) {
  if (documents.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {emptyState ?? 'No documents have been uploaded yet.'}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Item className="bg-card rounded-lg border">
            <ItemMedia>
              <FileText className="text-muted-foreground h-5 w-5" />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <div className="truncate font-medium">{doc.name}</div>
              <div className="text-muted-foreground truncate text-xs">
                {formatSize(doc.size)} · uploaded{' '}
                <FormattedDate date={doc.uploadedAt} /> by {doc.uploadedBy}
              </div>
            </ItemContent>
            <Button size="sm" variant="ghost" className="gap-1">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </Item>
        </li>
      ))}
    </ul>
  );
}
