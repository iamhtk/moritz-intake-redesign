'use client';

import {
  type ChangeEvent,
  type ComponentType,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type RefObject,
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
} from '@repo/ui/components/attachment';
import { Button, buttonVariants } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
import { useScrollActivity } from '@repo/ui/hooks/use-scroll-activity';
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
  /**
   * Whether the paperclip is offered inside the composer. Set `false` on a
   * surface that carries its own, more findable attach control; dropped files
   * still reach `onAttach`.
   */
  showAttachButton?: boolean;
  /** Controlled value. Falls back to internal state when omitted. */
  value?: string;
  /** Controlled change handler. Required for controlled usage. */
  onChange?: (next: string) => void;
  /**
   * Assistant is generating. The reader may still type and send — a message
   * sent mid-turn preempts the running turn and starts a new one with it, which
   * is what someone means when they add a thought while the reply is coming.
   * With nothing typed, the control stops generation instead.
   */
  busy?: boolean;
  /** Stop generation (offered while `busy` with an empty composer). */
  onStop?: () => void;
  /**
   * A send is already under way. Blocks sending, attaching and removing — but
   * deliberately not typing, and without `disabled`'s greyed-out treatment,
   * which would dim the docked attachments that are showing the work.
   *
   * Distinct from `disabled` because the two answer different questions:
   * `disabled` is "this composer is not available", `locked` is "this composer
   * is mid-flight". Only the first should look unavailable.
   */
  locked?: boolean;
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
  /**
   * Handle on the textarea, for a caller that needs to place the caret — e.g.
   * after writing a value into it programmatically.
   */
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  /** Accessible label for the message textarea. */
  textareaLabel?: string;
  /** Placeholder shown while a voice recording is in progress. */
  recordingPlaceholder?: string;
  /** Accessible label for the attach (paperclip) button. */
  attachLabel?: string;
  /** Accessible label for the mic button when idle. */
  voiceLabel?: string;
  /** Accessible label for the mic button while recording. */
  stopRecordingLabel?: string;
  /** Accessible label for the send button. */
  sendLabel?: string;
  /** Accessible label for the send button while `busy` (stop generating). */
  stopLabel?: string;
  /** Accessible label for an attachment's remove control. */
  removeAttachmentLabel?: (name: string) => string;
  /** Test hook on the composer's outer element. */
  'data-testid'?: string;
};

const MAX_LINES = 6;

/** Placeholder text inserted when a (prototyped) voice recording is stopped. */
const SAMPLE_TRANSCRIPT =
  "I'd like to understand my options before deciding how to proceed.";

// Center-weighted bars: the middle crests highest and tapers symmetrically to
// the edges. `taper` scales the live audio height and the fallback peak; `delay`
// is mirrored around the center so the fallback pulse stays symmetric.
const WAVEFORM_BARS = [
  { id: 'l3', taper: 0.35, delay: '-0.3s' },
  { id: 'l2', taper: 0.6, delay: '-0.2s' },
  { id: 'l1', taper: 0.85, delay: '-0.1s' },
  { id: 'c', taper: 1, delay: '0s' },
  { id: 'r1', taper: 0.85, delay: '-0.1s' },
  { id: 'r2', taper: 0.6, delay: '-0.2s' },
  { id: 'r3', taper: 0.35, delay: '-0.3s' },
];

/**
 * Audio-reactive recording waveform. While `active`, it captures the microphone
 * via the Web Audio API and drives each bar's height from live frequency data
 * (written straight to the DOM in a rAF loop to avoid per-frame React renders).
 * If mic access is unavailable or denied, it falls back to the looping CSS
 * `mz-animate-waveform` (defined in the app stylesheet, when present) so the
 * recording state still reads as live.
 */
