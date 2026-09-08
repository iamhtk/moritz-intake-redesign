'use client';

import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/design/design-system/button';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import {
  Bubble,
  BubbleContent,
} from '@/components/design/foundations/components/bubble';
import { Chip } from '@/components/design/foundations/components/chip';
import {
  MessageScrollerItem,
  useMessageScroller,
} from '@/components/design/foundations/components/message-scroller';
import { Badge } from '@repo/ui/components/badge';
import {
  Calendar,
  ClipboardList,
  Paperclip,
  Plus,
  Tag,
  Target,
  UploadCloud,
  Users,
  X,
  type LucideIcon,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { CollapsibleMessageText } from '../intake/chat/collapsible-message-text';
import { MoritzAvatar } from '../intake/chat/moritz-avatar';
import { StreamingText } from '../intake/chat/streaming-text';
import { UserAvatar } from '../intake/chat/user-avatar';
import { InlineField } from '../playbook-studio/inline-field';
import { CaseSubmittedCard } from './case-submitted-card';
import { deriveTitle } from './extract';
import { describeFile } from './file-utils';
import {
  DOCUMENTS_KEY,
  RECAP_KEY,
  type AnswersMap,
  type IntakeFile,
  type IntakeMessage,
  type MatterId,
  type SuggestionChip,
} from './intake-types';
import { displayAnswer, orderedQuestions } from './script';

export function UserTurn({ message }: { message: IntakeMessage }) {
  const attachments = message.attachments ?? [];
  const MAX_VISIBLE = 8;
  const visibleAttachments = attachments.slice(0, MAX_VISIBLE);
  const overflowCount = attachments.length - visibleAttachments.length;
  return (
    <MessageScrollerItem messageId={message.id} scrollAnchor>
      <div className="flex items-start gap-2.5">
        <Bubble variant="muted" align="end">
          {attachments.length > 0 ? (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {visibleAttachments.map((f) => {
                const { Icon, colorClass } = describeFile(f.name);
                return (
                  <Attachment
                    key={f.id}
                    size="sm"
                    className="bg-muted/50 w-40 gap-0.5 border-transparent"
                  >
                    <AttachmentMedia className="size-8 bg-transparent [&>svg]:size-5">
                      <Icon className={colorClass} aria-hidden="true" />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{f.name}</AttachmentTitle>
                    </AttachmentContent>
                  </Attachment>
                );
              })}
              {overflowCount > 0 ? (
                <span className="bg-muted/50 text-muted-foreground flex items-center justify-center rounded-lg px-3 text-xs font-medium">
                  +{overflowCount}
                </span>
              ) : null}
            </div>
          ) : null}
          {message.content ? (
            <BubbleContent className="px-4 py-3">
              <CollapsibleMessageText text={message.content} />
            </BubbleContent>
          ) : null}
        </Bubble>
        <UserAvatar className="mt-0.5" />
      </div>
    </MessageScrollerItem>
  );
}

export function AssistantTurn({
  message,
  matterId,
  answers,
  summaries,
  files,
  interactive = true,
  selectedChipValue,
  stream = false,
  onStreamTick,
  onChip,
  onSkipQuestion,
  onAddFiles,
  onRemoveFile,
  onSkipAttachments,
  onContinueAttachments,
  onSubmit,
  onEdit,
  onStartAnother,
  caseTitle,
  onCaseTitleChange,
  enterprise,
  submitting,
}: {
  message: IntakeMessage;
  matterId?: MatterId;
  answers: AnswersMap;
  summaries?: Record<string, string>;
  files: IntakeFile[];
  interactive?: boolean;
  selectedChipValue?: string;
  stream?: boolean;
  onStreamTick?: () => void;
  onChip?: (chip: SuggestionChip) => void;
  onSkipQuestion?: () => void;
  onAddFiles?: (files: FileList | File[]) => void;
  onRemoveFile?: (id: string) => void;
  onSkipAttachments?: () => void;
  onContinueAttachments?: () => void;
  onSubmit?: () => void;
  onEdit?: () => void;
  onStartAnother?: () => void;
  caseTitle?: string;
  onCaseTitleChange?: (value: string) => void;
  enterprise?: boolean;
  submitting?: boolean;
}) {
  const [streamingDone, setStreamingDone] = useState(false);
  const { scrollToEnd, scrollToMessage } = useMessageScroller();

  // Plain conversational turns reveal word-by-word; the recap (which uses bold
  // markup) renders statically so the markdown isn't shown mid-parse.
  const hasMarkup = message.content.includes('**');
  const streamable = stream && !hasMarkup;
  // Hold the inline card back until the text has finished streaming so chips
  // (and the attach/recap cards) reveal after the message, like the original.
  const showCard = !streamable || streamingDone;

  // The inline card (chips / attach / recap / submitted) reveals only after the
  // text streams in, so its extra height lands after autoscroll has settled and
  // would otherwise sit below the fold. Nudge the viewport once the card appears
  // so the new content stays in view.
  const cardRevealedRef = useRef(false);
  useEffect(() => {
    if (!showCard || !message.card) return;
    // The submitted card replaces the recap in place (same slot, new id), so
    // there is no "new turn" for the scroller to follow. It's also the terminal,
    // full-height confirmation — anchor its top to the viewport so the whole new
    // message scrolls into view, rather than jumping to the very bottom.
    const isSubmitted = message.card.type === 'submitted';
    if (!interactive && !isSubmitted) return;
    if (cardRevealedRef.current) return;
    cardRevealedRef.current = true;
    if (isSubmitted) {
      scrollToMessage(message.id, { align: 'start', behavior: 'smooth' });
    } else {
      scrollToEnd({ behavior: 'smooth' });
    }
  }, [
    interactive,
    showCard,
    message.card,
    message.id,
    scrollToEnd,
    scrollToMessage,
  ]);

  return (
    <MessageScrollerItem messageId={message.id}>
      <div className="flex gap-3.5">
        <MoritzAvatar />
        <div className="text-foreground min-w-0 flex-1 space-y-4 pt-0.5 text-sm leading-relaxed">
          <div className="space-y-1">
            <div className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide">
              Moritz
            </div>
            <Bubble variant="ghost" align="start">
              <BubbleContent>
                {streamable ? (
                  <StreamingText
                    text={message.content}
                    onTick={onStreamTick}
                    onComplete={() => {
                      setStreamingDone(true);
                      onStreamTick?.();
                    }}
                  />
                ) : (
                  <MarkdownText input={message.content} />
                )}
              </BubbleContent>
            </Bubble>
          </div>

          {showCard && message.card?.type === 'chips' ? (
            <ChipsCard
              chips={message.card.chips}
              interactive={interactive}
              selectedChipValue={selectedChipValue}
              onChip={onChip}
            />
          ) : null}

          {showCard && message.card?.type === 'skip' && interactive ? (
            <SkipChip onSkip={onSkipQuestion} />
          ) : null}

          {showCard && message.card?.type === 'attach' ? (
            <AttachCard
              files={files}
              interactive={interactive}
              onAddFiles={onAddFiles}
              onRemoveFile={onRemoveFile}
              onSkip={onSkipAttachments}
              onContinue={onContinueAttachments}
            />
          ) : null}

          {showCard && message.card?.type === 'recap' ? (
            <RecapCard
              matterId={matterId}
              answers={answers}
              summaries={summaries}
              files={files}
              title={caseTitle}
              interactive={interactive}
              onTitleChange={onCaseTitleChange}
              onSubmit={onSubmit}
              onEdit={onEdit}
              submitting={submitting}
            />
          ) : null}

          {showCard && message.card?.type === 'submitted' ? (
            <CaseSubmittedCard
              matterId={matterId}
              answers={answers}
              enterprise={enterprise}
              onStartAnother={onStartAnother}
            />
          ) : null}
        </div>
      </div>
    </MessageScrollerItem>
  );
}

function ChipsCard({
  chips,
  interactive,
  selectedChipValue,
  onChip,
}: {
  chips: SuggestionChip[];
  interactive: boolean;
  selectedChipValue?: string;
  onChip?: (chip: SuggestionChip) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => {
        const isSelected =
          selectedChipValue !== undefined && chip.value === selectedChipValue;
        const locked = !interactive || selectedChipValue !== undefined;
        return (
          <Chip
            key={chip.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={locked && !isSelected}
            aria-pressed={isSelected || undefined}
            style={{ animationDelay: `${i * 60}ms` }}
            className={cn(
              'mz-animate-step',
              isSelected &&
                'border-primary bg-primary text-primary-foreground not-disabled:hover:bg-primary',
              locked && 'cursor-default',
            )}
            onClick={() => {
              if (locked) return;
              onChip?.(chip);
            }}
          >
            {chip.label}
          </Chip>
        );
      })}
    </div>
  );
}

