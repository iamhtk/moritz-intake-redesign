'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';
import { Check, Copy, Pencil, Trash2 } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import { buttonVariants } from '@/components/design/foundations/components/button';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
} from '@/components/design/foundations/components/alert';
import {
  Marker,
  MarkerContent,
} from '@/components/design/foundations/components/marker';
import {
  Attachment,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import {
  ChatComposer,
  type ComposerAttachment,
} from '@/components/design/intake/chat/chat-composer';
import { CollapsibleMessageText } from '@/components/design/intake/chat/collapsible-message-text';
import { PaymentEventCard } from '@/components/design/chat-events/payment-event-card';
import { HandoffCard } from '@/components/design/chat-events/handoff-card';
import { LawyerAssignedCard } from '@/components/design/chat-events/lawyer-assigned-card';
import { describeFile, newId } from '@/components/design/new-case/file-utils';
import { FormattedDate, useIsMounted } from '@/components/formatted-date';
import { MessageAvatar } from '@/components/messages/message-avatar';
import type {
  Document,
  DocumentUploaderActor,
  Message,
  ParticipantRef,
} from '@/lib/types';

type Props = {
  caseId: string;
  messages: Message[];
  currentUserId: string;
  /** Which actor counts as "you" — drives own-bubble styling and sent-message authorship. */
  currentUserActor: ParticipantRef['actor'];
  placeholder: string;
  emptyState: string;
  /**
   * Persist chat-attached files to the case's shared document list (applying
   * version families) and return the created records to attach to the message.
   * When omitted, attachments are built inline and live only on the message.
   */
  onUploadDocuments?: (fileNames: string[]) => Document[];
};

const ACTOR_LABELS: Record<ParticipantRef['actor'], string> = {
  client: 'Client',
  opposing: 'Opposing party',
  legal: 'Counsel',
  admin: 'Moritz',
  ai: 'Moritz AI',
};

/** How long a freshly-sent (mock) message stays "Delivered" before it flips to "Read". */
const MOCK_READ_DELAY_MS = 2_500;

// Run the initial bottom-pin before the browser paints (avoids a flash at the
// top), falling back to a passive effect during SSR where layout effects warn.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type MessageGroupData = {
  id: string;
  author: ParticipantRef;
  isOwn: boolean;
  dayKey: string;
  phase: 'intake' | 'counsel';
  messages: Message[];
  /** Payment / lawyer-assigned / handoff milestone rendered as a centered card, never grouped. */
  isEvent: boolean;
};

/** Treat missing phase as counsel — only intake turns are explicitly tagged. */
function phaseOf(message: Message): 'intake' | 'counsel' {
  return message.phase ?? 'counsel';
}

/**
 * Map the sender's chat actor to the document uploader actor. `opposing` has no
 * document-uploader equivalent (only Moritz/client sides own files), so it falls
 * back to `client`.
 */
function toUploaderActor(
  actor: ParticipantRef['actor'],
): DocumentUploaderActor {
  return actor === 'opposing' ? 'client' : actor;
}

/** UTC day bucket; deterministic across SSR/CSR (avoids a tz hydration mismatch). */
function dayKeyOf(message: Message): string {
  return message.createdAt.slice(0, 10);
}

/**
 * Collapse consecutive messages from the same sender (on the same day) into
 * groups so the avatar and name render once per group, iMessage/WhatsApp-style.
 */
function groupMessages(
  messages: Message[],
  isOwn: (message: Message) => boolean,
): MessageGroupData[] {
  const groups: MessageGroupData[] = [];
  for (const message of messages) {
    const dayKey = dayKeyOf(message);
    const phase = phaseOf(message);
    const isEvent = Boolean(
      message.paymentEvent ||
        message.lawyerAssignedEvent ||
        message.handoffEvent,
    );
    const last = groups.at(-1);
    if (
      last &&
      !last.isEvent &&
      !isEvent &&
      last.author.id === message.author.id &&
      last.dayKey === dayKey &&
      last.phase === phase
    ) {
      last.messages.push(message);
      continue;
    }
    groups.push({
      id: message.id,
      author: message.author,
      isOwn: isOwn(message),
      dayKey,
      phase,
      messages: [message],
      isEvent,
    });
  }
  return groups;
}

/**
 * Full-bleed case conversation: a grouped, scrollable transcript with the
 * rounded Moritz composer pinned to the bottom. Fills its parent so it takes the
 * whole main area. Sending/attaching/editing/deleting are mocked for the design
 * app: edits and deletes mutate local state only, and read receipts are simulated
 * with a short timer after sending. Shared across the client, legal, and admin
 * case views — role differences are the `currentUserActor`, `placeholder`, and
 * `emptyState`.
 */
