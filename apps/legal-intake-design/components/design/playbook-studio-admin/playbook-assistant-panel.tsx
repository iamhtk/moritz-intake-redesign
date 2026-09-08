'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

import {
  Check,
  Copy,
  FileText,
  GitCompare,
  Layers,
  PenLine,
  Upload,
} from '@repo/ui/icons';

import {
  Attachment,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { Button } from '@/components/design/design-system/button';
import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import { Spinner } from '@/components/design/foundations/components/spinner';
import {
  ChatComposer,
  type ComposerAttachment,
} from '@/components/design/intake/chat/chat-composer';
import { describeFile } from '@/components/design/new-case/file-utils';

import {
  IDLE_GENERATION,
  type GenerationState,
} from './playbook-generation-data';

/**
 * Starter actions surfaced in the editor empty state and as quick prompts. Each
 * pre-fills the assistant composer with a mock prompt. Playground-only — porting
 * this to production would wire these to a real playbook-generation service.
 */
export const ACTION_CARDS: {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  prompt: string;
}[] = [
  {
    id: 'upload-example-contracts',
    label: 'Upload example contracts',
    description:
      'Extract rules and positions from one or more executed contracts',
    icon: Upload,
    prompt:
      'Add 10-15 rules that favor the [buyer/seller/discloser/party] using the uploaded executed agreement(s).',
  },
  {
    id: 'import-existing-playbook',
    label: 'Import existing playbook',
    description:
      'Import rules from a playbook document, checklist, or guidance notes',
    icon: FileText,
    prompt:
      'Import rules from the uploaded playbook that favor the [buyer/seller/discloser/party].',
  },
  {
    id: 'add-rules-from-redlines',
    label: 'Add rules from redlines',
    description: 'Extract rules based on tracked changes in documents',
    icon: GitCompare,
    prompt:
      'Add 10-15 rules based on the redlines in the attached document(s) that favor the [buyer/seller/discloser/party].',
  },
  {
    id: 'add-fallback-positions',
    label: 'Add fallback positions',
    description:
      'Add fallback positions to existing rules from executed contracts',
    icon: Layers,
    prompt:
      "Add fallback positions to my current playbook based on the uploaded document(s). These contain more restrictive positions that I've accepted as the [buyer/seller/discloser/party]. Do not create new rules, just modify my existing rules.",
  },
  {
    id: 'custom-instructions',
    label: 'Custom instructions',
    description: 'Describe what you need with or without uploads',
    icon: PenLine,
    prompt: '',
  },
];

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  attachments?: { id: string; name: string }[];
}

interface PlaybookAssistantPanelProps {
  playbookName: string;
  isNewPlaybook?: boolean;
  /** e.g. "import-existing-playbook" — pre-fills the composer prompt on mount. */
  initialAction?: string;
  /**
   * Live playbook-generation state, owned by the host (Playbook Studio editor
   * or Tabular Playbook detail) and mirrored here so the chat activity stays
   * in sync. Optional when the host has no generation stream — the panel then
   * stays on the mock chat replies only.
   */
  generation?: GenerationState;
  /** Kicks off the host's generation stream (cards or table rows). */
  onGeneratePlaybook?: (
    documentName: string | undefined,
    prompt: string,
  ) => void;
  /** Stops an in-flight generation stream. */
  onCancelGeneration?: () => void;
}

