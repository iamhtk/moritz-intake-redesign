'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';

import { ArrowUp, MessageCircleDashed, RotateCw } from '@repo/ui/icons';

import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import { Button } from '@/components/design/foundations/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/design/foundations/components/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/design/foundations/components/hover-card';
import {
  Marker,
  MarkerContent,
} from '@/components/design/foundations/components/marker';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@/components/design/foundations/components/message-scroller';
import { Slider } from '@/components/design/foundations/components/slider';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/design/foundations/components/toggle-group';

/**
 * Message Scroller demos for the foundation showcase page. The scroll behavior
 * comes from `@shadcn/react`; the streaming chat here is a local scripted
 * simulator (no AI SDK / backend wiring), and messages render with the
 * foundation Bubble/Marker primitives.
 */

type Role = 'user' | 'assistant';
type ScriptMessage = { role: Role; text: string };
type ChatMessage = { id: string; role: Role; text: string };

const streamingScript: ScriptMessage[] = [
  {
    role: 'user',
    text: "I'm building a chat for our app and the scroll behavior is driving me nuts. Every time the AI streams a reply, the whole thread jumps around.",
  },
  {
    role: 'assistant',
    text: "That's the classic streaming scroll problem. Wrap your message list in MessageScroller and turn on autoScroll — the viewport pins to the bottom as tokens arrive, so users always see the latest text land in place.\n\nThe important part: it only auto-scrolls while the reader is already at the bottom. The moment they scroll up to read something earlier, auto-scroll backs off and their position is preserved.",
  },
  {
    role: 'user',
    text: 'Okay, but when someone sends a new message the view still feels jarring — like the whole conversation reloads from the top.',
  },
  {
    role: 'assistant',
    text: "MessageScrollerItem fixes that with turn anchoring. Set scrollAnchor on the turn that should settle near the top instead of blindly snapping to the document bottom.\n\nIt also leaves a small peek of the previous exchange visible above the anchor, so context isn't lost.",
  },
  {
    role: 'user',
    text: "And if they've scrolled up to re-read an older answer? I don't want to yank them back down.",
  },
  {
    role: 'assistant',
    text: "You won't. Auto-scroll only runs when the viewport is already pinned to the bottom, so scrolling up is a deliberate opt-out — their place in the thread stays put even as new tokens keep arriving below.\n\nWhen there is content they haven't seen yet, the scroll button appears. One tap jumps them back to the newest message and re-engages auto-scroll.",
  },
  {
    role: 'user',
    text: 'Last one — does this work with assistive tech?',
  },
  {
    role: 'assistant',
    text: 'MessageScrollerContent sets role="log" and aria-relevant="additions" by default, so screen readers announce new messages as they stream in.\n\nThe scroll button is a real button with an sr-only label, and it is removed from the tab order when you are already at the bottom.',
  },
];