/**
 * A skip affordance for optional text questions, matching the copy that invites
 * skipping. Reuses the foundation Chip's default outline variant so it reads as
 * part of the same family as the answer chips.
 */
function SkipChip({ onSkip }: { onSkip?: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip
        type="button"
        variant="outline"
        size="sm"
        className="mz-animate-step"
        onClick={onSkip}
      >
        Skip
      </Chip>
    </div>
  );
}

/**
 * The documents step, rendered inline in the chat as a self-contained
 * drag-and-drop dropzone. Empty state invites a drop or browse; once files are
 * attached it lists them (with inline remove) and offers a primary Continue.
 * Drag/drop and browse both add files directly — no dialog round-trip.
 */
function AttachCard({
  files,
  interactive = true,
  onAddFiles,
  onRemoveFile,
  onSkip,
  onContinue,
}: {
  files: IntakeFile[];
  interactive?: boolean;
  onAddFiles?: (files: FileList | File[]) => void;
  onRemoveFile?: (id: string) => void;
  onSkip?: () => void;
  onContinue?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const hasFiles = files.length > 0;

  const browse = () => {
    if (interactive) inputRef.current?.click();
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) onAddFiles?.(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!interactive) return;
    if (event.dataTransfer.files?.length)
      onAddFiles?.(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        if (!interactive) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'border-border bg-card mz-animate-step overflow-hidden rounded-xl border transition-colors',
        dragging &&
          'border-foreground/40 bg-muted/40 ring-ring/40 border-dashed ring-2',
      )}
    >
      {hasFiles ? (
        <>
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Paperclip
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              Supporting documents
            </div>
            <Badge variant="outline">
              {files.length} file{files.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <div className="px-4 py-3">
            <AttachmentGroup className="w-full">
              {files.map((f) => {
                const { Icon, colorClass } = describeFile(f.name);
                return (
                  <Attachment
                    key={f.id}
                    size="sm"
                    className="bg-muted/50 max-w-56 gap-0.5 border-transparent"
                  >
                    <AttachmentMedia className="size-8 bg-transparent [&>svg]:size-5">
                      <Icon className={colorClass} aria-hidden="true" />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{f.name}</AttachmentTitle>
                    </AttachmentContent>
                    {interactive ? (
                      <AttachmentActions className="self-center">
                        <AttachmentAction
                          className="size-5"
                          onClick={() => onRemoveFile?.(f.id)}
                          aria-label={`Remove ${f.name}`}
                        >
                          <X aria-hidden="true" />
                        </AttachmentAction>
                      </AttachmentActions>
                    ) : null}
                  </Attachment>
                );
              })}
            </AttachmentGroup>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 pb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={browse}
              disabled={!interactive}
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add more
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onContinue}
              disabled={!interactive}
            >
              Continue
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 py-7 text-center">
          <span
            aria-hidden="true"
            className="border-border text-foreground mz-animate-reveal flex size-12 items-center justify-center rounded-full border"
          >
            <UploadCloud
              className="mz-animate-draw size-5 [--mz-draw:88]"
              strokeWidth={1.75}
            />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Add supporting documents</p>
            <p className="text-muted-foreground mx-auto max-w-xs text-xs leading-relaxed">
              Drop files here, or browse. Contracts, letters, term sheets, or
              prior drafts &mdash; anything that helps.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={browse}
              disabled={!interactive}
            >
              <Paperclip data-icon="inline-start" aria-hidden="true" />
              Attach files
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkip}
              disabled={!interactive}
            >
              Skip for now
            </Button>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInput}
      />
    </div>
  );
}

