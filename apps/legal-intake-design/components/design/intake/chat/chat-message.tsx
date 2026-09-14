'use client';

import type { ReactNode } from 'react';
import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import { MessageScrollerItem } from '@/components/design/foundations/components/message-scroller';
import { MessageAttachment } from './message-attachment';
import { MoritzAvatar } from './moritz-avatar';
import { StreamingText } from './streaming-text';
import { ThinkingMarker } from './typing-indicator';
import { UserAvatar } from './user-avatar';
import type { ChatAttachment, ChatRole } from './types';

type ChatMessageProps = {
  role: ChatRole;
  /** Stable id used by the MessageScroller for anchoring/auto-scroll. */
  messageId?: string;
  children?: ReactNode;
  /**
   * Files sent with the turn.
   *
   * A list rather than one, because a matter arrives as a bundle and the turn
   * that handed three documents over has to show three. It was a single
   * attachment while the intake read one file at a time, and the turn would
   * silently show the first and drop the rest.
   */
  attachments?: readonly ChatAttachment[];
  /**
   * Opens a file the turn carried.
   *
   * Optional because the two older intake flows that share this component have
   * nowhere to open one. Where it is given, every attachment chip in the turn
   * becomes a way back to the document itself.
   */
  onOpenAttachment?: (attachment: ChatAttachment) => void;
  /**
   * Extra content for the turn, rendered inside the message item below the
   * bubble and aligned to the text rather than the avatar (assistant turns
   * only). Suggestion chips go here so they stay part of the turn that asked:
   * the scroller tracks its items by direct children, so anything lifted out
   * into a sibling wrapper stops being anchorable.
   */
  footer?: ReactNode;
  /**
   * A sentence the turn carries without it being part of what was said in
   * answer, rendered last and set apart (assistant turns only).
   *
   * Below the footer, so a turn that asked a question keeps its ready-made
   * answers directly under the question, and muted, so the client can tell at a
   * glance that this is an aside they can come back to rather than a second
   * thing being asked of them right now.
   */
  aside?: ReactNode;
  /**
   * Show the thinking marker where the reply will go, instead of an empty
   * bubble (assistant turns only). The turn has to stay mounted while it waits
   * so the reply can stream into this same item: swapping a separate indicator
   * out for the turn would change the scroller's child list mid-exchange, and
   * it reacts to that by hunting for a scroll anchor to jump to.
   */
  thinking?: boolean;
  /**
   * What this particular wait is, named as an activity: "Reading your
   * document", "Checking that against the rest of your case".
   *
   * Carried on the turn rather than set once on the transcript, because a turn
   * knows why it is waiting and the transcript does not. A document being read
   * and a reply being written are two different waits that land in the same
   * place on screen, and a label held at the column level would have to guess
   * which one it was looking at.
   */
  thinkingLabel?: string;
  /**
   * The persisting record of the work behind this turn, rendered where the
   * thinking marker would go (assistant turns only). See
   * `intake-v2/work-rail.tsx`.
   *
   * A slot rather than a built-in, because what goes in it is intake v2's own
   * `TimelineStep[]` and this component is shared with two older flows that
   * have no such thing. Passed as a node, so this file stays a layout and does
   * not learn about the intake's domain.
   *
   * It replaces the marker rather than sitting beside it: a rail whose live row
   * is a spinner and a shimmering label *is* the marker, and rendering both
   * would put the same sentence on screen twice. `thinking` is ignored while
   * this is set, so a caller cannot accidentally get both.
   */
  rail?: ReactNode;
  /** Reveal assistant text word-by-word (assistant turns only). */
  stream?: boolean;
  /** Fired on each streaming step so the transcript can follow along. */
  onStreamTick?: () => void;
};

/**
 * Single chat turn, rooted in a `MessageScrollerItem`. Assistant turns render as
 * bare prose (ghost Bubble) beside the Moritz avatar; user turns render as a
 * right-aligned muted Bubble. Assistant text can stream word-by-word.
 */
