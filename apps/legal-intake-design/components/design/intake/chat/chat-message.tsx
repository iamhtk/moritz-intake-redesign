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
import { UserAvatar } from './user-avatar';
import type { ChatAttachment, ChatRole } from './types';

type ChatMessageProps = {
  role: ChatRole;
  /** Stable id used by the MessageScroller for anchoring/auto-scroll. */
  messageId?: string;
  children?: ReactNode;
  attachment?: ChatAttachment;
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
  attachment,
  stream = false,
  onStreamTick,
}: ChatMessageProps) {
  if (role === 'user') {
    return (
      <MessageScrollerItem messageId={messageId} scrollAnchor>
        <div className="flex items-start gap-2.5">
          <Bubble variant="muted" align="end">
            <BubbleContent className="space-y-2 px-4 py-3 text-[15px] leading-relaxed">
              {children ? (
                <div className="whitespace-pre-wrap">{children}</div>
              ) : null}
              {attachment ? <MessageAttachment name={attachment.name} /> : null}
            </BubbleContent>
          </Bubble>
          <UserAvatar className="mt-0.5" />
        </div>
      </MessageScrollerItem>
    );
  }

  const streamable = stream && typeof children === 'string';

  return (
    <MessageScrollerItem messageId={messageId}>
      <div className="flex gap-3.5">
        <MoritzAvatar />
        <div className="text-foreground min-w-0 flex-1 space-y-4 pt-0.5 text-[15px] leading-7">
          <Bubble variant="ghost" align="start">
            <BubbleContent className="space-y-3 text-[15px] leading-7">
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
              {attachment ? <MessageAttachment name={attachment.name} /> : null}
            </BubbleContent>
          </Bubble>
        </div>
      </div>
    </MessageScrollerItem>
  );
}
