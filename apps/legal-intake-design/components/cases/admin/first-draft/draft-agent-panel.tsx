'use client';

import { useState } from 'react';
import { FileText, Lock, Wand2 } from '@repo/ui/icons';

import { Badge } from '@/components/design/foundations/components/badge';
import { Button } from '@/components/design/foundations/components/button';
import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/design/foundations/components/message-scroller';
import { Spinner } from '@/components/design/foundations/components/spinner';
import { Text } from '@/components/design/foundations/components/text';
import {
  ChatComposer,
  type ComposerAttachment,
} from '@/components/design/intake/chat/chat-composer';

import { DraftVersionAttachment } from './draft-version-attachment';
import type { FirstDraftWorkspaceState } from './use-first-draft-workspace';
/**
 * The case's one drafting conversation. Ops asks in here and the document
 * answers next door: asking for a change is what approves it, so the agent
 * makes it, cuts a version, and says in plain language what moved.
 */
export function DraftAgentPanel({
  workspace,
  playbookName,
  ownsDocuments = false,
}: {
  workspace: FirstDraftWorkspaceState;
  /** The playbook this case's drafting runs against. */
  playbookName: string;
  /**
   * Whether the documents are this panel's responsibility. In v0.1 the
   * conversation is the only surface the feature has, so starting the draft
   * and taking a version away both have to happen here.
   */
  ownsDocuments?: boolean;
}) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);

  const send = (text: string) => {
    if (workspace.busy) return;
    const names = attachments.map((item) => item.name);
    workspace.sendPrompt(text, names);
    setInput('');
    setAttachments([]);
  };

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <MessageScrollerProvider autoScroll>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              <MessageScrollerItem>
                <div className="border-field rounded-lg border border-dashed p-3">
                  <p className="text-muted-foreground flex items-start gap-2 text-xs">
                    <Lock className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Internal to ops — neither the client nor the lawyer can
                      see this conversation.
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs font-medium">
                    Working from
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[
                      playbookName,
                      'Case brief',
                      `${workspace.documents.length} document${workspace.documents.length === 1 ? '' : 's'}`,
                      'Drafting instructions',
                      'First-draft skills',
                    ].map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </MessageScrollerItem>

              {workspace.messages.map((message) => {
                if (message.system) {
                  return (
                    <MessageScrollerItem key={message.id}>
                      <p className="text-muted-foreground py-1 text-center text-xs">
                        {message.body}
                      </p>
                    </MessageScrollerItem>
                  );
                }

                if (message.role === 'ops') {
                  return (
                    <MessageScrollerItem key={message.id}>
                      <Bubble variant="muted" align="end">
                        <BubbleContent>
                          {message.body}
                          {message.attachments?.length ? (
                            <span className="mt-1.5 flex flex-wrap justify-end gap-1">
                              {message.attachments.map((name) => (
                                <Badge key={name} variant="outline">
                                  <FileText data-icon="inline-start" />
                                  {name}
                                </Badge>
                              ))}
                            </span>
                          ) : null}
                        </BubbleContent>
                      </Bubble>
                    </MessageScrollerItem>
                  );
                }

                // The version a message cut, as a file — but only where the
                // chat is the whole feature. With the document open beside the
                // conversation there is already a way to read and take it.
                const revised = ownsDocuments
                  ? workspace.documents.find(
                      (doc) => doc.id === message.revision?.documentId,
                    )
                  : undefined;

                return (
                  <MessageScrollerItem key={message.id}>
                    <Bubble variant="ghost" align="start">
                      <BubbleContent>
                        <Text className="text-foreground text-sm">
                          {message.body}
                        </Text>
                        {revised && message.revision ? (
                          <DraftVersionAttachment
                            document={revised}
                            versionId={message.revision.versionId}
                          />
                        ) : null}
                      </BubbleContent>
                    </Bubble>
                  </MessageScrollerItem>
                );
              })}

              {workspace.busy ? (
                <MessageScrollerItem>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Spinner className="size-4" />
                    Reading the playbook and the case documents…
                  </div>
                </MessageScrollerItem>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {/*
       * Drafting ends at the handoff: from here the lawyer owns the document,
       * so the composer closes rather than quietly producing versions nobody
       * downstream will ever see.
       */}
      {workspace.handoff ? (
        <div className="shrink-0 px-3 pb-4 pt-3">
          <p className="border-field text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-xs">
            Drafting closed — the first draft was handed to{' '}
            {workspace.handoff.lawyerName}. Further changes happen in the
            lawyer&rsquo;s review.
          </p>
        </div>
      ) : (
        <div className="shrink-0 px-3 pb-4 pt-3">
          {ownsDocuments && !workspace.hasWorkspace ? (
            <Button
              variant="outline"
              className="mb-2 w-full"
              onClick={workspace.generateFirstDraft}
              disabled={workspace.generating}
            >
              {workspace.generating ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Wand2 data-icon="inline-start" />
              )}
              {workspace.generating
                ? 'Generating…'
                : 'Generate a first draft for this case'}
            </Button>
          ) : null}

          <ChatComposer
            placeholder="Ask for a change, or attach a document…"
            value={input}
            onChange={setInput}
            onSend={send}
            busy={workspace.busy}
            onStop={workspace.stop}
            attachments={attachments}
            onRemoveAttachment={(id) =>
              setAttachments((current) =>
                current.filter((item) => item.id !== id),
              )
            }
            onAttach={(files) =>
              setAttachments((current) => [
                ...current,
                ...files.map((file) => ({
                  id: `${file.name}-${file.size}`,
                  name: file.name,
                  icon: FileText,
                })),
              ])
            }
          />
        </div>
      )}
    </div>
  );
}