function useScriptedChat({
  script,
  initialCount = 0,
  chunkDelayMs = 24,
}: {
  script: ScriptMessage[];
  initialCount?: number;
  chunkDelayMs?: number;
}) {
  const buildInitial = React.useCallback(
    () =>
      script
        .slice(0, initialCount)
        .map((message, index) => ({ id: `m-${index}`, ...message })),
    [script, initialCount],
  );

  const [messages, setMessages] = React.useState<ChatMessage[]>(buildInitial);
  const [cursor, setCursor] = React.useState(initialCount);
  const [streaming, setStreaming] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    },
    [],
  );

  const next = cursor < script.length ? script[cursor] : null;
  const nextPreview = next && next.role === 'user' ? next.text : null;

  const send = React.useCallback(() => {
    if (streaming) {
      return;
    }

    const userMessage = script[cursor];
    if (!userMessage || userMessage.role !== 'user') {
      return;
    }

    const userId = `m-${cursor}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', text: userMessage.text },
    ]);

    const assistant = script[cursor + 1];
    if (!assistant || assistant.role !== 'assistant') {
      setCursor((value) => value + 1);
      return;
    }

    const assistantId = `m-${cursor + 1}`;
    const words = assistant.text.split(/(\s+)/);
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', text: '' },
    ]);
    setStreaming(true);

    let index = 0;
    timerRef.current = window.setInterval(() => {
      index += 1;
      const partial = words.slice(0, index).join('');
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, text: partial } : message,
        ),
      );

      if (index >= words.length) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setStreaming(false);
        setCursor((value) => value + 2);
      }
    }, chunkDelayMs);
  }, [chunkDelayMs, cursor, script, streaming]);

  const reset = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreaming(false);
    setMessages(buildInitial());
    setCursor(initialCount);
  }, [buildInitial, initialCount]);

  return { messages, send, reset, nextPreview, isBusy: streaming } as const;
}

function renderParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="whitespace-pre-wrap">
        {paragraph}
      </p>
    ));
}

function ChatRow({
  message,
  scrollAnchor,
  userVariant = 'muted',
  assistantVariant = 'ghost',
}: {
  message: ChatMessage;
  scrollAnchor?: boolean;
  userVariant?: React.ComponentProps<typeof Bubble>['variant'];
  assistantVariant?: React.ComponentProps<typeof Bubble>['variant'];
}) {
  const isUser = message.role === 'user';

  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={scrollAnchor ?? isUser}
    >
      <Bubble
        variant={isUser ? userVariant : assistantVariant}
        align={isUser ? 'end' : 'start'}
      >
        <BubbleContent className="space-y-2">
          {renderParagraphs(message.text)}
        </BubbleContent>
      </Bubble>
    </MessageScrollerItem>
  );
}

/** Shared card-like frame for the demos. */
function DemoChat({
  title,
  description,
  action,
  children,
  footer,
  caption,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="bg-card flex h-[34rem] flex-col overflow-hidden rounded-2xl border shadow">
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        <div className="min-h-0 flex-1">{children}</div>
        {footer ? <div className="border-t p-3">{footer}</div> : null}
      </div>
      {caption ? (
        <p className="text-muted-foreground text-balance text-center text-xs">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function SendComposer({
  preview,
  onSend,
  disabled,
}: {
  preview: string | null;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }
        onSend();
      }}
    >
      <div className="bg-background min-h-12 flex-1 rounded-lg border px-3 py-2 text-sm">
        {preview ? (
          <span className="line-clamp-2">{preview}</span>
        ) : (
          <span className="text-muted-foreground">
            No messages queued. Reset the conversation.
          </span>
        )}
      </div>
      <Button
        type="submit"
        size="icon"
        className="rounded-full"
        disabled={disabled}
      >
        <ArrowUp aria-hidden="true" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}

function ResetButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Reset conversation"
      onClick={onClick}
      disabled={disabled}
    >
      <RotateCw aria-hidden="true" />
    </Button>
  );
}

function EmptyChat({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleDashed aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function MessageScrollerDemo() {
  const { messages, send, reset, nextPreview, isBusy } = useScriptedChat({
    script: streamingScript,
  });

  return (
    <MessageScrollerProvider autoScroll>
      <DemoChat
        title="New Chat"
        description="How can I help you today?"
        action={
          <ResetButton
            onClick={reset}
            disabled={messages.length === 0 || isBusy}
          />
        }
        footer={
          <SendComposer
            preview={nextPreview}
            onSend={send}
            disabled={!nextPreview || isBusy}
          />
        }
        caption="Demo is read only. Press send to send messages."
      >
        {messages.length === 0 ? (
          <EmptyChat
            title="Morning!"
            description="Press send to start a new conversation."
          />
        ) : (
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent aria-busy={isBusy} className="p-4">
                {messages.map((message) => (
                  <ChatRow key={message.id} message={message} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        )}
      </DemoChat>
    </MessageScrollerProvider>
  );
}

export function MessageScrollerStreamingExample() {
  const { messages, send, reset, nextPreview, isBusy } = useScriptedChat({
    script: streamingScript,
    chunkDelayMs: 18,
  });

  return (
    <MessageScrollerProvider autoScroll>
      <DemoChat
        title="Streaming Messages"
        description="Auto-scroll follows the live edge of the conversation."
        action={
          <ResetButton
            onClick={reset}
            disabled={messages.length === 0 || isBusy}
          />
        }
        footer={
          <SendComposer
            preview={nextPreview}
            onSend={send}
            disabled={!nextPreview || isBusy}
          />
        }
        caption="Streaming is simulated. autoScroll is enabled — scroll up while it streams to release the view."
      >
        {messages.length === 0 ? (
          <EmptyChat
            title="Ready to Stream"
            description="Press send to stream a scripted reply."
          />
        ) : (
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent aria-busy={isBusy} className="p-4">
                {messages.map((message) => (
                  <ChatRow key={message.id} message={message} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        )}
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const anchoringScript: ChatMessage[] = [
  {
    id: 'anchor-1-user',
    role: 'user',
    text: 'Can you show me how anchoring behaves when a new prompt starts the turn?',
  },
  {
    id: 'anchor-1-assistant',
    role: 'assistant',
    text: 'Append the user prompt first, then append the assistant response. With User selected, the prompt settles near the top and the assistant response fills in below it.',
  },
  {
    id: 'anchor-2-user',
    role: 'user',
    text: 'What changes when assistant messages are the anchor?',
  },
  {
    id: 'anchor-2-assistant',
    role: 'assistant',
    text: 'Now each assistant response is the item the scroller keeps in view. This is useful when the reply is the moment you want readers to land on after each turn.',
  },
  {
    id: 'anchor-3-user',
    role: 'user',
    text: 'Can I switch roles and keep adding turns?',
  },
  {
    id: 'anchor-3-assistant',
    role: 'assistant',
    text: 'Yes. The next appended message with the selected role becomes the anchor, so you can compare user and assistant anchoring without resetting the demo.',
  },
];

export function MessageScrollerAnchoringExample() {
  const [anchorRole, setAnchorRole] = React.useState<Role>('user');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [index, setIndex] = React.useState(0);
  const nextMessage = anchoringScript[index];

  const reset = () => {
    setMessages([]);
    setIndex(0);
  };

  return (
    <MessageScrollerProvider>
      <DemoChat
        title="Anchoring Turns"
        description="Choose which role settles near the top edge."
        action={
          <ResetButton onClick={reset} disabled={messages.length === 0} />
        }
        footer={
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              aria-label="Select scroll anchor role"
              value={anchorRole}
              onValueChange={(value) => {
                if (value === 'user' || value === 'assistant') {
                  setAnchorRole(value);
                  reset();
                }
              }}
            >
              <ToggleGroupItem value="user">User</ToggleGroupItem>
              <ToggleGroupItem value="assistant">Assistant</ToggleGroupItem>
            </ToggleGroup>
            <Button
              type="button"
              size="icon"
              className="ml-auto rounded-full"
              disabled={!nextMessage}
              onClick={() => {
                if (!nextMessage) {
                  return;
                }
                setMessages((prev) => [...prev, nextMessage]);
                setIndex((value) => value + 1);
              }}
            >
              <ArrowUp aria-hidden="true" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        }
        caption="Toggle the anchor role, then send messages to compare where turns settle."
      >
        {messages.length === 0 ? (
          <EmptyChat
            title="No anchored messages yet"
            description="Send the first message to see the selected role anchor."
          />
        ) : (
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent className="p-4">
                {messages.map((message) => (
                  <ChatRow
                    key={message.id}
                    message={message}
                    scrollAnchor={message.role === anchorRole}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        )}
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const DEFAULT_PEEK = 64;

export function MessageScrollerPeekExample() {
  const [peek, setPeek] = React.useState(DEFAULT_PEEK);
  const { messages, send, reset, nextPreview, isBusy } = useScriptedChat({
    script: streamingScript,
    initialCount: 2,
    chunkDelayMs: 30,
  });

  const handleReset = () => {
    reset();
    setPeek(DEFAULT_PEEK);
  };

  return (
    <MessageScrollerProvider scrollMargin={24} scrollPreviousItemPeek={peek}>
      <DemoChat
        title="Keeping Context Visible"
        description="New turns keep part of the previous reply in view."
        action={<ResetButton onClick={handleReset} disabled={isBusy} />}
        footer={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-12 shrink-0 text-xs tabular-nums">
                {peek}px
              </span>
              <Slider
                aria-label="Previous context peek"
                value={[peek]}
                min={64}
                max={128}
                step={1}
                disabled={isBusy}
                onValueChange={(value) => setPeek(value[0] ?? DEFAULT_PEEK)}
              />
            </div>
            <SendComposer
              preview={nextPreview}
              onSend={send}
              disabled={!nextPreview || isBusy}
            />
          </div>
        }
        caption="Adjust the slider and send. Observe the previous-message peek above the new turn."
      >
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent aria-busy={isBusy} className="p-4">
              {messages.map((message) => (
                <ChatRow key={message.id} message={message} />
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const openingMessages: ChatMessage[] = [
  {
    id: 'open-1',
    role: 'user',
    text: 'This is the first message the user sent in the conversation.',
  },
  {
    id: 'open-2',
    role: 'assistant',
    text: 'Workspace creation rose 8%, but first invite completion only rose 2%.',
  },
  {
    id: 'open-3',
    role: 'user',
    text: 'This is the last message the user sent in the conversation.',
  },
  {
    id: 'open-4',
    role: 'assistant',
    text: 'Start with the invite step. Teams are creating workspaces but waiting to add collaborators.\n\nRecommended follow-up:\n\n1. Compare invite drop-off by account size.\n2. Check whether users who skip invites still return within 24 hours.\n3. Review the empty-state copy on the first project screen.\n4. Segment activation by template, since template users may not need invites right away.',
  },
];

type OpeningPosition = 'start' | 'end' | 'last-anchor';

function OpeningPositionScroller({
  position,
  positionKey,
}: {
  position: OpeningPosition;
  positionKey: number;
}) {
  const { scrollToEnd, scrollToMessage, scrollToStart } = useMessageScroller();

  React.useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (position === 'start') {
        scrollToStart({ behavior: 'auto' });
        return;
      }
      if (position === 'end') {
        scrollToEnd({ behavior: 'auto' });
        return;
      }
      scrollToMessage('open-3', {
        align: 'start',
        behavior: 'auto',
        scrollMargin: 64,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [position, positionKey, scrollToEnd, scrollToMessage, scrollToStart]);

  return (
    <MessageScroller>
      <MessageScrollerViewport>
        <MessageScrollerContent className="p-4">
          {openingMessages.map((message) => (
            <ChatRow key={message.id} message={message} />
          ))}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

export function MessageScrollerOpeningPositionExample() {
  const [position, setPosition] =
    React.useState<OpeningPosition>('last-anchor');
  const [positionKey, setPositionKey] = React.useState(0);

  return (
    <MessageScrollerProvider>
      <DemoChat
        title="Opening Position"
        description="Choose where a saved transcript opens."
        footer={
          <Tabs
            value={position}
            onValueChange={(value) => {
              if (
                value === 'start' ||
                value === 'end' ||
                value === 'last-anchor'
              ) {
                setPosition(value);
                setPositionKey((key) => key + 1);
              }
            }}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger value="start">start</TabsTrigger>
              <TabsTrigger value="end">end</TabsTrigger>
              <TabsTrigger value="last-anchor">last-anchor</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        caption="Toggle the opening position to see where the transcript starts when you open the thread."
      >
        <OpeningPositionScroller
          position={position}
          positionKey={positionKey}
        />
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const historyScript: ScriptMessage[] = [
  { role: 'user', text: 'Can you summarize the incident channel?' },
  {
    role: 'assistant',
    text: 'The first alert was a delayed export job. It started backing up around 09:42 UTC and triggered the warning once the retry queue crossed the threshold.\n\nNo customer-facing checkout paths were affected.',
  },
  { role: 'user', text: 'Was checkout affected?' },
  {
    role: 'assistant',
    text: 'No checkout errors were reported. Payment authorization, order creation, and confirmation emails stayed inside their normal latency bands.',
  },
  { role: 'user', text: 'What changed in the last deploy?' },
  {
    role: 'assistant',
    text: 'Only the export queue worker changed. The deploy moved large CSV jobs onto the shared retry policy, which made each failed attempt hold a worker slot longer than before.',
  },
  { role: 'user', text: 'Do we need to roll back?' },
  {
    role: 'assistant',
    text: 'Not yet. Queue depth is recovering after we reduced retry concurrency, and the oldest pending job is now under five minutes old.',
  },
];

const fullHistory: ChatMessage[] = historyScript.map((message, index) => ({
  id: `history-${index}`,
  ...message,
}));
const INITIAL_VISIBLE_COUNT = 4;

export function MessageScrollerLoadHistoryExample() {
  const [demoKey, setDemoKey] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_COUNT);
  const visibleMessages = fullHistory.slice(-visibleCount);
  const canLoadHistory = visibleCount < fullHistory.length;

  return (
    <MessageScrollerProvider>
      <DemoChat
        title="Load History"
        description="Prepended messages keep your place."
        action={
          <ResetButton
            onClick={() => {
              setVisibleCount(INITIAL_VISIBLE_COUNT);
              setDemoKey((key) => key + 1);
            }}
            disabled={visibleCount === INITIAL_VISIBLE_COUNT}
          />
        }
        footer={
          <div className="flex flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!canLoadHistory}
              onClick={() => {
                setVisibleCount(fullHistory.length);
                toast('History loaded', {
                  description: 'Scroll up to see earlier messages.',
                });
              }}
            >
              {canLoadHistory ? 'Load History' : 'History Loaded'}
            </Button>
            <p className="text-muted-foreground text-xs">
              Restore earlier messages while keeping your place.
            </p>
          </div>
        }
        caption="Click Load History to prepend the earlier messages."
      >
        <MessageScroller key={demoKey}>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {visibleMessages.map((message) => (
                <ChatRow
                  key={message.id}
                  message={message}
                  scrollAnchor={false}
                />
              ))}
              <MessageScrollerItem scrollAnchor={false}>
                <Marker variant="separator">
                  <MarkerContent>End of Conversation</MarkerContent>
                </Marker>
              </MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const commandMessages: ChatMessage[] = [
  {
    id: 'command-activation',
    role: 'user',
    text: "We're seeing activation dip after workspace creation. Can you help me find the likely step?",
  },
  {
    id: 'command-activation-reply',
    role: 'assistant',
    text: 'The sharpest drop is between creating the workspace and inviting the first teammate.\n\nWorkspace creation is still healthy, but the invite step is where users pause.',
  },
  {
    id: 'command-compare',
    role: 'user',
    text: 'What should I compare before we change the onboarding flow?',
  },
  {
    id: 'command-compare-reply',
    role: 'assistant',
    text: 'Compare three cohorts:\n\n1. Users who choose a template before inviting teammates.\n2. Users who start from a blank workspace.\n3. Users who skip invites and return within 24 hours.',
  },
  {
    id: 'command-experiment',
    role: 'user',
    text: 'Can you turn that into an experiment?',
  },
  {
    id: 'command-experiment-reply',
    role: 'assistant',
    text: 'Yes. Create a variant that shows a short checklist after workspace creation, then measure first invite completion and 24-hour return rate.',
  },
  {
    id: 'command-risk',
    role: 'user',
    text: "What's the risk if we delay the invite prompt?",
  },
  {
    id: 'command-risk-reply',
    role: 'assistant',
    text: 'The main risk is reducing team creation for accounts that already know who they want to invite. Keep the invite action visible in the header to protect that path.',
  },
];

const commandUserMessages = commandMessages.filter(
  (message) => message.role === 'user',
);

function trimText(text: string) {
  return text.length > 42 ? `${text.slice(0, 39)}...` : text;
}

function CommandMenu() {
  const { scrollToMessage } = useMessageScroller();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          Jump to…
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-64">
        <DropdownMenuLabel>Conversations</DropdownMenuLabel>
        {commandUserMessages.map((message) => (
          <DropdownMenuItem
            key={message.id}
            onSelect={() =>
              scrollToMessage(message.id, {
                align: 'start',
                behavior: 'smooth',
              })
            }
          >
            <span className="line-clamp-1 min-w-0">
              {trimText(message.text)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MessageScrollerCommandsExample() {
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <DemoChat
        title="Commands"
        description="Drive the transcript from outside."
        action={<CommandMenu />}
        caption="Use the menu to jump to any message in the conversation."
      >
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {commandMessages.map((message) => (
                <ChatRow key={message.id} message={message} />
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </DemoChat>
    </MessageScrollerProvider>
  );
}

function TranscriptOutline() {
  const { scrollToMessage } = useMessageScroller();
  const { currentAnchorId } = useMessageScrollerVisibility();

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label="Open transcript outline"
          className="focus-visible:ring-ring/50 flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-md outline-none focus-visible:ring-[3px]"
        >
          {commandUserMessages.map((message) => (
            <span
              key={message.id}
              data-current={message.id === currentAnchorId}
              className="bg-muted-foreground/40 data-[current=true]:bg-foreground h-0.5 w-4 rounded-full transition-colors"
            />
          ))}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        side="left"
        className="flex w-64 flex-col gap-1 p-1"
      >
        {commandUserMessages.map((message) => (
          <button
            key={message.id}
            type="button"
            aria-current={
              currentAnchorId === message.id ? 'location' : undefined
            }
            className="hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent aria-current:bg-accent aria-current:text-accent-foreground flex min-h-7 items-center rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors"
            onClick={() =>
              scrollToMessage(message.id, {
                align: 'start',
                behavior: 'smooth',
              })
            }
          >
            <span className="line-clamp-1 min-w-0">
              {trimText(message.text)}
            </span>
          </button>
        ))}
      </HoverCardContent>
    </HoverCard>
  );
}

export function MessageScrollerVisibilityExample() {
  return (
    <MessageScrollerProvider scrollMargin={12}>
      <DemoChat
        title="Transcript Outline"
        description="Track the current anchored turn."
        action={<TranscriptOutline />}
        caption="Open the outline to jump between anchored turns as you read."
      >
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {commandMessages.map((message) => (
                <ChatRow key={message.id} message={message} />
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const scrollableMessages: ChatMessage[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `scrollable-${index + 1}`,
    role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
    text:
      index % 2 === 0
        ? `Review scroll checkpoint ${index + 1}.`
        : `Checkpoint ${index + 1} is synced. The scrollable hook updates as the viewport moves.\n\nWhen the reader is at the first message, the footer should only point them down. Once they move into the middle, both directions are available.`,
  }),
);

function ScrollStateFooter() {
  const { start, end } = useMessageScrollerScrollable();

  let status: string;
  if (start && end) {
    status = 'You can scroll both ways.';
  } else if (end) {
    status = 'You are at the top. You can only scroll down.';
  } else if (start) {
    status = 'You are at the bottom. You can only scroll up.';
  } else {
    status = 'All messages fit in the viewport.';
  }

  return <p className="text-muted-foreground text-center text-sm">{status}</p>;
}

export function MessageScrollerScrollableExample() {
  return (
    <MessageScrollerProvider defaultScrollPosition="start">
      <DemoChat
        title="Scroll Status"
        description="Where the reader can scroll based on the current position."
        footer={<ScrollStateFooter />}
        caption="Scroll the transcript to see the footer update."
      >
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {scrollableMessages.map((message) => (
                <ChatRow key={message.id} message={message} />
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </DemoChat>
    </MessageScrollerProvider>
  );
}

const animationScript: ScriptMessage[] = [
  {
    role: 'user',
    text: 'Can user messages pop in like iMessage without breaking anchoring?',
  },
  {
    role: 'assistant',
    text: 'Yes. Animate the user row with transform and opacity, and let the assistant response stream normally below it.\n\nThat keeps the row measurement predictable while still giving the newly sent bubble a more tactile entrance.',
  },
  {
    role: 'user',
    text: 'What makes the animation feel more like iMessage?',
  },
  {
    role: 'assistant',
    text: 'Use a quick spring from the trailing edge: a little scale, a small upward move, and no layout animation.',
  },
];

type AnimationPreset = 'fade' | 'pop' | 'tilt';

const animationPresets: Record<
  AnimationPreset,
  { label: string; initial: Record<string, number> }
> = {
  fade: { label: 'Fade', initial: { opacity: 0 } },
  pop: { label: 'Pop', initial: { opacity: 0, y: 12, scale: 0.96 } },
  tilt: { label: 'Tilt', initial: { opacity: 0, y: 16, rotate: -2 } },
};

function AnimatedChatRow({
  message,
  preset,
}: {
  message: ChatMessage;
  preset: AnimationPreset;
}) {
  const reduceMotion = useReducedMotion();
  const isUser = message.role === 'user';

  if (!isUser) {
    return <ChatRow message={message} />;
  }

  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor>
      <motion.div
        initial={reduceMotion ? false : animationPresets[preset].initial}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="flex justify-end"
      >
        <Bubble variant="muted" align="end">
          <BubbleContent className="space-y-2">
            {renderParagraphs(message.text)}
          </BubbleContent>
        </Bubble>
      </motion.div>
    </MessageScrollerItem>
  );
}

export function MessageScrollerAnimationExample() {
  const [preset, setPreset] = React.useState<AnimationPreset>('pop');
  const { messages, send, reset, nextPreview, isBusy } = useScriptedChat({
    script: animationScript,
    chunkDelayMs: 16,
  });

  return (
    <MessageScrollerProvider>
      <DemoChat
        title="Animation"
        description="Choose how user messages animate in."
        action={
          <ResetButton
            onClick={reset}
            disabled={messages.length === 0 || isBusy}
          />
        }
        footer={
          <div className="flex flex-col gap-2">
            <ToggleGroup
              type="single"
              aria-label="Animation preset"
              value={preset}
              onValueChange={(value) => {
                if (value === 'fade' || value === 'pop' || value === 'tilt') {
                  setPreset(value);
                }
              }}
            >
              {(Object.keys(animationPresets) as AnimationPreset[]).map(
                (key) => (
                  <ToggleGroupItem key={key} value={key}>
                    {animationPresets[key].label}
                  </ToggleGroupItem>
                ),
              )}
            </ToggleGroup>
            <SendComposer
              preview={nextPreview}
              onSend={send}
              disabled={!nextPreview || isBusy}
            />
          </div>
        }
        caption="Pick a preset, then send to see the entrance. Honors reduced-motion."
      >
        {messages.length === 0 ? (
          <EmptyChat
            title="No Messages Yet"
            description="Press send to add the first message."
          />
        ) : (
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent aria-busy={isBusy} className="p-4">
                {messages.map((message) => (
                  <AnimatedChatRow
                    key={message.id}
                    message={message}
                    preset={preset}
                  />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        )}
      </DemoChat>
    </MessageScrollerProvider>
  );
}
