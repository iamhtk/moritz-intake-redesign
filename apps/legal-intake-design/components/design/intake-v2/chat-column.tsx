'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@repo/ui/lib/utils';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/design/foundations/components/message-scroller';
import {
  ChatComposer,
  type ComposerAttachment,
} from '@/components/design/intake/chat/chat-composer';
import { ChatMessage } from '@/components/design/intake/chat/chat-message';
import { TypingIndicator } from '@/components/design/intake/chat/typing-indicator';
import type { SuggestionChip } from '@/components/design/new-case/intake-types';
import { SuggestionChips } from './suggestion-chips';
import type { ChatMessage as Turn } from './use-conversation';

/**
 * The conversation. Not the product, the way the brief gets filled in.
 *
 * Reply text arrives from the server a few characters at a time and is written
 * straight into the bubble, so `ChatMessage`'s own word-by-word reveal stays
 * off: faking a second animation on top of real streaming would make Moritz
 * look slower than it is.
 */
export function ChatColumn({
  messages,
  busy,
  error,
  attachments,
  chipsByField,
  onSend,
  onChooseChip,
  onAttach,
  onRemoveAttachment,
}: {
  messages: Turn[];
  busy: boolean;
  error: string | null;
  attachments: ComposerAttachment[];
  /** Ready-made answers by field key, for the turns that ask about one. */
  chipsByField: Record<string, readonly SuggestionChip[]>;
  onSend: (text: string) => void;
  onChooseChip: (messageId: string, chipValue: string, label: string) => void;
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const t = useTranslations('intake.chat');
  const hasMessages = messages.length > 0;
  const waiting =
    busy &&
    messages.at(-1)?.role === 'assistant' &&
    messages.at(-1)?.text === '';

  return (
    <MessageScrollerProvider autoScroll>
      {/*
       * Only stretch to fill once there is a conversation to fill it with. On
       * the opening screen the transcript is empty, so claiming the height
       * would leave the composer fighting an empty box for room.
       */}
      <div
        className={cn('flex min-h-0 flex-col gap-3', hasMessages && 'h-full')}
      >
        {hasMessages ? (
          <div className="min-h-0 flex-1">
            <MessageScroller>
              <MessageScrollerViewport className="mz-scrollbar-on-scroll">
                <MessageScrollerContent aria-busy={busy} className="py-2">
                  {messages.map((message) => {
                    const chips = message.chipsFor
                      ? chipsByField[message.chipsFor]
                      : undefined;
                    return (
                      <div key={message.id} className="flex flex-col gap-3">
                        <ChatMessage
                          role={message.role}
                          messageId={message.id}
                          {...(message.attachments?.[0]
                            ? { attachment: message.attachments[0] }
                            : {})}
                        >
                          {message.text}
                        </ChatMessage>
                        {/*
                         * The chips belong to the turn that asked, and stay there
                         * after they are used, with the answer filled in.
                         */}
                        {/*
                         * Indented to start where the message text starts, not
                         * where the avatar does: 1.75rem of avatar plus the
                         * 0.875rem gap beside it. Sitting under the avatar made
                         * them read as their own thing rather than part of the
                         * question they belong to.
                         */}
                        {chips && !message.pending ? (
                          <div className="ps-[2.625rem]">
                            <SuggestionChips
                              chips={chips}
                              {...(message.chipChoice !== undefined
                                ? { selectedValue: message.chipChoice }
                                : {})}
                              onSelect={(chip) =>
                                onChooseChip(message.id, chip.value, chip.label)
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {waiting ? <TypingIndicator /> : null}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-destructive shrink-0 px-1 text-sm">
            {error}
          </p>
        ) : null}

        {/*
         * `shrink-0` is the important part. Without it, a short viewport
         * squeezes the composer until its toolbar collapses into whatever sits
         * below, which is what happened on a 14in laptop.
         */}
        <div className="shrink-0">
          <ChatComposer
            placeholder={
              messages.length === 0 ? t('placeholderFirst') : t('placeholder')
            }
            busy={busy}
            onSend={onSend}
            onAttach={onAttach}
            attachments={attachments}
            onRemoveAttachment={onRemoveAttachment}
            attachmentsEnableSend
          />
        </div>
      </div>
    </MessageScrollerProvider>
  );
}