/**
 * Best-effort leading icon for a recap row, matched on the review label so it
 * works across every matter's (differently worded) questions, with a neutral
 * fallback for anything unrecognised.
 */
function iconForLabel(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes('about') || l.includes('matter')) return Tag;
  if (l.includes('need')) return ClipboardList;
  if (
    l.includes('side') ||
    l.includes('involved') ||
    l.includes('who') ||
    l.includes('counterparty') ||
    l.includes('vendor') ||
    l.includes('entity')
  )
    return Users;
  if (l.includes('time') || l.includes('when') || l.includes('deadline'))
    return Calendar;
  if (l.includes('file') || l.includes('document')) return Paperclip;
  return Target;
}

function RecapCard({
  matterId,
  answers,
  summaries,
  files,
  title,
  interactive = true,
  onTitleChange,
  onSubmit,
  onEdit,
  submitting,
}: {
  matterId?: MatterId;
  answers: AnswersMap;
  summaries?: Record<string, string>;
  files: IntakeFile[];
  title?: string;
  interactive?: boolean;
  onTitleChange?: (value: string) => void;
  onSubmit?: () => void;
  onEdit?: () => void;
  submitting?: boolean;
}) {
  const rows = orderedQuestions(matterId, answers)
    .filter((q) => q.key !== RECAP_KEY && q.key !== DOCUMENTS_KEY)
    .map((q) => {
      const raw = displayAnswer(q, answers);
      const summary =
        q.kind !== 'chips' && raw && raw !== 'Skipped'
          ? summaries?.[q.key]
          : undefined;
      return { label: q.reviewLabel, value: summary ?? raw };
    })
    .filter((r) => r.value !== null && r.value !== 'Skipped');

  const displayTitle = title ?? deriveTitle(matterId, answers);

  return (
    <div className="border-border bg-card mz-animate-step flex max-h-[70vh] flex-col overflow-hidden rounded-xl border shadow">
      <div className="shrink-0 space-y-1.5 p-6 pb-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide">
          Case title
        </p>
        <h3 className="text-foreground text-base font-semibold leading-snug">
          {interactive && onTitleChange ? (
            <InlineField
              value={displayTitle}
              onChange={onTitleChange}
              onEmpty={() => onTitleChange('')}
              placeholder="Name this case"
              bold={false}
              className="text-base font-semibold leading-snug"
              editableProps={{ 'aria-label': 'Case name' }}
            />
          ) : (
            displayTitle
          )}
        </h3>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <dl className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 pb-8">
          {rows.map((r) => {
            const RowIcon = iconForLabel(r.label);
            return (
              <div key={r.label} className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em]">
                  <RowIcon
                    className="size-3.5 shrink-0 opacity-70"
                    aria-hidden="true"
                  />
                  {r.label}
                </dt>
                <dd className="text-foreground text-sm leading-relaxed">
                  {r.value}
                </dd>
              </div>
            );
          })}
          <div className="space-y-1">
            <dt className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em]">
              <Paperclip
                className="size-3.5 shrink-0 opacity-70"
                aria-hidden="true"
              />
              Files
            </dt>
            <dd className="text-foreground text-sm leading-relaxed">
              {files.length} file{files.length === 1 ? '' : 's'}
            </dd>
          </div>
        </dl>
        <div
          aria-hidden="true"
          className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t to-transparent"
        />
      </div>

      <div className="bg-muted/40 grid shrink-0 grid-cols-2 gap-2 p-6 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onEdit}
          disabled={submitting}
        >
          Keep editing
        </Button>
        <Button
          type="button"
          className="w-full"
          onClick={onSubmit}
          isPending={submitting}
        >
          {submitting ? 'Submitting\u2026' : 'Submit case'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Minimal markdown for assistant copy: blank-line-separated paragraphs with
 * inline `**bold**`. Mirrors the prototype's renderer (sans the streaming
 * token-splitting, which StreamingText now handles for plain turns).
 */
function MarkdownText({ input }: { input: string }) {
  const paragraphs = useMemo(
    () => input.split(/\n{2,}/).filter((p) => p.length > 0),
    [input],
  );
  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => (
        <p key={`p-${i}`} className="whitespace-pre-wrap">
          {renderInline(para)}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    parts.push(
      <strong key={`b-${key++}`} className="font-semibold">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}