export function CaseChat({
  messages,
  currentUserId,
  currentUserActor,
  placeholder,
  emptyState,
  onUploadDocuments,
}: Props) {
  const [localMessages, setLocalMessages] = useState(messages);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  // The transcript is hidden until it's pinned to the bottom so the SSR'd
  // top-of-list paint never shows — the chat appears already at the latest
  // message with no flicker.
  const [isPinned, setIsPinned] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const pinToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    pinToBottom();
    setIsPinned(true);

    // Keep the view pinned while late layout settles (e.g. avatar images
    // loading grow the content) — but back off once the user scrolls up.
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) pinToBottom();
    });
    observer.observe(container);
    const content = container.firstElementChild;
    if (content) observer.observe(content);

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 48;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAttach = (files: File[]) => {
    setAttachments((prev) => [
      ...prev,
      ...files.map((file): ComposerAttachment => {
        const { Icon, colorClass } = describeFile(file.name);
        return {
          id: newId(),
          name: file.name,
          icon: Icon,
          iconClassName: colorClass,
          state: 'done',
        };
      }),
    ]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const handleSend = (text: string) => {
    const id = `local_${Date.now()}`;
    const createdAt = new Date().toISOString();
    // Prefer the shell's uploader so files land in the shared Documents tab with
    // proper version families; otherwise build inline records for this message.
    const sentAttachments: Document[] = onUploadDocuments
      ? onUploadDocuments(attachments.map((attachment) => attachment.name))
      : attachments.map((attachment) => ({
          id: attachment.id,
          familyId: attachment.id,
          version: 1,
          name: attachment.name,
          size: 0,
          mimeType: '',
          uploadedAt: createdAt,
          uploadedBy: 'You',
          uploaderActor: toUploaderActor(currentUserActor),
          docType: 'other',
          status: 'final',
          isDraft: false,
        }));
    const next: Message = {
      id,
      caseId: 'local',
      body: text,
      createdAt,
      readAt: null,
      author: {
        id: currentUserId,
        name: 'You',
        email: '',
        image: null,
        actor: currentUserActor,
        companyName: null,
      },
      ...(sentAttachments.length > 0 ? { attachments: sentAttachments } : {}),
    };
    setLocalMessages((prev) => [...prev, next]);
    setAttachments([]);

    // Mock a read receipt: the message shows "Delivered" briefly, then "Read".
    setTimeout(() => {
      setLocalMessages((prev) =>
        prev.map((message) =>
          message.id === id
            ? { ...message, readAt: new Date().toISOString() }
            : message,
        ),
      );
    }, MOCK_READ_DELAY_MS);
  };

  const handleEdit = (id: string, body: string) => {
    setLocalMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? { ...message, body, editedAt: new Date().toISOString() }
          : message,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setLocalMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? { ...message, deletedAt: new Date().toISOString() }
          : message,
      ),
    );
  };

  const isOwn = (message: Message) => message.author.actor === currentUserActor;

  const groups = groupMessages(localMessages, isOwn);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollContainerRef}
        className={cn(
          // Extend the scroll viewport rightward to cancel the surrounding
          // `main`'s responsive horizontal padding (sm:px-6 / lg:px-8) so the
          // vertical scrollbar sits flush at the far right of the available chat
          // area — against the docked details panel when open, and the card edge
          // when closed — rather than tucked inside the content gutter. The inner
          // `md:pe-*` wrapper re-adds matching padding so the messages stay put.
          'min-h-0 flex-1 overflow-y-auto md:-me-6 lg:-me-8',
          !isPinned && 'invisible',
        )}
      >
        {localMessages.length === 0 ? (
          <div className="flex h-full flex-col md:pe-6 lg:pe-8">
            <div className="text-muted-foreground flex h-full items-center justify-center px-4 text-center text-base/6 sm:text-sm/6">
              {emptyState}
            </div>
          </div>
        ) : (
          <div className="md:pe-6 lg:pe-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-4 pt-20">
              {groups.map((group, index) => {
                const showDate = group.dayKey !== groups[index - 1]?.dayKey;
                const eventMessage = group.isEvent ? group.messages[0]! : null;
                return (
                  <div key={group.id} className="flex flex-col gap-4">
                    {showDate && (
                      <DateSeparator date={group.messages[0]!.createdAt} />
                    )}
                    {eventMessage?.paymentEvent ? (
                      <PaymentEventCard
                        event={eventMessage.paymentEvent}
                        createdAt={eventMessage.createdAt}
                        caseId={eventMessage.caseId}
                      />
                    ) : eventMessage?.lawyerAssignedEvent ? (
                      <LawyerAssignedCard
                        lawyer={eventMessage.lawyerAssignedEvent.lawyer}
                      />
                    ) : eventMessage?.handoffEvent ? (
                      /*
                       * The client's own words, so `body` is passed through
                       * rather than dropped the way `paymentEvent`'s is. See
                       * `handoff-card.tsx` for why this is not two bubbles.
                       */
                      <HandoffCard
                        body={eventMessage.body}
                        createdAt={eventMessage.createdAt}
                        lawyerId={eventMessage.handoffEvent.lawyerId}
                      />
                    ) : (
                      <MessageGroup
                        group={group}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* On mobile, pad for the browser chrome / home indicator (safe-area) so
          the composer is never tucked out of view. On md+ the negative bottom
          margin bleeds into the dashboard content wrapper's pb-10 so the
          composer sits close to the card's bottom edge. */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:-mb-8 md:pb-4">
        <ChatComposer
          placeholder={placeholder}
          onSend={handleSend}
          onAttach={handleAttach}
          attachments={attachments}
          onRemoveAttachment={handleRemoveAttachment}
        />
      </div>
    </div>
  );
}

/** Human day label: "Today"/"Yesterday" once mounted, else the absolute date. */
function dayLabel(date: string): 'today' | 'yesterday' | null {
  const then = new Date(date);
  const now = new Date();
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(then)) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return null;
}

function DateSeparator({ date }: { date: string }) {
  const isMounted = useIsMounted();
  const relative = isMounted ? dayLabel(date) : null;
  return (
    <Marker
      variant="separator"
      className="mx-auto w-64 max-w-full py-1 text-[0.6875rem] font-medium"
    >
      <MarkerContent suppressHydrationWarning>
        {relative === 'today' ? (
          'Today'
        ) : relative === 'yesterday' ? (
          'Yesterday'
        ) : (
          <FormattedDate date={date} options={{ dateStyle: 'medium' }} />
        )}
      </MarkerContent>
    </Marker>
  );
}

function MessageGroup({
  group,
  onEdit,
  onDelete,
}: {
  group: MessageGroupData;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  if (group.isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        {group.messages.map((message) => (
          <MessageRow
            key={message.id}
            message={message}
            isOwn
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="group/grp flex gap-2.5">
      <MessageAvatar participant={group.author} className="size-7 shrink-0" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{group.author.name}</span>
          <span className="text-muted-foreground text-[0.6875rem] font-medium opacity-0 transition-opacity group-focus-within/grp:opacity-100 group-hover/grp:opacity-100">
            {ACTOR_LABELS[group.author.actor]}
          </span>
        </div>
        {group.messages.map((message) => (
          <MessageRow
            key={message.id}
            message={message}
            isOwn={false}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function MessageRow({
  message,
  isOwn,
  onEdit,
  onDelete,
}: {
  message: Message;
  isOwn: boolean;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(message.body);
    setCopied(true);
    toast.success('Copied to clipboard.');
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (isEditing) {
      const el = editRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [isEditing]);

  const startEditing = () => {
    setDraft(message.body);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft(message.body);
  };

  const saveEditing = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onEdit(message.id, trimmed);
    setIsEditing(false);
  };

  if (message.deletedAt) {
    return (
      <p
        className={cn(
          'text-muted-foreground text-xs italic',
          isOwn ? 'text-right' : 'text-left',
        )}
      >
        {isOwn ? 'You deleted this message' : 'This message was deleted'}
      </p>
    );
  }

  const iconButtonClass = 'text-muted-foreground size-6 shrink-0';

  const copyButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Copy message"
      onClick={handleCopy}
      className={iconButtonClass}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  const timestamp = (
    <span className="text-muted-foreground shrink-0 text-[0.6875rem]">
      <FormattedDate
        date={message.createdAt}
        options={{ hour: 'numeric', minute: '2-digit' }}
      />
    </span>
  );

  // Shown regardless of hover so an edit is always discoverable; the action
  // buttons + full timestamp reveal on the same line on hover.
  const editedTag = message.editedAt ? (
    <span className="text-muted-foreground px-1 text-[0.6875rem]">Edited</span>
  ) : null;

  const hoverGroupClass =
    'flex items-center gap-0.5 opacity-0 transition-opacity duration-200 ease-out group-hover/msg:opacity-100 focus-within:opacity-100';

  if (isEditing) {
    return (
      <div className="flex w-full max-w-[85%] flex-col gap-2">
        <textarea
          ref={editRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEditing();
            }
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              saveEditing();
            }
          }}
          rows={3}
          aria-label="Edit message"
          className="border-field focus-visible:ring-primary min-h-20 w-full resize-none rounded-2xl border bg-transparent px-4 py-2.5 text-sm outline-none focus-visible:ring-2"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelEditing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={saveEditing}
            disabled={draft.trim().length === 0}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  const deleteAlert = (
    <Alert open={confirmingDelete} onOpenChange={setConfirmingDelete}>
      <AlertContent size="sm">
        <AlertHeader>
          <AlertTitle>Delete message?</AlertTitle>
          <AlertDescription>
            This message will be permanently removed. This can&rsquo;t be
            undone.
          </AlertDescription>
        </AlertHeader>
        <AlertFooter>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline' }))}
            onClick={() => setConfirmingDelete(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'destructive' }))}
            onClick={() => {
              onDelete(message.id);
              setConfirmingDelete(false);
            }}
          >
            Delete
          </button>
        </AlertFooter>
      </AlertContent>
    </Alert>
  );

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="group/msg flex max-w-[85%] flex-col items-end">
          {message.attachments?.length ? (
            <MessageAttachments attachments={message.attachments} align="end" />
          ) : null}
          {message.body ? (
            <div className="bg-primary text-primary-foreground min-w-0 rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
              <CollapsibleMessageText text={message.body} />
            </div>
          ) : null}
          <div className="flex items-center gap-0.5 pt-1">
            {editedTag}
            <div className={hoverGroupClass}>
              {copyButton}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Edit message"
                onClick={startEditing}
                className={iconButtonClass}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete message"
                onClick={() => setConfirmingDelete(true)}
                className={cn(iconButtonClass, 'hover:text-destructive')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {timestamp}
            </div>
          </div>
        </div>
        {deleteAlert}
      </div>
    );
  }

  // AI (intake) messages read as plain assistant text, not chat bubbles — only
  // human participants get a bubble.
  const isAi = message.author.actor === 'ai';

  return (
    <div className="group/msg flex max-w-[85%] flex-col items-start">
      {message.attachments?.length ? (
        <MessageAttachments attachments={message.attachments} align="start" />
      ) : null}
      {message.body ? (
        <div
          className={cn(
            'text-foreground min-w-0 whitespace-pre-wrap text-sm leading-relaxed',
            !isAi && 'bg-muted rounded-2xl px-4 py-2.5',
          )}
        >
          {isAi ? message.body : <CollapsibleMessageText text={message.body} />}
        </div>
      ) : null}
      <div className="flex items-center gap-0.5 pt-1">
        {editedTag}
        <div className={hoverGroupClass}>
          {copyButton}
          {timestamp}
        </div>
      </div>
    </div>
  );
}

/** Cap the attachments shown per message; the rest collapse into a "+N" chip. */
const MAX_VISIBLE_ATTACHMENTS = 8;

/**
 * Files attached to a chat message, rendered as compact foundation Attachment
 * cards above the message text — mirroring the intake transcript. Aligns to the
 * sender's side and collapses overflow into a "+N" chip.
 */
function MessageAttachments({
  attachments,
  align,
}: {
  attachments: Document[];
  align: 'start' | 'end';
}) {
  const visible = attachments.slice(0, MAX_VISIBLE_ATTACHMENTS);
  const overflow = attachments.length - visible.length;

  return (
    <div
      className={cn(
        'mb-1 flex flex-wrap gap-2',
        align === 'end' ? 'justify-end' : 'justify-start',
      )}
    >
      {visible.map((file) => {
        const { Icon, colorClass } = describeFile(file.name);
        return (
          <Attachment
            key={file.id}
            size="sm"
            className="bg-muted/50 w-40 gap-0.5 border-transparent"
          >
            <AttachmentMedia className="size-8 bg-transparent [&>svg]:size-5">
              <Icon className={colorClass} aria-hidden="true" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
            </AttachmentContent>
          </Attachment>
        );
      })}
      {overflow > 0 ? (
        <span className="bg-muted/50 text-muted-foreground flex items-center justify-center rounded-lg px-3 text-xs font-medium">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
