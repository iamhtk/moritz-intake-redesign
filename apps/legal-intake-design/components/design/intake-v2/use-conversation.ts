'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Brief } from '@/lib/intake/brief';
import {
  MESSAGES_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from '@/lib/intake/session-storage';
import { readEventStream } from '@/lib/intake/stream-client';
import { extractPartialReply } from '@/lib/intake/turn-schema';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Files sent with a user message. The bytes are never kept here. */
  attachments?: { name: string; size: number }[];
  /** True while the model is still writing this one. */
  pending?: boolean;
  /** Field key this turn asked about, when that field has ready-made answers. */
  chipsFor?: string;
  /** The chip the client picked, which stays shown as the chosen one. */
  chipChoice?: string;
};

/** Matches the window the turn route keeps; sending more would be discarded. */
const TRANSCRIPT_WINDOW = 6;

function newId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStoredMessages(): ChatMessage[] | null {
  const parsed = readStoredJson<unknown>(MESSAGES_STORAGE_KEY);
  if (!Array.isArray(parsed)) return null;
  return parsed.filter(
    (item): item is ChatMessage =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ChatMessage).text === 'string',
  );
}

/**
 * The conversation, and the one thing it is allowed to do to the brief.
 *
 * Reply text is rendered from the stream as it arrives, so the client sees
 * words appear rather than a spinner. Field updates are applied only from the
 * final `done` event, which the server has already validated, partial JSON is
 * for reading, never for changing the case.
 */
export function useConversation({
  brief,
  applyUpdates,
  hydrated,
}: {
  brief: Brief;
  applyUpdates: (updates: readonly unknown[]) => void;
  hydrated: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Field key the last reply asked about, so the UI can offer its chips. */
  const [askingAbout, setAskingAbout] = useState<string>('');

  // The brief changes while a turn is in flight; a ref keeps the request
  // reading the latest one without making `send` a new function every render.
  const briefRef = useRef(brief);
  briefRef.current = brief;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const skipNextWrite = useRef(true);

  useEffect(() => {
    const stored = readStoredMessages();
    if (stored && stored.length > 0) setMessages(stored);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    // Never persist a half-written reply: on the next visit it would look like
    // Moritz stopped mid-sentence.
    writeStoredJson(
      MESSAGES_STORAGE_KEY,
      messages.filter((message) => !message.pending),
    );
  }, [messages, hydrated]);

  const replaceText = useCallback((id: string, text: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, text } : message,
      ),
    );
  }, []);

  const settle = useCallback((id: string, text: string, chipsFor?: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? {
              ...message,
              text,
              pending: false,
              ...(chipsFor ? { chipsFor } : {}),
            }
          : message,
      ),
    );
  }, []);

  /**
   * Record which chip was picked. The chips stay on the message that offered
   * them, with the chosen one filled in and the rest locked, so the transcript
   * still reads as a record of what was asked and answered.
   */
  const chooseChip = useCallback((messageId: string, value: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, chipChoice: value } : message,
      ),
    );
  }, []);

  const send = useCallback(
    async (text: string, attachments?: { name: string; size: number }[]) => {
      const trimmed = text.trim();
      if (trimmed === '' || busy) return;

      setError(null);
      setBusy(true);
      // A new message answers whatever was asked; the old chips go away.
      setAskingAbout('');

      const userMessage: ChatMessage = {
        id: newId(),
        role: 'user',
        text: trimmed,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      };
      const replyId = newId();

      setMessages((current) => [
        ...current,
        userMessage,
        { id: replyId, role: 'assistant', text: '', pending: true },
      ]);

      try {
        const response = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            brief: briefRef.current,
            transcript: messagesRef.current
              .filter((message) => !message.pending && message.text !== '')
              .slice(-TRANSCRIPT_WINDOW)
              .map((message) => ({ role: message.role, text: message.text })),
            message: trimmed,
          }),
        });

        if (!response.ok) {
          throw new Error(`The assistant is unavailable (${response.status}).`);
        }

        let buffer = '';
        let finalReply = '';
        let asked = '';

        for await (const event of readEventStream(response)) {
          if (event.type === 'delta') {
            buffer += event.text;
            const partial = extractPartialReply(buffer);
            if (partial !== null) replaceText(replyId, partial);
            continue;
          }

          if (event.type === 'error') {
            setError(event.message);
            break;
          }

          // done, the only event allowed to change the brief.
          finalReply = event.turn.reply;
          applyUpdates(event.turn.fieldUpdates);
          setAskingAbout(event.turn.askingAbout);
          asked = event.turn.askingAbout;
        }

        settle(replyId, finalReply || extractPartialReply(buffer) || '', asked);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : 'Something went wrong.',
        );
        // Drop the empty reply bubble rather than leaving it spinning forever.
        setMessages((current) =>
          current.filter((message) => message.id !== replyId),
        );
      } finally {
        setBusy(false);
      }
    },
    [applyUpdates, busy, replaceText, settle],
  );

  /** Moritz speaking without the client having typed, e.g. after an upload. */
  const say = useCallback((text: string) => {
    setMessages((current) => [
      ...current,
      { id: newId(), role: 'assistant', text },
    ]);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    setAskingAbout('');
  }, []);

  return {
    messages,
    busy,
    error,
    askingAbout,
    send,
    say,
    clear,
    chooseChip,
    setError,
  };
}
