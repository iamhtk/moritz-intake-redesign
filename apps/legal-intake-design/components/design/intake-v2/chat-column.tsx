'use client';

import type { ReactNode } from 'react';
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
import type { SuggestionChip } from '@/components/design/new-case/intake-types';
import { Button } from '@/components/design/foundations/components/button';
import { SuggestionChips } from './suggestion-chips';
import { WetInk } from './wet-ink';
import { WorkRail } from './work-rail';
import type { ChatMessage as Turn, IntakeFailure } from './use-conversation';

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
  failure,
  attachments,
  chipsByField,
  onSend,
  onRetry,
  onChooseChip,
  onAttach,
  onRemoveAttachment,
  onOpenDocument,
  onEdit,
  attachmentsCanSend,
  beneathComposer,
}: {
  messages: Turn[];
  busy: boolean;
  /** What went wrong, and whether sending it again could work (T32). */
  failure: IntakeFailure | null;
  attachments: ComposerAttachment[];
  /** Ready-made answers by field key, for the turns that ask about one. */
  chipsByField: Record<string, readonly SuggestionChip[]>;
  onSend: (text: string) => void;
  /** Send the failed turn again, for the failures that are worth retrying. */
  onRetry: () => void;
  onChooseChip: (messageId: string, chipValue: string, label: string) => void;
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  /**
   * Opens a document the transcript is showing.
   *
   * The files in the transcript are the client's own, sitting in the turn that
   * handed them over, and that turn is the most natural place to want them
   * back: it is where they are named and where the client was when they last
   * thought about them. So a chip is a control, not a receipt.
   */
  onOpenDocument: (name: string) => void;
  /**
   * The client is typing, for the one caller that needs to know before they
   * send.
   *
   * Passed straight through to `ChatComposer`; see the prop there for why it
   * is not `onChange`. The opening screen uses it to hand the "how this works"
   * card over to the journey rail on the first character, which has to happen
   * while the client is still mid-sentence rather than after they submit it.
   */
  onEdit?: (next: string) => void;
  /**
   * Whether the docked files are something the client can send on their own.
   *
   * The dock shows two different things: files staged and waiting to go, and
   * files currently being read. Only the first is sendable, and the difference
   * is not visible from here — so the caller, which owns both lists, says.
   * Hardcoded `true` had the Send button live during a read, where pressing it
   * did nothing at all.
   */
  attachmentsCanSend: boolean;
  /**
   * One row under the composer, in every phase the composer appears in.
   *
   * Exists for the escape hatch (V22): a named way out has to be on screen
   * whenever the client might want it, which is all of them, and this component
   * is the one thing rendered on the opening screen, during the conversation
   * and after submission alike. Passed in rather than built here because what
   * goes in it needs the brief's matter type and the transcript, and neither is
   * this component's business.
   */
  beneathComposer?: ReactNode;
}) {
  const t = useTranslations('intake.chat');
  const hasMessages = messages.length > 0;
  /*
   * A reply streams into an assistant turn that starts out empty, so the turn
   * is on screen before it has anything to say and shows the thinking marker
   * until the first chunk lands.
   *
   * Keeping that one turn mounted throughout is the whole trick. The scroller
   * tracks the transcript by its direct children: when children are added it
   * anchors the new turn near the top, but when a turn appears *without* the
   * count changing it reads that as a turn whose anchor was switched on in
   * place and jumps to the oldest turn it has not anchored yet. Swapping a
   * standalone indicator out for the real turn is exactly that shape — one
   * child out, one child in — which is why the reply used to throw the
   * transcript back up to the top of the conversation.
   *
   * Only a turn that settled empty is dropped, which is a stream that broke
   * before its first chunk; it would otherwise sit here as a blank avatar for
   * good.
   */
  const visible = messages.filter(
    (message) =>
      message.role !== 'assistant' || message.text !== '' || message.pending,
  );

  /*
   * Chips belong to one question at a time.
   *
   * A field can be asked about twice: the client says something that does not
   * answer it, or a turn lands while the same gap is still open. Both turns
   * carry `chipsFor`, and both used to render a live, untouched row of the same
   * four answers, so the transcript read as the same question asked again and
   * again with nothing to show which one was current.
   *
   * So the newest asking turn keeps its chips, and an older one keeps them only
   * if it was actually answered, where they show the chosen value and read as a
   * record. An older unanswered row just goes away: it was a duplicate of the
   * one below it.
   */
  // A reverse scan rather than `findLast`, which needs a lib target this app
  // does not set.
  //
  // `options` counts as offering chips: a turn that wrote its own one-tap
  // answers is asking a question just as much as one that named a field with
  // presets, and the same "only the newest unanswered row stays live" rule has
  // to apply to it or two questions end up live at once.
  const liveChipsId = [...visible]
    .reverse()
    .find(
      (message) =>
        (message.chipsFor || (message.options && message.options.length > 0)) &&
        !message.pending,
    )?.id;

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
                {/*
                 * Turn separation. The original shell used a flat `gap-8`, but
                 * its assistant turns also carried a "Moritz" name label above
                 * the bubble (~22rem of label, margin and stack) and set text
                 * at `text-sm leading-relaxed`. v2 dropped the label and reads
                 * at `text-[15px] leading-7`, so a literal 32px lands at only
                 * 1.14x the line height and the turns run together where the
                 * original cleared its own leading by 1.4x.
                 *
                 * Small screens keep the 32px as-is: the panes are stacked into
                 * one scrolling column there and height is the scarce thing.
                 * From `lg` up, where the page splits into chat and brief and
                 * the transcript has its own column, 48px restores the
                 * separation the original actually read with.
                 */}
                <MessageScrollerContent
                  aria-busy={busy}
                  className="gap-8 pb-6 pt-4 lg:gap-12"
                >
                  {visible.map((message) => {
                    const chipsLive =
                      message.id === liveChipsId ||
                      message.chipChoice !== undefined;
                    /*
                     * The model's own options win over the preset lookup.
                     *
                     * Two sources, one row, and the priority is the whole
                     * point. `chipsFor` can only ever offer the answers a field
                     * was *designed* with, so a question the designer did not
                     * anticipate — "is IBM the only other party, or is there a
                     * recruiter you want named?" — had a preset list that did
                     * not fit it, and so had nothing under it at all. Options
                     * are written for the sentence above them.
                     *
                     * Presets stay as the fallback rather than being replaced:
                     * they are the canonical wording for the fields that have
                     * them, and a turn that offers none should still get the
                     * matter-type or urgency row it always did.
                     *
                     * `value` is the label. Clicking sends the label as a
                     * client message either way (`onChooseChip`), so the two
                     * paths are the same action and nothing here needs a
                     * canonical value to be right.
                     */
                    const ownOptions =
                      message.options && message.options.length > 0
                        ? message.options.map((label, index) => ({
                            id: `${message.id}-option-${index}`,
                            label,
                            value: label,
                          }))
                        : undefined;
                    const chips = !chipsLive
                      ? undefined
                      : (ownOptions ??
                        (message.chipsFor
                          ? chipsByField[message.chipsFor]
                          : undefined));

                    return (
                      <ChatMessage
                        key={message.id}
                        role={message.role}
                        messageId={message.id}
                        thinking={
                          Boolean(message.pending) && message.text === ''
                        }
                        {...(message.steps && message.steps.length > 0
                          ? {
                              /*
                               * What was actually done, on the turn that did it
                               * (L1). Replaces the thinking marker rather than
                               * joining it: while the turn waits, the rail's
                               * live row *is* the marker, and afterwards it
                               * folds into one line the client can open.
                               *
                               * Built here rather than inside `ChatMessage`
                               * because that component is shared with two older
                               * intake flows that have no timeline, and it
                               * should stay a layout rather than learning about
                               * this flow's domain.
                               */
                              rail: <WorkRail steps={message.steps} />,
                            }
                          : {})}
                        {...(message.attachments
                          ? {
                              attachments: message.attachments,
                              onOpenAttachment: (attachment) =>
                                onOpenDocument(attachment.name),
                            }
                          : {})}
                        {...(message.aside && !message.pending
                          ? { aside: message.aside }
                          : {})}
                        {...(chips && !message.pending
                          ? {
                              /*
                               * The chips belong to the turn that asked, and
                               * stay there after they are used, with the answer
                               * filled in. Passing them as the turn's footer
                               * puts them inside the message item, where they
                               * pick up the text alignment from the layout and
                               * leave the scroller one anchorable item per turn.
                               */
                              footer: (
                                <SuggestionChips
                                  chips={chips}
                                  {...(message.chipChoice !== undefined
                                    ? { selectedValue: message.chipChoice }
                                    : {})}
                                  onSelect={(chip) =>
                                    onChooseChip(
                                      message.id,
                                      chip.value,
                                      chip.label,
                                    )
                                  }
                                />
                              ),
                            }
                          : {})}
                      >
                        {/*
                         * The wet ink on a reply still arriving (L6).
                         *
                         * Only while the turn is pending. Once it settles the
                         * plain string goes back in, so the last three words
                         * come up to full weight at the moment the reply is
                         * complete — which is the signal that it is finished and
                         * safe to act on, and it costs nothing because the text
                         * itself does not change.
                         */}
                        {message.pending && message.text !== '' ? (
                          <WetInk text={message.text} />
                        ) : (
                          message.text
                        )}
                      </ChatMessage>
                    );
                  })}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </div>
        ) : null}

        {/*
         * What went wrong, and the one thing to do about it (T32).
         *
         * `role="alert"` on the wrapper rather than on the sentence, so a
         * screen reader reads the retry as part of the same announcement: the
         * sentence and the way out are one message. The button only appears for
         * the kinds where pressing it could succeed, which is the whole reason
         * `retryable` travels with the text rather than being guessed here.
         *
         * The client's own words are still in the transcript above this, so a
         * retry costs them nothing and a failure never loses a message. That
         * was the actual defect: an API down for four seconds used to mean
         * retyping the paragraph you had just written.
         */}
        {failure ? (
          <div
            role="alert"
            className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-1"
          >
            <p className="text-destructive min-w-0 flex-1 text-sm">
              {failure.text}
            </p>
            {failure.retryable ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={onRetry}
              >
                {t('retry')}
              </Button>
            ) : null}
          </div>
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
            {...(onEdit ? { onEdit } : {})}
            /*
             * The page owns the drag, not the composer.
             *
             * There are two targets here at two scales and there used to be two
             * highlights to go with them: the composer lit up when the file
             * crossed the textarea, the page's wash lit up everywhere else, and
             * one drag across the screen therefore changed shape under the
             * cursor. The page-wide one is the one kept — it is true everywhere
             * the file can be let go, which is the whole of Decision 9, where
             * the composer's version is only true over one element. The drop
             * still lands in the same place either way (`use-window-drop.ts`).
             */
            dropTarget={false}
            attachments={attachments}
            onOpenAttachment={(attachment) => onOpenDocument(attachment.name)}
            onRemoveAttachment={onRemoveAttachment}
            attachmentsEnableSend={attachmentsCanSend}
          />
          {beneathComposer}
        </div>
      </div>
    </MessageScrollerProvider>
  );
}
