'use client';

import {
  type ChangeEvent,
  type ComponentType,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { Spinner } from '@/components/design/foundations/components/spinner';
import {
  Button,
  buttonVariants,
} from '@/components/design/design-system/button';
import { VoiceWaveform } from '@/components/design/intake/chat/voice-waveform';
import { ArrowUp, FileText, Mic, Paperclip, Square, X } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';

/** A file docked in the composer's attachment row. */
export type ComposerAttachment = {
  id: string;
  name: string;
  /** Secondary line, e.g. "PNG · 820 KB". */
  meta?: string;
  /** Image thumbnail source. When set, the card renders an image preview. */
  previewUrl?: string;
  /**
   * Icon for non-image files. Defaults to a generic file icon. Accepts both
   * lucide and `react-icons` components (both take a `className`).
   */
  icon?: ComponentType<{ className?: string }>;
  /** Optional icon color, e.g. a per-file-type token like `text-red-600`. */
  iconClassName?: string;
  /** Upload lifecycle. Defaults to `done`. */
  state?: 'idle' | 'uploading' | 'processing' | 'error' | 'done';
};

type ChatComposerProps = {
  placeholder?: string;
  disabled?: boolean;
  /** Fired with the trimmed message text on submit. */
  onSend: (text: string) => void;
  /** Native file-picker attach. Used when `onAttachClick` is not provided. */
  onAttach?: (files: File[]) => void;
  /**
   * Custom attach handler (e.g. open a dialog). When provided, the paperclip
   * calls this instead of opening the native file picker.
   */
  onAttachClick?: () => void;
  /** Controlled value. Falls back to internal state when omitted. */
  value?: string;
  /** Controlled change handler. Required for controlled usage. */
  onChange?: (next: string) => void;
  /** Assistant is generating: the Send button becomes a Stop control. */
  busy?: boolean;
  /** Stop generation (only used while `busy`). */
  onStop?: () => void;
  /** Files docked in a scrollable row above the input. */
  attachments?: ComposerAttachment[];
  /** Remove a docked attachment by id (renders the per-card X control). */
  onRemoveAttachment?: (id: string) => void;
  /**
   * Whether docked `attachments` on their own enable sending (ChatGPT/Claude
   * style). Set `false` when the dock is a persistent, display-only collection
   * so an empty text field can't send a message. Defaults to `true`.
   */
  attachmentsEnableSend?: boolean;
};

const MAX_LINES = 6;

/** Placeholder text inserted when a (prototyped) voice recording is stopped. */
const SAMPLE_TRANSCRIPT =
  "I'd like to understand my options before deciding how to proceed.";

/**
 * Sticky bottom composer. Auto-grows up to ~6 lines, then scrolls with a soft
 * top/bottom fade over scrolled-away content (instead of a hard clip). Enter
 * (without shift) or the send button submits. A paperclip opens the native file
 * picker (or `onAttachClick`). Pressing the mic enters a (prototyped) recording
 * state — an animated waveform + stop button — and stopping inserts a sample
 * transcript. While `busy`, the Send button morphs into a Stop control.
 *
 * Any `attachments` dock in a scrollable row above the input (built from the
 * foundation Attachment primitives), each with a remove control; a non-empty
 * list lets the composer send even when the text field is empty.
 *
 * Works controlled (`value` + `onChange`) or uncontrolled (internal state).
 */
export function ChatComposer({
  placeholder = 'Ask…',
  disabled = false,
  onSend,
  onAttach,
  onAttachClick,
  value: valueProp,
  onChange,
  busy = false,
  onStop,
  attachments = [],
  onRemoveAttachment,
  attachmentsEnableSend = true,
}: ChatComposerProps) {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;
  const setValue = useCallback(
    (next: string) => {
      if (isControlled) onChange?.(next);
      else setInternalValue(next);
    },
    [isControlled, onChange],
  );

  const [fade, setFade] = useState({ top: false, bottom: false });
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Once the textarea hits the MAX_LINES cap it scrolls; show a soft fade on
  // whichever edge has scrolled-away content (matching the case-creation
  // CollapsibleRichText fade) instead of a hard clip.
  const updateFades = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const top = el.scrollTop > 0;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setFade((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
    );
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const maxHeight = lineHeight * MAX_LINES;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    updateFades();
  }, [value, updateFades]);

  // Docked attachments count toward "can send" only when the caller opts in
  // (ChatGPT/Claude style); a persistent display-only dock does not.
  const attachmentsCanSend = attachmentsEnableSend && attachments.length > 0;

  const handleSubmit = () => {
    const trimmed = value.trim();
    // Attachments alone are enough to send (matching ChatGPT/Claude).
    if ((!trimmed && !attachmentsCanSend) || disabled || busy) return;
    onSend(trimmed);
    if (!isControlled) setInternalValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length) onAttach?.(files);
    event.target.value = '';
  };

  const handleAttachClick = () => {
    if (onAttachClick) {
      onAttachClick();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setValue(
      value.trim()
        ? `${value.trimEnd()} ${SAMPLE_TRANSCRIPT}`
        : SAMPLE_TRANSCRIPT,
    );
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <form
      data-slot="control"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      onMouseDown={(event) => {
        // Clicking the composer's empty padding/toolbar space should focus the
        // textarea, like a real input. Ignore clicks on interactive controls
        // (buttons, the textarea, links) so they keep their own behavior, and
        // preventDefault so the empty-space click doesn't steal/blur focus.
        if (disabled) return;
        const target = event.target as HTMLElement;
        if (target.closest('button, input, textarea, a')) return;
        event.preventDefault();
        textareaRef.current?.focus();
      }}
      className={cn(
        // Card-style surface (see foundations card.tsx): the fill + drop `shadow`
        // are applied directly to this container, NOT via the fields' inset
        // `before` pseudo — on a container that pseudo paints a second contour
        // just inside the border (a visible "double border"). An `after` layer
        // draws the inset 2px primary focus ring, overlapping the 1px border via
        // `-inset-px` (like input-group). Border is the neutral field token,
        // darkening on hover; the border itself does not change color on focus.
        // Radius is the field `0.5rem` (matching the foundation Input/Textarea),
        // not the card `rounded-2xl`, so the composer reads as one of the fields.
        'bg-background border-field relative rounded-[0.5rem] border shadow',
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        'has-[textarea:enabled]:hover:border-field-strong',
        'has-[textarea:disabled]:bg-muted has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50 has-[textarea:disabled]:shadow-none',
      )}
    >
      {attachments.length > 0 ? (
        // Docked attachment row (ChatGPT/Claude style): compact foundation
        // Attachment cards in a horizontally-scrolling group with edge fade,
        // sitting above the input inside the composer card.
        <div className="px-3 pt-3">
          <AttachmentGroup>
            {attachments.map((attachment) => {
              const isStreaming =
                attachment.state === 'uploading' ||
                attachment.state === 'processing';
              const Icon = attachment.icon ?? FileText;

              return (
                <Attachment
                  key={attachment.id}
                  size="sm"
                  state={attachment.state ?? 'done'}
                  className="bg-muted/50 max-w-56 gap-0.5 border-transparent"
                >
                  {attachment.previewUrl ? (
                    <AttachmentMedia variant="image">
                      <img src={attachment.previewUrl} alt={attachment.name} />
                    </AttachmentMedia>
                  ) : (
                    <AttachmentMedia className="size-8 bg-transparent [&>svg]:size-5">
                      {isStreaming ? (
                        <Spinner />
                      ) : (
                        <Icon className={attachment.iconClassName} />
                      )}
                    </AttachmentMedia>
                  )}
                  <AttachmentContent>
                    <AttachmentTitle>{attachment.name}</AttachmentTitle>
                    {attachment.meta ? (
                      <AttachmentDescription>
                        {attachment.meta}
                      </AttachmentDescription>
                    ) : null}
                  </AttachmentContent>
                  {onRemoveAttachment ? (
                    <AttachmentActions className="self-center">
                      <AttachmentAction
                        type="button"
                        className="size-5"
                        disabled={disabled}
                        onClick={() => onRemoveAttachment(attachment.id)}
                        aria-label={`Remove ${attachment.name}`}
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
      ) : null}
      <div
        className={cn(
          'relative overflow-hidden rounded-t-[calc(0.5rem-1px)] px-3',
          // Drop the top padding when the attachment row already provides it,
          // so there's no doubled gap above the textarea.
          attachments.length > 0 ? 'pt-2' : 'pt-3',
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={updateFades}
          placeholder={isRecording ? 'Listening… speak now' : placeholder}
          disabled={disabled}
          aria-label="Message Moritz"
          className="placeholder:text-field-placeholder selection:bg-accent selection:text-accent-foreground min-h-10 w-full resize-none bg-transparent text-base/6 outline-none disabled:cursor-not-allowed sm:text-sm/6"
        />
        {fade.top ? (
          <div className="from-background pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b to-transparent" />
        ) : null}
        {fade.bottom ? (
          <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent" />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <div className="flex items-center gap-2">
          {/*
           * Attach stays mounted and fades out in place when recording starts
           * (rather than unmounting) so it has a calm exit and re-entry. Opacity
           * only — no transform — to avoid the scale-based jitter. `pointer-
           * events-none` + `tabIndex=-1` + `aria-hidden` take it out of
           * interaction while it's transparent; we avoid toggling `disabled`
           * here because the button's own `disabled:opacity-50` would fight the
           * `opacity-0` transition.
           */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            onClick={handleAttachClick}
            aria-label="Attach a file"
            aria-hidden={isRecording}
            tabIndex={isRecording ? -1 : undefined}
            className={cn(
              'rounded-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              isRecording && 'pointer-events-none opacity-0',
            )}
          >
            <Paperclip aria-hidden="true" />
          </Button>
          {onAttachClick ? null : (
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          )}
        </div>
        {/*
         * Right cluster: the mic ⇄ stop control morphs (grows) while the send
         * button simply fades in place (like attach) — no slide. Trick: an
         * invisible width spacer holds the send's slot when idle and collapses
         * while recording, so the morph extends rightward to the composer edge
         * with no jump, and the send (absolutely pinned to the right edge) just
         * cross-fades over it. Everything is width + opacity — no transforms, so
         * no jitter. Cluster width stays ~constant (idle 36+spacer ≈ recording
         * pill), so the rest of the row doesn't shift.
         */}
        <div className="relative flex items-center">
          {/*
           * Mic ⇄ stop morph. Reuses the outline button treatment (focus ring,
           * cursor, hover) but overrides the layout to a 2-column grid: a fixed
           * circle holding the mic ⇄ waveform crossfade, and a collapsible column
           * that reveals the stop square as the pill expands. Toggles recording.
           * Disabled while the assistant is generating (`busy`).
           */}
          <button
            type="button"
            disabled={disabled || busy}
            onClick={
              isRecording ? handleStopRecording : () => setIsRecording(true)
            }
            aria-label={isRecording ? 'Stop recording' : 'Use voice'}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              // Override the size variant's padding/gap so we fully control the
              // morph. Idle: a true circle (no padding, no column gap, collapsed
              // 2nd track). Recording: a pill with symmetric `px-2.5` insets and
              // a `gap-1.5` between the waveform and the stop square. `py` is
              // zeroed in both states so the content height stays the full h-9
              // (the size variant's `py`/`sm:py` would otherwise shrink it).
              'grid h-9 items-center rounded-full duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              isRecording
                ? 'grid-cols-[auto_1fr] gap-1.5 px-2.5 py-0 sm:px-2.5 sm:py-0'
                : 'grid-cols-[auto_0fr] gap-0 p-0 sm:p-0',
            )}
          >
            {/*
             * Mic icon and waveform are stacked in the same grid cell (both at
             * col/row 1) so `place-items-center` centers each. We avoid `absolute`
             * here: an absolutely-positioned child is NOT a grid item, so it would
             * ignore `place-items-center` and pin to the cell's top-left — tucking
             * the waveform into the pill's rounded corner.
             */}
            <span className="grid aspect-square h-full place-items-center">
              <Mic
                aria-hidden="true"
                className={cn(
                  'col-start-1 row-start-1 transition-opacity',
                  isRecording && 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'col-start-1 row-start-1 transition-opacity',
                  isRecording ? 'opacity-100' : 'opacity-0',
                )}
              >
                <VoiceWaveform active={isRecording} />
              </span>
            </span>
            <span className="grid min-w-0 place-items-center overflow-hidden">
              <Square
                aria-hidden="true"
                className={cn(
                  'fill-current transition-opacity',
                  isRecording ? 'opacity-100' : 'opacity-0',
                )}
              />
            </span>
          </button>
          {/*
           * Invisible spacer reserving the send button's slot (size-9 + 8px gap)
           * when idle. It collapses to 0 while recording so the morph can extend
           * to the right edge smoothly (no jump). Being invisible, its collapse
           * isn't perceived as a slide — the send itself fades in place below.
           */}
          <div
            aria-hidden="true"
            className={cn(
              'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              isRecording ? 'w-0' : 'w-11',
            )}
          />
          {/*
           * Send is pinned to the right edge and fades out/in (like the attach
           * button) rather than sliding. While recording it's inert (transparent,
           * non-interactive); the morph grows underneath it to the same edge.
           * While `busy` it becomes a Stop control (square icon → `onStop`),
           * enabled regardless of the (empty) input.
           */}
          <Button
            type={busy ? 'button' : 'submit'}
            size="icon"
            onClick={busy ? onStop : undefined}
            className={cn(
              'absolute end-0 top-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              // `disabled:opacity-0` too: when the composer is empty the Send
              // button is `disabled`, and the base `disabled:opacity-50` selector
              // outranks a plain `opacity-0` (higher specificity), leaving the
              // arrow half-visible over the recording pill. This override hides
              // it in the empty state as well.
              isRecording && 'pointer-events-none opacity-0 disabled:opacity-0',
            )}
            disabled={
              busy
                ? false
                : disabled || (value.trim().length === 0 && !attachmentsCanSend)
            }
            tabIndex={isRecording ? -1 : undefined}
            aria-hidden={isRecording}
            aria-label={busy ? 'Stop generating' : 'Send'}
          >
            {busy ? (
              <Square aria-hidden="true" className="size-3 fill-current" />
            ) : (
              <ArrowUp aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
