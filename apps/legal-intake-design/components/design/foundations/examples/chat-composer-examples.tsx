'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { FileText } from '@repo/ui/icons';

import {
  ChatComposer,
  type ComposerAttachment,
} from '@/components/design/intake/chat/chat-composer';

/**
 * Interactive composer demos used by the foundation showcase page. The
 * ChatComposer is a client component with required onSend/onAttach handlers, so
 * these wrappers live in a client module while the showcase page stays a server
 * component.
 */

export function BasicComposerExample() {
  return (
    <div className="w-full max-w-xl">
      <ChatComposer
        onSend={(text) => toast.success(`Sent: ${text}`)}
        onAttach={(files) =>
          files.forEach((file) => toast.success(`Attached ${file.name}`))
        }
      />
    </div>
  );
}

export function PlaceholderComposerExample() {
  return (
    <div className="w-full max-w-xl">
      <ChatComposer
        placeholder="Message the Moritz support team…"
        onSend={(text) => toast.success(`Sent: ${text}`)}
        onAttach={(files) =>
          files.forEach((file) => toast.success(`Attached ${file.name}`))
        }
      />
    </div>
  );
}

export function VoiceComposerExample() {
  return (
    <div className="w-full max-w-xl">
      <ChatComposer
        onSend={(text) => toast.success(`Sent: ${text}`)}
        onAttach={(files) =>
          files.forEach((file) => toast.success(`Attached ${file.name}`))
        }
      />
    </div>
  );
}

export function DisabledComposerExample() {
  return (
    <div className="w-full max-w-xl">
      <ChatComposer
        disabled
        placeholder="Composer is disabled"
        onSend={() => undefined}
        onAttach={() => undefined}
      />
    </div>
  );
}

/** Derive an Attachment-style meta line ("PDF · 88 KB") from a picked file. */
function formatFileMeta(file: File) {
  const ext = file.name.split('.').pop()?.toUpperCase();
  const kb = file.size / 1024;
  const size =
    kb >= 1024
      ? `${(kb / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(kb))} KB`;
  return ext ? `${ext} · ${size}` : size;
}

export function AttachmentsComposerExample() {
  const [attachments, setAttachments] = useState<ComposerAttachment[]>(() => [
    {
      id: 'a_workspace',
      name: 'workspace.png',
      meta: 'PNG · 820 KB',
      previewUrl:
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'a_briefing',
      name: 'briefing-notes.pdf',
      meta: 'PDF · 1.4 MB',
      icon: FileText,
      state: 'done',
    },
    {
      id: 'a_engagement',
      name: 'engagement-letter.docx',
      meta: 'Uploading · 64%',
      icon: FileText,
      state: 'uploading',
    },
  ]);

  // Let the seeded upload finish so the uploading → done transition is visible.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === 'a_engagement'
            ? { ...attachment, state: 'done', meta: 'DOCX · 88 KB' }
            : attachment,
        ),
      );
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  const handleAttach = (files: File[]) => {
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => {
        const isImage = file.type.startsWith('image/');
        return {
          id: `a_${Date.now()}_${file.name}`,
          name: file.name,
          meta: formatFileMeta(file),
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          icon: isImage ? undefined : FileText,
          state: 'done' as const,
        };
      }),
    ]);
  };

  const handleRemove = (id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((attachment) => attachment.id === id);
      if (removed?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((attachment) => attachment.id !== id);
    });
  };

  return (
    <div className="w-full max-w-xl">
      <ChatComposer
        placeholder="Add a message or attach files…"
        attachments={attachments}
        onAttach={handleAttach}
        onRemoveAttachment={handleRemove}
        onSend={(text) => {
          const count = attachments.length;
          toast.success(
            `Sent${text ? `: ${text}` : ''} with ${count} attachment${count === 1 ? '' : 's'}.`,
          );
          setAttachments((prev) => {
            prev.forEach((attachment) => {
              if (attachment.previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.previewUrl);
              }
            });
            return [];
          });
        }}
      />
    </div>
  );
}

type DemoMessage = { id: string; body: string };

export function ConversationComposerExample() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);

  return (
    <div className="bg-muted/30 flex h-80 w-full max-w-xl flex-col rounded-2xl border">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
            Send a message to see it appear here.
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex justify-end">
              <div className="bg-foreground text-background max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                {message.body}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-3">
        <ChatComposer
          placeholder="Type a message…"
          onSend={(text) =>
            setMessages((prev) => [
              ...prev,
              { id: `m_${Date.now()}`, body: text },
            ])
          }
          onAttach={(files) =>
            files.forEach((file) => toast.success(`Attached ${file.name}`))
          }
        />
      </div>
    </div>
  );
}
