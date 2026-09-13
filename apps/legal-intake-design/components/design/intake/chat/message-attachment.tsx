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
 *
 * `onOpen` makes the chip a way back into the document rather than a receipt
 * for it. Only the name and icon become the button, never the whole chip: the
 * remove × lives in here too on the composer's copy of this, and a control
 * inside a control is the pair of them fighting over one click.
 */
export function MessageAttachment({
  name,
  onOpen,
  onRemove,
  className,
}: {
  name: string;
  onOpen?: () => void;
  onRemove?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <AttachmentMedia>
        <FileText aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{name}</AttachmentTitle>
      </AttachmentContent>
    </>
  );

  return (
    <Attachment className={cn('w-full', className)}>
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          title={name}
          className="focus-visible:outline-ring focus-visible:outline-solid hover:bg-foreground/[0.04] -m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-[0.5rem] p-1 text-left outline-none transition-colors focus-visible:outline-2"
        >
          {body}
        </button>
      ) : (
        body
      )}
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