function VoiceWaveform({ active }: { active: boolean }) {
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!active) return;

    let audioContext: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;

    const setBar = (index: number, scale: number) => {
      const el = barsRef.current[index];
      if (el) el.style.transform = `scaleY(${scale})`;
    };

    const run = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFallback(true);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const binsPerBar = Math.floor(data.length / WAVEFORM_BARS.length) || 1;

        const tick = () => {
          analyser.getByteFrequencyData(data);
          WAVEFORM_BARS.forEach((bar, i) => {
            let sum = 0;
            for (let j = 0; j < binsPerBar; j++) {
              sum += data[i * binsPerBar + j] ?? 0;
            }
            const avg = sum / binsPerBar / 255; // 0..1
            // Floor so silence still shows a sliver; amplify so speech fills it;
            // taper so the center bar dominates and the sides stay shorter.
            const level = 0.15 + avg * 1.8;
            setBar(i, Math.min(level * bar.taper, 1));
          });
          frame = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelled) setFallback(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close().catch(() => undefined);
    };
  }, [active]);

  return (
    <div aria-hidden="true" className="flex h-4 items-center gap-0.5">
      {WAVEFORM_BARS.map((bar, index) => (
        <span
          key={bar.id}
          ref={(el) => {
            barsRef.current[index] = el;
          }}
          className={cn(
            'bg-foreground h-4 w-[3px] origin-center rounded-full',
            fallback && 'mz-animate-waveform',
          )}
          style={
            fallback
              ? ({
                  animationDelay: bar.delay,
                  '--mz-wave-peak': bar.taper,
                } as CSSProperties)
              : { transform: `scaleY(${0.2 * bar.taper})` }
          }
        />
      ))}
    </div>
  );
}

/**
 * Sticky bottom composer. Auto-grows up to ~6 lines, then scrolls with a soft
 * top/bottom fade over scrolled-away content (instead of a hard clip). Enter
 * (without shift) or the send button submits. A paperclip opens the native file
 * picker (or `onAttachClick`). Pressing the mic enters a (prototyped) recording
 * state — an animated waveform + stop button — and stopping inserts a sample
 * transcript. While `busy`, the Send button morphs into a Stop control.
 *
 * Any `attachments` dock in a scrollable row above the input (built from the
 * Attachment primitives), each with a remove control; a non-empty list lets
 * the composer send even when the text field is empty.
 *
 * Works controlled (`value` + `onChange`) or uncontrolled (internal state).
 */
