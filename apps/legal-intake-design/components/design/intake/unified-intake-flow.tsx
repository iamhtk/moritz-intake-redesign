'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowRight } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { Card } from '@/components/design/design-system/card';
import { Text } from '@/components/design/foundations/components/text';
import { ChatComposer } from './chat/chat-composer';
import { ChatMessage } from './chat/chat-message';
import { TypingIndicator } from './chat/typing-indicator';
import { classifyMatterAsync } from './classify-matter';
import { IntakeChatShell } from './components/intake-chat-shell';
import { IntakeFlow } from './intake-flow';
import {
  MATTER_PICKER_CARDS,
  MATTER_REGISTRY,
  type MatterId,
} from './matter-registry';

type RouterMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const GREETING =
  "Hi — I'm Moritz. Tell me what you need help with, in your own words, and I'll take it from there. Or pick a starting point below.";

const STEPS = [
  'Tell us what you need',
  'Answer a few quick questions',
  'Review & send',
  'Get a quote',
];

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Single entry point for /client/new. The user describes their matter in a
 * chat; we classify which of the five matter flows it belongs to (OpenAI when
 * configured, deterministic keywords otherwise) and hand off to `IntakeFlow`
 * with the message pre-parsed. When classification is unsure, the five
 * matter-type cards act as a quick-pick fallback. Picking a card directly also
 * routes straight in.
 */
export function UnifiedIntakeFlow() {
  const [matterId, setMatterId] = useState<MatterId | null>(null);
  const [seedText, setSeedText] = useState<string | null>(null);
  const [messages, setMessages] = useState<RouterMessage[]>([
    { id: 'greet', role: 'assistant', text: GREETING },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const lastTextRef = useRef<string | null>(null);

  const route = useCallback((id: MatterId, seed: string | null) => {
    setSeedText(seed && seed.trim().length > 0 ? seed : null);
    setMatterId(id);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (isThinking) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      lastTextRef.current = trimmed;
      setMessages((current) => [
        ...current,
        { id: makeId(), role: 'user', text: trimmed },
      ]);
      setIsThinking(true);
      const id = await classifyMatterAsync(trimmed);
      setIsThinking(false);
      if (id) {
        route(id, trimmed);
        return;
      }
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          text: 'I want to make sure this goes to the right place — which of these is closest?',
        },
      ]);
    },
    [isThinking, route],
  );

  const handlePick = useCallback(
    (id: MatterId) => {
      route(id, lastTextRef.current);
    },
    [route],
  );

  if (matterId) {
    return (
      <IntakeFlow
        definition={MATTER_REGISTRY[matterId]}
        seedText={seedText ?? undefined}
      />
    );
  }

  return (
    <IntakeChatShell
      title="New matter"
      panel={
        <div className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold">
            How this works
          </h3>
          <ol className="space-y-2">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="text-muted-foreground flex items-start gap-2.5 text-sm"
              >
                <span className="border-input text-muted-foreground mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {index + 1}
                </span>
                <span className="leading-5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      }
      footer={
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MATTER_PICKER_CARDS.map((matter) => {
              const Icon = matter.icon;
              return (
                <button
                  key={matter.key}
                  type="button"
                  onClick={() => handlePick(matter.id)}
                  className="block text-left"
                >
                  <Card
                    className={cn(
                      'h-full gap-2 px-4 py-3 shadow-none transition-colors',
                      'hover:border-foreground/30 hover:bg-muted/40 cursor-pointer',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="bg-muted text-foreground border-border group-hover/card:bg-background mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors">
                        <Icon
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.75}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-base leading-tight tracking-tight">
                          {matter.label}
                        </span>
                        <Text className="mt-0.5 text-balance text-xs leading-snug">
                          {matter.blurb}
                        </Text>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover/card:translate-x-0.5"
                        strokeWidth={1.75}
                      />
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
          <ChatComposer
            disabled={isThinking}
            placeholder="Describe your situation, or pick a starting point above…"
            onSend={handleSend}
          />
        </>
      }
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          messageId={message.id}
          role={message.role}
        >
          {message.text}
        </ChatMessage>
      ))}
      {isThinking ? <TypingIndicator /> : null}
    </IntakeChatShell>
  );
}
