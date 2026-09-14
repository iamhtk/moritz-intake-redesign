import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { X } from '@repo/ui/icons';
import { describeFile } from '@/components/design/new-case/file-utils';
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
  /*
   * The file's own glyph and colour, not a generic page (§1 #8).
   *
   * `describeFile` is the map the case pages, the document viewer and the old
   * new-case flow have always used: PDF red, Word blue, Excel green,
   * PowerPoint orange, everything else grey. This component hardcoded one
   * slate page icon for every file, so the thing a client is most likely to
   * hand over — a contract, as a PDF — arrived looking like a text file, and
   * looked different here from how the same file looks on the case page they
   * are handed off to.
   *
   * Wiring, not a design decision. The red is Adobe's, the way the blue is
   * Word's; it is a file-type convention rather than the brand's
   * `destructive` token, which means "stop here" and is capped for that
   * reason.
   */
  const { Icon, colorClass } = describeFile(name);

  const body = (
    <>
      <AttachmentMedia>
        <Icon aria-hidden="true" className={colorClass} />
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