export function ChatComposer({
  placeholder = 'Ask…',
  disabled = false,
  onSend,
  onAttach,
  onAttachClick,
  showAttachButton = true,
  value: valueProp,
  onChange,
  busy = false,
  onStop,
  locked = false,
  attachments = [],
  onRemoveAttachment,
  attachmentsEnableSend = true,
  inputRef,
  textareaLabel = 'Message Moritz',
  recordingPlaceholder = 'Listening… speak now',
  attachLabel = 'Attach a file',
  voiceLabel = 'Use voice',
  stopRecordingLabel = 'Stop recording',
  sendLabel = 'Send',
  stopLabel = 'Stop generating',
  removeAttachmentLabel = (name) => `Remove ${name}`,
  'data-testid': testId,
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
  const [isDropTarget, setIsDropTarget] = useState(false);
  // dragenter/dragleave fire once per nested element, so the highlight has to
  // count them rather than toggle: moving over the textarea would clear it.
  const dragDepth = useRef(0);

  // Once the textarea hits the MAX_LINES cap it scrolls; show a soft fade on
  // whichever edge has scrolled-away content instead of a hard clip.
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
  const markScrolling = useScrollActivity();

  const attachmentsCanSend = attachmentsEnableSend && attachments.length > 0;

  const hasSomethingToSend = Boolean(value.trim()) || attachmentsCanSend;
  /** Stop is the only useful action while generating with an empty composer. */
  const showsStop = busy && !hasSomethingToSend;

  const handleSubmit = () => {
    const trimmed = value.trim();
    // Attachments alone are enough to send (matching ChatGPT/Claude).
    if ((!trimmed && !attachmentsCanSend) || disabled || locked) return;
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

  /**
   * Files dropped anywhere on the composer become attachments. Gated on a
   * caller that can receive them, and on the drag actually carrying files —
   * dragged text keeps the textarea's native insert. `locked` closes it like
   * every other way in: a file docked mid-send belongs to no send and is
   * cleared away without ever having been offered anywhere.
   */
  const acceptsDroppedFiles = Boolean(onAttach) && !disabled && !locked;

  const isFileDrag = (event: DragEvent<HTMLFormElement>) =>
    Boolean(onAttach) && Array.from(event.dataTransfer.types).includes('Files');

  const handleDragEnter = (event: DragEvent<HTMLFormElement>) => {
    if (!isFileDrag(event) || !acceptsDroppedFiles) return;
    dragDepth.current += 1;
    setIsDropTarget(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLFormElement>) => {
    if (!isFileDrag(event) || !acceptsDroppedFiles) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDropTarget(false);
  };

  const handleDragOver = (event: DragEvent<HTMLFormElement>) => {
    if (!isFileDrag(event)) return;
    // Taken even when the drop will be refused: leaving it to the browser
    // means a file dropped here replaces the page.
    event.preventDefault();
    event.dataTransfer.dropEffect = acceptsDroppedFiles ? 'copy' : 'none';
  };

  const handleDrop = (event: DragEvent<HTMLFormElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setIsDropTarget(false);
    if (!acceptsDroppedFiles) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onAttach?.(files);
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
      data-testid={testId}
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
      data-drop-target={isDropTarget || undefined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        // Card-style surface: the fill + drop `shadow` are applied directly to
        // this container, NOT via the fields' inset `before` pseudo — on a
        // container that pseudo paints a second contour just inside the border
        // (a visible "double border"). An `after` layer draws the inset 2px
        // primary focus ring, overlapping the 1px border via `-inset-px` (like
        // input-group). Border is the neutral field token, darkening on hover;
        // the border itself does not change color on focus. Radius is the field
        // `0.5rem` (matching Input/Textarea), not the card `rounded-2xl`, so
        // the composer reads as one of the fields.
        'bg-background border-field relative rounded-[0.5rem] border shadow',
        'focus-within:after:ring-primary after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:ring-inset after:ring-transparent focus-within:after:ring-2',
        'has-[textarea:enabled]:hover:border-field-strong',
        'has-[textarea:disabled]:bg-muted has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50 has-[textarea:disabled]:shadow-none',
        isDropTarget && 'bg-primary/5 after:ring-primary after:ring-2',
      )}
    >
      {attachments.length > 0 ? (
        // Docked attachment row (ChatGPT/Claude style): compact Attachment
        // cards in a horizontally-scrolling group with edge fade, sitting
        // above the input inside the composer card.
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
                    <AttachmentMedia
                      className="size-8 bg-transparent [&>svg]:size-5"
                      icon={
                        isStreaming ? (
                          <Spinner />
                        ) : (
                          <Icon className={attachment.iconClassName} />
                        )
                      }
                    />
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
                        disabled={disabled || locked}
                        onClick={() => onRemoveAttachment(attachment.id)}
                        aria-label={removeAttachmentLabel(attachment.name)}
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
          // The component drives its own auto-resize from this node, so a
          // caller's handle is filled alongside rather than instead of it.
          ref={(node) => {
            textareaRef.current = node;
            if (inputRef) inputRef.current = node;
          }}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(event) => {
            markScrolling(event);
            updateFades();
          }}
          placeholder={isRecording ? recordingPlaceholder : placeholder}
          disabled={disabled}
          aria-label={textareaLabel}
          // The input grows to a cap and then scrolls, so a long draft sits
          // behind a bar the reader is not using. Surfaced only while it moves,
          // matching the transcript above it.
          className="placeholder:text-field-placeholder selection:bg-accent selection:text-accent-foreground mz-scrollbar-on-scroll min-h-10 w-full resize-none bg-transparent text-base/6 outline-none disabled:cursor-not-allowed sm:text-sm/6"
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
          {showAttachButton ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled || locked}
              onClick={handleAttachClick}
              aria-label={attachLabel}
              aria-hidden={isRecording}
              tabIndex={isRecording ? -1 : undefined}
              className={cn(
                'rounded-full transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                isRecording && 'pointer-events-none opacity-0',
              )}
            >
              <Paperclip aria-hidden="true" />
            </Button>
          ) : null}
          {onAttachClick || !showAttachButton ? null : (
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
            aria-label={isRecording ? stopRecordingLabel : voiceLabel}
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
           * While `busy` with an empty composer it becomes a Stop control (square
           * icon → `onStop`); type something and it is a Send again, because a
           * message sent mid-turn preempts the turn rather than being lost.
           */}
          <Button
            type={showsStop ? 'button' : 'submit'}
            size="icon"
            onClick={showsStop ? onStop : undefined}
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
              showsStop ? false : disabled || locked || !hasSomethingToSend
            }
            tabIndex={isRecording ? -1 : undefined}
            aria-hidden={isRecording}
            aria-label={showsStop ? stopLabel : sendLabel}
          >
            {showsStop ? (
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