export function ChatMessage({
  role,
  messageId,
  children,
  attachments = [],
  onOpenAttachment,
  footer,
  aside,
  thinking = false,
  thinkingLabel,
  rail,
  stream = false,
  onStreamTick,
}: ChatMessageProps) {
  if (role === 'user') {
    return (
      /*
       * No `scrollAnchor`, and its absence is the thing that makes a streaming
       * reply follow the live edge.
       *
       * This used to be `scrollAnchor`, which is the "pin the question to the
       * top and let the answer fill the space below it" pattern. The scroller
       * implements that by calling `scrollToElement(align: 'start')` on the new
       * turn, and that call puts it in `anchored-to-message` mode — it does
       * *not* pass the `autoscrolling` flag that `scrollToEnd` does, so the
       * mode never returns to `following-bottom` on its own.
       *
       * Everything after that is the bug. While the reply streams, the item
       * count does not change, so the scroller looks for an unhandled anchor,
       * finds none (this turn was marked handled when it anchored), and falls
       * through to a branch that only scrolls when the mode is
       * `following-bottom`. It is not. So the answer grew downward off the
       * bottom of the viewport and nothing moved, on phones almost immediately
       * and on a desktop as soon as a reply ran past the fold.
       *
       * Without the anchor, a new turn and each streaming growth both land on
       * that same branch with the mode still `following-bottom`, so the
       * scroller calls `scrollToEnd` and keeps the newest text in view. Scroll
       * up by hand and it flips to `free-scrolling` and stops chasing, which is
       * the behaviour that should interrupt it, rather than the arrival of a
       * question.
       */
      <MessageScrollerItem messageId={messageId}>
        <div className="flex items-start gap-2.5">
          <Bubble variant="muted" align="end">
            <BubbleContent className="space-y-2 px-4 py-3 text-base leading-relaxed">
              {children ? (
                <div className="whitespace-pre-wrap">{children}</div>
              ) : null}
              {attachments.map((attachment) => (
                <MessageAttachment
                  key={attachment.name}
                  name={attachment.name}
                  {...(onOpenAttachment
                    ? { onOpen: () => onOpenAttachment(attachment) }
                    : {})}
                />
              ))}
            </BubbleContent>
          </Bubble>
          <UserAvatar className="mt-0.5" />
        </div>
      </MessageScrollerItem>
    );
  }

  const streamable = stream && typeof children === 'string';
  const hasBody = Boolean(children) || attachments.length > 0;

  return (
    <MessageScrollerItem messageId={messageId}>
      <div className="flex gap-3.5">
        <MoritzAvatar />
        <div className="text-foreground min-w-0 flex-1 space-y-4 pt-0.5 text-base leading-7">
          {rail ?? null}
          {thinking && !rail ? (
            <ThinkingMarker
              {...(thinkingLabel !== undefined ? { label: thinkingLabel } : {})}
            />
          ) : null}
          {hasBody ? (
            <Bubble variant="ghost" align="start">
              <BubbleContent className="space-y-3 text-base leading-7">
                {children ? (
                  <div className="whitespace-pre-wrap">
                    {streamable ? (
                      <StreamingText
                        text={children as string}
                        onTick={onStreamTick}
                      />
                    ) : (
                      children
                    )}
                  </div>
                ) : null}
                {attachments.map((attachment) => (
                  <MessageAttachment
                    key={attachment.name}
                    name={attachment.name}
                    {...(onOpenAttachment
                      ? { onOpen: () => onOpenAttachment(attachment) }
                      : {})}
                  />
                ))}
              </BubbleContent>
            </Bubble>
          ) : null}
          {footer}
          {aside ? (
            <p className="text-muted-foreground border-border/60 border-l-2 pl-3 text-sm leading-6">
              {aside}
            </p>
          ) : null}
        </div>
      </div>
    </MessageScrollerItem>
  );
}
