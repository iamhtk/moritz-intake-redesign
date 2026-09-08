'use client';

import { useState } from 'react';
import { Button } from '@/components/design/design-system/button';
import { CollapsibleMessageText } from '@/components/design/intake/chat/collapsible-message-text';
import { Textarea } from '@/components/design/design-system/textarea';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Send, Maximize2, Paperclip } from '@repo/ui/icons';
import { FormattedDate } from '@/components/formatted-date';
import { MessageAvatar } from '@/components/messages/message-avatar';
import { Large, Small } from '@/components/design/design-system/typography';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import type { Message } from '@/lib/types';

type Props = {
  caseId: string;
  caseTitle: string;
  messages: Message[];
  currentUserId: string;
  /** Optional extra control rendered in the header (e.g. a panel toggle). */
  headerAction?: ReactNode;
  /** Override the default fixed height (e.g. to fill a flex container). */
  className?: string;
};

export function SidebarChat({
  caseTitle,
  messages,
  currentUserId,
  headerAction,
  className,
}: Props) {
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const next: Message = {
      id: `local_${Date.now()}`,
      caseId: 'local',
      body: draft.trim(),
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: 'You',
        email: '',
        image: null,
        actor: 'client',
        companyName: null,
      },
    };
    setLocalMessages((prev) => [...prev, next]);
    setDraft('');
    toast.success('Message sent (mock).');
  };

  return (
    <div
      className={cn(
        'bg-card flex h-[640px] min-h-0 flex-col rounded-lg border',
        className,
      )}
    >
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-muted-foreground text-xs">Conversation</div>
            <Small asChild className="truncate font-semibold">
              <h3>{caseTitle}</h3>
            </Small>
          </div>
          <div className="flex items-center gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Expand">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <div className="space-y-4">
                  <Large asChild>
                    <h2>{caseTitle}</h2>
                  </Large>
                  <MessageList
                    messages={localMessages}
                    currentUserId={currentUserId}
                  />
                </div>
              </DialogContent>
            </Dialog>
            {headerAction}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <MessageList messages={localMessages} currentUserId={currentUserId} />
      </div>

      <form onSubmit={handleSend} className="border-t px-3 py-3">
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a reply…"
          className="mb-2 resize-none"
        />
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" className="gap-1">
            <Paperclip className="h-4 w-4" /> Attach
          </Button>
          <Button type="submit" size="sm" className="gap-1">
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageList({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="text-muted-foreground py-6 text-center text-sm">
        No messages yet. Your conversation will appear here.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isOwn = message.author.id === currentUserId;
        return (
          <div
            key={message.id}
            className={cn('flex gap-3', isOwn && 'flex-row-reverse text-right')}
          >
            <MessageAvatar participant={message.author} />
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'flex items-baseline gap-2 text-xs',
                  isOwn && 'justify-end',
                )}
              >
                <span className="font-medium">{message.author.name}</span>
                <span className="text-muted-foreground">
                  <FormattedDate
                    date={message.createdAt}
                    options={{ dateStyle: 'short', timeStyle: 'short' }}
                  />
                </span>
              </div>
              <div
                className={cn(
                  'mt-1 inline-block max-w-full rounded-lg border px-3 py-2 text-sm',
                  isOwn ? 'bg-[var(--message-own)]' : 'bg-muted/40',
                )}
              >
                <CollapsibleMessageText text={message.body} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
