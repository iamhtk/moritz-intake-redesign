import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { FileText, X } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/**
 * A single file attachment shown inside a chat turn, built on the foundation
 * Attachment primitive. Used for both intake files and chat attachments.
 */
export function MessageAttachment({
  name,
  onRemove,
  className,
}: {
  name: string;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <Attachment className={cn('w-full', className)}>
      <AttachmentMedia>
        <FileText aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
      </AttachmentContent>
      {onRemove ? (
        <AttachmentActions>
          <AttachmentAction onClick={onRemove} aria-label={`Remove ${name}`}>
            <X aria-hidden="true" />
          </AttachmentAction>
        </AttachmentActions>
      ) : null}
    </Attachment>
  );
}
