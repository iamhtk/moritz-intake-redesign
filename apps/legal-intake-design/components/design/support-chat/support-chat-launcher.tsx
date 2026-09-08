'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, X } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

import { CollapsibleMessageText } from '@/components/design/intake/chat/collapsible-message-text';
import { useSupportChat } from '@/components/design/support-chat/support-chat-context';

type SupportMessage = {
  id: string;
  from: 'support' | 'user';
  body: string;
};

const GREETING: SupportMessage = {
  id: 'support-greeting',
  from: 'support',
  body: "Hi there 👋 We're here to help. Ask us anything and the Moritz team will get back to you.",
};

const CANNED_REPLY =
  'Thanks for reaching out! A member of our team will reply here shortly. In the meantime, feel free to add any details about your matter.';

/**
 * Intercom brand mark, used as the launcher icon so the floating support
 * button reads as a familiar chat-support widget. Playground-only and mocked —
 * no real conversation is sent anywhere.
 */
function IntercomIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M21.6 0H2.4A2.4 2.4 0 0 0 0 2.4v19.2A2.4 2.4 0 0 0 2.4 24h19.2a2.4 2.4 0 0 0 2.4-2.4V2.4A2.4 2.4 0 0 0 21.6 0M16 4.8a.8.8 0 0 1 1.6 0v9.244a.8.8 0 0 1-1.6 0Zm-4-.267a.8.8 0 0 1 1.6 0v10a.8.8 0 0 1-1.6 0Zm-4 .267a.8.8 0 0 1 1.6 0v9.244a.8.8 0 0 1-1.6 0M4.4 6.418a.8.8 0 0 1 1.6 0v5.994a.8.8 0 0 1-1.6 0zm14.792 10.641c-.12.102-3.007 2.508-7.192 2.508s-7.072-2.406-7.192-2.508a.8.8 0 0 1 1.04-1.216c.037.03 2.759 2.324 6.152 2.324s6.115-2.294 6.152-2.324a.8.8 0 1 1 1.04 1.216" />
    </svg>
  );
}

export function SupportChatLauncher() {
  const { open, openChat, closeChat } = useSupportChat();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([GREETING]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [open, messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const userMessage: SupportMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      body: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `support-${Date.now()}`, from: 'support', body: CANNED_REPLY },
      ]);
    }, 900);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="Support chat"
          className="bg-background flex h-[28rem] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-xl"
        >
          <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
            <span className="bg-primary-foreground/15 flex size-8 shrink-0 items-center justify-center rounded-full">
              <IntercomIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Moritz Support
              </p>
              <p className="text-primary-foreground/80 text-xs leading-tight">
                Typically replies in a few minutes
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.from === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    message.from === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {message.from === 'user' ? (
                    <CollapsibleMessageText text={message.body} />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.body}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a message…"
              aria-label="Write a message"
              className="border-field focus-visible:ring-primary min-w-0 flex-1 rounded-full border bg-transparent px-4 py-2 text-sm outline-none focus-visible:ring-2"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!draft.trim()}
              className="bg-primary text-primary-foreground focus-visible:outline-ring flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? closeChat() : openChat())}
        aria-expanded={open}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        className={cn(
          'bg-primary text-primary-foreground focus-visible:outline-ring size-14 items-center justify-center rounded-full shadow-lg outline-none transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex',
          // On mobile the floating launcher is hidden; the chat is opened from
          // the avatar dropdown. Once open, show the button so it can be closed.
          open ? 'flex' : 'hidden',
        )}
      >
        {open ? <X className="size-6" /> : <IntercomIcon className="size-7" />}
      </button>
    </div>
  );
}