export function PlaybookAssistantPanel({
  playbookName,
  isNewPlaybook = false,
  initialAction,
  generation = IDLE_GENERATION,
  onGeneratePlaybook,
  onCancelGeneration,
}: PlaybookAssistantPanelProps) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill the composer when opened from a starter card / upload flow.
  useEffect(() => {
    if (!initialAction) return;
    const action = ACTION_CARDS.find((a) => a.id === initialAction);
    if (action?.prompt) setInput(action.prompt);
  }, [initialAction]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, generation]);

  const isGenerating =
    generation.phase !== 'idle' && generation.phase !== 'done';

  useEffect(
    () => () => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
    },
    [],
  );

  const handleSend = (text: string) => {
    if (!text && attachments.length === 0) return;

    const sentAttachments = attachments;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      attachments: sentAttachments.map((file) => ({
        id: file.id,
        name: file.name,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);

    // Demo trigger: attaching a document and asking to build a playbook streams
    // generated rules into the host (Studio cards / Tabular rows) instead of
    // the canned mock reply. Hosts without onGeneratePlaybook fall through.
    if (sentAttachments.length > 0 && onGeneratePlaybook) {
      onGeneratePlaybook(sentAttachments[0]?.name, text);
      return;
    }

    setBusy(true);

    replyTimeoutRef.current = setTimeout(() => {
      const reply: Message = {
        id: `${Date.now() + 1}`,
        type: 'agent',
        content: `I'm analyzing your request for the "${playbookName || 'Untitled playbook'}" playbook. Based on the context provided, I'll help you update the rules accordingly.\n\n**What I'll do:**\n\n1. Review your uploaded documents\n2. Extract relevant positions and language\n3. Create rules that match your requirements\n\nThis may take a moment…`,
      };
      setMessages((prev) => [...prev, reply]);
      setBusy(false);
    }, 2000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      setAttachments((prev) => [
        ...prev,
        ...files.map((file, index): ComposerAttachment => {
          const { Icon, colorClass } = describeFile(file.name);
          return {
            id: `${Date.now()}-${index}-${file.name}`,
            name: file.name,
            icon: Icon,
            iconClassName: colorClass,
            state: 'done',
          };
        }),
      ]);
    }
    event.target.value = '';
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard?.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard failures in the playground.
    }
  };

  const showEmptyState = messages.length === 0;

  return (
    <div className="bg-background flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <span
          data-font="serif"
          className="text-foreground heading-4 font-semibold"
        >
          Playbook agent
        </span>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="w-full py-4">
          {showEmptyState ? (
            <Bubble variant="ghost" align="start">
              <BubbleContent className="text-muted-foreground">
                <p>
                  Hi! I&apos;m your playbook agent. I can help you
                  {isNewPlaybook ? ' build this playbook' : ''}:
                </p>
                <ul className="mt-3 space-y-1.5">
                  {[
                    'Extract rules from executed contracts',
                    'Import rules from existing playbooks',
                    'Generate rules from redlined documents',
                    'Add fallback positions to your rules',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="bg-muted-foreground mt-2 size-1 shrink-0 rounded-full" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  Upload a document or describe what you need to get started.
                </p>
              </BubbleContent>
            </Bubble>
          ) : (
            <div className="space-y-6">
              {messages.map((message) =>
                message.type === 'user' ? (
                  <div
                    key={message.id}
                    className="flex flex-col items-end gap-1"
                  >
                    {message.attachments && message.attachments.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {message.attachments.map((file) => {
                          const { Icon, colorClass } = describeFile(file.name);
                          return (
                            <Attachment
                              key={file.id}
                              size="sm"
                              className="bg-muted/50 w-40 gap-0.5 border-transparent"
                            >
                              <AttachmentMedia className="size-8 bg-transparent [&>svg]:size-5">
                                <Icon
                                  className={colorClass}
                                  aria-hidden="true"
                                />
                              </AttachmentMedia>
                              <AttachmentContent>
                                <AttachmentTitle>{file.name}</AttachmentTitle>
                              </AttachmentContent>
                            </Attachment>
                          );
                        })}
                      </div>
                    ) : null}
                    {message.content ? (
                      <Bubble variant="muted" align="end">
                        <BubbleContent>
                          <div className="whitespace-pre-wrap font-medium">
                            {message.content}
                          </div>
                        </BubbleContent>
                      </Bubble>
                    ) : null}
                  </div>
                ) : (
                  <div key={message.id} className="group relative">
                    <Bubble variant="ghost" align="start">
                      <BubbleContent className="text-muted-foreground">
                        <StreamingMessageContent
                          content={message.content}
                          onTick={() =>
                            messagesEndRef.current?.scrollIntoView({
                              behavior: 'smooth',
                            })
                          }
                        />
                      </BubbleContent>
                    </Bubble>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      aria-label="Copy message"
                      className="text-muted-foreground absolute right-0 top-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      {copiedId === message.id ? (
                        <Check className="text-success size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ),
              )}

              {busy && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner className="size-4" />
                  <span>Analyzing your request…</span>
                </div>
              )}

              {generation.phase !== 'idle' && (
                <GenerationActivity
                  generation={generation}
                  playbookName={playbookName}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 px-3 pb-4 pt-2">
        <ChatComposer
          placeholder="Describe what you need…"
          value={input}
          onChange={setInput}
          onSend={handleSend}
          busy={busy || isGenerating}
          onStop={() => {
            if (isGenerating) onCancelGeneration?.();
            setBusy(false);
          }}
          onAttachClick={() => fileInputRef.current?.click()}
          attachments={attachments}
          onRemoveAttachment={(id) =>
            setAttachments((prev) => prev.filter((f) => f.id !== id))
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
        />
      </div>
    </div>
  );
}

// Per-word cadence with a floor on total duration so long replies don't drag,
// mirroring the intake chat's StreamingText.
const MS_PER_WORD = 34;
const MAX_STREAM_DURATION_MS = 1400;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Splits into alternating word / whitespace parts (whitespace at odd indices). */
function splitParts(text: string): string[] {
  return text.length > 0 ? text.split(/(\s+)/) : [];
}

/**
 * Reveals `content` word-by-word (streams once on mount) and pipes the revealed
 * substring through `renderMessageContent`, so the mock agent reply "types" out
 * while keeping its markdown-ish formatting. Respects reduced-motion by showing
 * the full text immediately.
 */
function StreamingMessageContent({
  content,
  onTick,
}: {
  content: string;
  onTick?: () => void;
}) {
  const parts = splitParts(content);
  const totalWords = Math.ceil(parts.length / 2);
  const [count, setCount] = useState(() =>
    prefersReducedMotion() ? totalWords : 0,
  );
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    const total = Math.ceil(splitParts(content).length / 2);
    if (prefersReducedMotion() || total === 0) {
      setCount(total);
      return;
    }
    setCount(0);
    const step = Math.max(
      MS_PER_WORD,
      Math.floor(MAX_STREAM_DURATION_MS / total),
    );
    let revealed = 0;
    const timer = window.setInterval(() => {
      revealed += 1;
      setCount(revealed);
      onTickRef.current?.();
      if (revealed >= total) window.clearInterval(timer);
    }, step);
    return () => window.clearInterval(timer);
  }, [content]);

  // Reveal up to (and including) the whitespace that trails the latest word so
  // formatting boundaries (line breaks) resolve as soon as a word completes.
  const revealed = count > 0 ? parts.slice(0, 2 * count).join('') : '';

  return <>{renderMessageContent(revealed)}</>;
}

/**
 * Renders the live generation activity in the chat, mirroring the editor's
 * `generation` state so the transcript stays visually connected to the cards
 * streaming into the left panel: a processing status while reading/extracting,
 * a labelled progress bar while building, and a completed summary bubble.
 */
function GenerationActivity({
  generation,
  playbookName,
}: {
  generation: GenerationState;
  playbookName: string;
}) {
  const { phase, documentName, totalRules, builtRules, currentRuleTitle } =
    generation;

  if (phase === 'done') {
    return (
      <Bubble variant="ghost" align="start">
        <BubbleContent className="text-muted-foreground">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              Playbook ready
            </span>
          </div>
          <p className="text-sm">
            I created{' '}
            <strong className="text-foreground font-semibold">
              {builtRules} {builtRules === 1 ? 'rule' : 'rules'}
            </strong>{' '}
            for the &ldquo;{playbookName || 'Untitled playbook'}&rdquo; playbook
            {documentName ? (
              <>
                {' '}
                from{' '}
                <span className="text-foreground font-medium">
                  {documentName}
                </span>
              </>
            ) : null}
            .
          </p>
          <p className="mt-2 text-sm">
            Each rule includes a preferred position, fallback positions, and an
            internal guidance note. Review or edit any card on the left, then
            rename the playbook to save it.
          </p>
        </BubbleContent>
      </Bubble>
    );
  }

  const label =
    phase === 'reading'
      ? `Reading ${documentName ?? 'your document'}…`
      : phase === 'extracting'
        ? 'Extracting positions and clauses…'
        : `Building rule ${Math.min(builtRules + 1, totalRules)} of ${totalRules}`;

  const progress =
    totalRules > 0 ? Math.round((builtRules / totalRules) * 100) : 0;

  return (
    <div className="space-y-2.5">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner className="size-4" />
        <span>{label}</span>
      </div>
      {phase === 'building' && (
        <div className="space-y-2 pl-6">
          {currentRuleTitle ? (
            <div className="text-foreground truncate text-sm font-medium">
              {currentRuleTitle}
            </div>
          ) : null}
          <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
            <div
              className="bg-success h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Lightweight markdown-ish renderer for the mock agent replies. */
function renderMessageContent(content: string) {
  return content.split('\n').map((line, index) => {
    const key = `${index}-${line}`;

    if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={key} className="mb-2 text-sm">
          {parts.map((part, partIndex) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={partIndex} className="text-foreground font-semibold">
                {part.slice(2, -2)}
              </strong>
            ) : (
              part
            ),
          )}
        </div>
      );
    }

    const numbered = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      return (
        <div key={key} className="mb-1.5 ml-4 text-sm">
          <span className="font-medium">{numbered[1]}.</span> {numbered[2]}
        </div>
      );
    }

    if (/^[•-]\s+/.test(line.trim())) {
      return (
        <div key={key} className="mb-1.5 flex items-start gap-2 text-sm">
          <span className="bg-muted-foreground ml-1 mr-1 mt-2 size-1 shrink-0 rounded-full" />
          <span>{line.replace(/^[•-]\s+/, '')}</span>
        </div>
      );
    }

    if (!line.trim()) return <div key={key} className="h-2" />;

    return (
      <div key={key} className="mb-2 text-sm">
        {line}
      </div>
    );
  });
}

export default PlaybookAssistantPanel;
