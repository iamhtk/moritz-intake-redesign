'use client';

import {
  type ChangeEvent,
  type ComponentType,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
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
import { Button } from '@/components/design/design-system/button';
import { buttonVariants } from '@/components/design/foundations/components/button';
import {
  ArrowUp,
  FileText,
  Mic,
  Paperclip,
  Square,
  UploadCloud,
  X,
} from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import {
  createDropGuard,
  type DragLike,
  type DropGuard,
} from '@/lib/intake/drop-guard';
import { VoiceWaveform } from './voice-waveform';
import { useDictation } from './use-dictation';

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
   * Opens a staged file.
   *
   * A document is attached here before it is sent, and the client's next
   * thought is often to check they attached the right one. Optional: the older
   * intake flows that share this composer have no viewer to open it in.
   */
  onOpenAttachment?: (attachment: ComposerAttachment) => void;
  /**
   * Whether docked `attachments` on their own enable sending (ChatGPT/Claude
   * style). Set `false` when the dock is a persistent, display-only collection
   * so an empty text field can't send a message. Defaults to `true`.
   */
  attachmentsEnableSend?: boolean;
  /**
   * A file is being held over the composer.
   *
   * For a surface that also has a page-wide target: the intake's "drop
   * anywhere" overlay (Decision 9) covers the composer too, so without this
   * both would light up for the same drag — and the page-wide wash sits over
   * the composer, hiding the more specific answer. The caller stands its own
   * overlay down while this is true, which reads as the target snapping to the
   * thing under the cursor.
   */
  onDraggingChange?: (dragging: boolean) => void;
  /**
   * Whether this composer is a drop target in its own right. Defaults to
   * `true`.
   *
   * Off for a surface that already has a page-wide target. The intake has one
   * (Decision 9), and two targets for one drag is two animations for one
   * gesture: the composer's own hint fired when the file crossed the textarea
   * and the page's wash fired everywhere else, so a client moving a contract
   * across the screen watched the feedback change shape under their cursor and
   * read it as the page not knowing what it wanted. One drag, one answer.
   *
   * With this off the composer installs no drag listeners at all, so `dragging`
   * never becomes true and `onDraggingChange` never fires — the drop lands on
   * the window guard instead (`lib/intake/drop-guard.ts`), which cancels the
   * browser's navigate-to-the-file default wherever the file is let go and
   * routes it to the same handler the paperclip uses. Nothing about where a
   * file ends up changes; only how many things light up on the way.
   */
  dropTarget?: boolean;
  /**
   * Whether the paperclip is rendered. Defaults to `true`.
   *
   * Off for a surface where attaching a file would do nothing — Ask reads case
   * data and cannot take an upload, and a paperclip there would be exactly the
   * dead control T34 spent its time removing.
   */
  showAttach?: boolean;
  /**
   * Overrides for the three accessible names that describe *this* composer's
   * purpose rather than the composer as a control.
   *
   * The defaults come from `intake.composer.*` and say "Tell Moritz about your
   * matter" and "Stop Moritz replying", which are right for the intake and
   * wrong anywhere else. A screen-reader user on the Ask panel would otherwise
   * be told to describe a legal matter to a box that answers questions about
   * case data. Each falls back to the intake copy when not given, so every
   * existing call site is unchanged.
   */
  labels?: { field?: string; send?: string; stop?: string };
};

const MAX_LINES = 6;

/**
 * Sticky bottom composer. Auto-grows up to ~6 lines, then scrolls with a soft
 * top/bottom fade over scrolled-away content (instead of a hard clip). Enter
 * (without shift) or the send button submits. A paperclip opens the native file
 * picker (or `onAttachClick`). Pressing the mic dictates into the field using
 * the browser's own speech recognition, and stopping leaves the words there to
 * be read and edited; it never sends. The control is not rendered at all where
 * the browser cannot transcribe. While `busy`, the Send button morphs into a Stop
 * control.
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
  onOpenAttachment,
  attachmentsEnableSend = true,
  onDraggingChange,
  dropTarget = true,
  showAttach = true,
  labels,
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /*
   * Dictation (Decision 19, revisited).
   *
   * `interim` is held separately from the field's value and rendered after it,
   * because it is not the client's text yet: recognition revises it until it
   * settles. Committing it would mean the field rewriting itself under the
   * cursor, and it would survive a stop that the client made precisely because
   * the transcription was wrong.
   */
  /*
   * Every string a client can read or hear comes from `en.json` (T26, D25).
   *
   * That now includes the five `aria-label`s on the field, the paperclip, the
   * remove control and Send. They were hardcoded English, and being invisible
   * is exactly why: they are the only copy a client using a screen reader gets
   * from those controls, and "Message Moritz" on the field was the least
   * useful of the five. The placeholder default in the props above stays
   * hardcoded, because every caller in the app passes one.
   */
  /*
   * Bound to `intake` rather than `intake.voice`, because the drop hint below
   * is not voice copy. A second translator on a second namespace would have
   * been the smaller edit and the wrong one: `copy-keys.test.ts` collects the
   * namespaces a file asks for and checks every key this `t` is given, and a
   * differently-named translator's keys are outside the only check that can see
   * a typo in them.
   */
  const t = useTranslations('intake');

  const [interim, setInterim] = useState('');

  /*
   * `onresult` fires from a listener installed once per session, so a closure
   * over `value` would append to whatever the field held when dictation
   * started and drop every sentence but the first.
   */
  const valueRef = useRef(value);
  valueRef.current = value;

  const dictation = useDictation({
    onText: (append) => setValue(append(valueRef.current)),
    onInterim: setInterim,
  });
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

  /*
   * Drag a file onto the composer to attach it.
   *
   * The same state machine the intake installs on the window
   * (`lib/intake/drop-guard.ts`), mounted on this one element instead. Nothing
   * about it is window-specific: `dragenter`/`dragleave` fire once per element
   * crossed either way, so the depth counting is what stops the highlight
   * flickering as the cursor passes over the textarea and the buttons inside.
   *
   * Reusing it also settles the overlap with "drop anywhere" for free. A drop
   * here cancels the event, and the window guard skips any drop that a zone
   * nearer the file has already claimed — so the file is taken once, not read
   * twice.
   *
   * The guard is built once and reads the live handler through refs: rebuilding
   * it on a render would reset its drag depth mid-drag, which is the flicker it
   * exists to prevent.
   */
  const canDropRef = useRef(!disabled);
  canDropRef.current = !disabled;
  const onAttachRef = useRef(onAttach);
  onAttachRef.current = onAttach;

  const [dragging, setDragging] = useState(false);
  const guardRef = useRef<DropGuard | null>(null);
  if (!guardRef.current) {
    guardRef.current = createDropGuard({
      onFiles: (files) => onAttachRef.current?.(files),
      isEnabled: () => canDropRef.current,
      setDragging,
    });
  }
  const guard = guardRef.current;

  // Nothing to hand a file to: no target, and no cancelling of the browser's
  // default either, because a surface with no attach handler has made no
  // promise about files. `dropTarget` is the second way to be a non-target —
  // a surface whose page already owns the drag (see the prop).
  const droppable = Boolean(onAttach) && dropTarget;

  const onDraggingChangeRef = useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;
  useEffect(() => {
    onDraggingChangeRef.current?.(dragging);
  }, [dragging]);

  /** A React `DragEvent` is a `DragLike`; the guard is typed for the narrower one. */
  const onDrag =
    (handler: (event: DragLike) => void) => (event: DragEvent<HTMLElement>) =>
      handler(event as unknown as DragLike);

  const dropHandlers = droppable
    ? {
        onDragEnter: onDrag(guard.dragenter),
        onDragOver: onDrag(guard.dragover),
        onDragLeave: onDrag(guard.dragleave),
        onDrop: onDrag(guard.drop),
      }
    : {};

  const handleAttachClick = () => {
    if (onAttachClick) {
      onAttachClick();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <form
      data-slot="control"
      {...dropHandlers}
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
        /*
         * `after:content-['']` is why this ring renders at all (T34).
         *
         * It was missing, and an `::after` with no `content` generates no box,
         * so the whole rule was dead: measured at the ring's own computed
         * style, `box-shadow` came back `none` with the textarea focused, and
         * a screenshot of the focused composer showed a plain grey field. The
         * composer is the one control the entire flow runs through, and it was
         * the only focus stop on the screen with no focus indication.
         */
        "focus-within:after:ring-primary after:pointer-events-none after:absolute after:-inset-px after:rounded-[inherit] after:ring-inset after:ring-transparent after:content-[''] focus-within:after:ring-2",
        'has-[textarea:enabled]:hover:border-field-strong',
        'has-[textarea:disabled]:bg-muted has-[textarea:disabled]:cursor-not-allowed has-[textarea:disabled]:opacity-50 has-[textarea:disabled]:shadow-none',
        // A held file gets the field's own focus treatment, dashed: the same
        // "this is the thing that will take it" the ring says on click, in the
        // one vocabulary the composer already has.
        dragging && 'border-primary border-dashed',
      )}
    >
      {/*
       * What a held file will do, said inside the thing that will do it.
       *
       * Covers the composer rather than sitting beside it, because the text
       * underneath is the client's half-written message and reading a hint over
       * a sentence is reading neither. `pointer-events-none` is load-bearing:
       * an overlay that takes pointer events becomes the drop's target, and the
       * drag events the form is listening for stop arriving.
       *
       * One visual language at two scales (L2). The page-wide target
       * (`intake-v2/drop-overlay.tsx`) is a wash, a backdrop blur, a reveal and
       * a circled upload mark; this is the same four things scoped to the
       * composer's own rounded rect, plus the dashed border on the form itself.
       * The wash, the blur and the icon treatment were the three that were
       * missing, so the handoff between the two scales used to change look as
       * well as size.
       *
       * Deliberately *not* done by simply letting the page-wide overlay show
       * here. Both fire for one drag, and the page-wide version is fixed to the
       * viewport at `z-50` with an 80% wash — so it paints over the composer
       * and the more specific answer becomes the one the client cannot see.
       * That was a real bug once; the caller still stands the page overlay down
       * while this one is up (`onDraggingChange`).
       *
       * `bg-background/80` rather than the `/95` it had: at 95% the blur behind
       * it does nothing, which is how you end up with a blur declaration that
       * is real in the CSS and invisible on screen.
       */}
      {dragging ? (
        <div
          aria-hidden="true"
          className="bg-background/80 text-foreground mz-animate-reveal pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-[inherit] text-[13px] font-medium supports-[backdrop-filter]:backdrop-blur-[2px]"
        >
          <span className="border-border bg-background flex size-6 items-center justify-center rounded-full border">
            <UploadCloud className="size-3.5" strokeWidth={1.75} />
          </span>
          {t('drop.composer')}
        </div>
      ) : null}
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
                  {/*
                   * The name is the button when there is somewhere to open it,
                   * and plain text when there is not. Never the whole chip:
                   * the remove × sits in the same chip, and the two would be
                   * competing for one click.
                   */}
                  {onOpenAttachment && !isStreaming ? (
                    <button
                      type="button"
                      onClick={() => onOpenAttachment(attachment)}
                      title={attachment.name}
                      className="focus-visible:outline-ring focus-visible:outline-solid hover:bg-foreground/[0.04] -mx-0.5 flex min-w-0 flex-1 cursor-pointer rounded-[0.375rem] px-0.5 text-left outline-none transition-colors focus-visible:outline-2"
                    >
                      <AttachmentContent>
                        <AttachmentTitle>{attachment.name}</AttachmentTitle>
                        {attachment.meta ? (
                          <AttachmentDescription>
                            {attachment.meta}
                          </AttachmentDescription>
                        ) : null}
                      </AttachmentContent>
                    </button>
                  ) : (
                    <AttachmentContent>
                      <AttachmentTitle>{attachment.name}</AttachmentTitle>
                      {attachment.meta ? (
                        <AttachmentDescription>
                          {attachment.meta}
                        </AttachmentDescription>
                      ) : null}
                    </AttachmentContent>
                  )}
                  {onRemoveAttachment ? (
                    <AttachmentActions className="self-center">
                      <AttachmentAction
                        type="button"
                        className="size-5"
                        disabled={disabled}
                        onClick={() => onRemoveAttachment(attachment.id)}
                        aria-label={t('composer.removeAttachment', {
                          name: attachment.name,
                        })}
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
          onChange={(event) => {
            setValue(event.target.value);
            // Typing is the client moving on. A failure line left sitting over
            // a message they are already writing is just noise.
            if (dictation.error) dictation.clearError();
          }}
          onKeyDown={handleKeyDown}
          onScroll={updateFades}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={labels?.field ?? t('composer.field')}
          className="placeholder:text-field-placeholder selection:bg-accent selection:text-accent-foreground min-h-10 w-full resize-none bg-transparent text-base/6 outline-none disabled:cursor-not-allowed sm:text-sm/6"
        />
        {fade.top ? (
          <div className="from-background pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b to-transparent" />
        ) : null}
        {fade.bottom ? (
          <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t to-transparent" />
        ) : null}
      </div>

      {/*
       * What is being heard right now, shown muted and outside the field.
       *
       * Deliberately not written into the textarea. Recognition revises interim
       * text until it settles, so putting it in the field would have the
       * client's own message rewriting itself under their cursor, and a stop
       * pressed *because* the transcription was going wrong would leave the
       * wrong words behind. Muted and separate says "this is not yours yet".
       */}
      {interim ? (
        <p
          aria-live="polite"
          className="text-muted-foreground px-3 pt-1 text-sm italic"
        >
          {interim}
        </p>
      ) : null}

      {/*
       * What dictation actually costs, said while it is running (L17).
       *
       * This is the one control in the intake whose cost was genuinely unstated,
       * and it is not a convenience cost. The mic uses the browser's own
       * `SpeechRecognition` (`lib/intake/dictation.ts`), and in Chrome that is
       * not on-device: the audio goes to the vendor's servers to be transcribed.
       * On a screen where the client is describing a confidential dispute, a
       * control that quietly ships their voice to a third party is the sort of
       * thing they would want told, and the label "Dictate your message" does
       * not tell them.
       *
       * Shown while recording rather than as a permanent line under the
       * composer, which is what "in the same breath" means here: it is the
       * answer to a question the client only has once they have pressed the
       * button, and a warning parked under an idle control is read once and
       * then never again.
       *
       * Not framed as a scare. It names the trade and the alternative in one
       * sentence, because the point is to let someone choose rather than to
       * discourage them — dictation is the right input for a client who would
       * rather talk, and most matters are not that sensitive.
       */}
      {dictation.recording ? (
        <p className="text-muted-foreground px-3 pt-1 text-[11.5px] leading-relaxed">
          {t('voice.cost')}
        </p>
      ) : null}

      {/*
       * Why dictation stopped, next to the control that stopped it. Each case
       * has its own line because a denied permission, a silent room and a
       * dropped connection need three different things from the client, and one
       * shared "voice input failed" would help with none of them.
       */}
      {dictation.error ? (
        <p role="alert" className="text-muted-foreground px-3 pt-1 text-sm">
          {t(`voice.${dictation.error}`)}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <div className="flex items-center gap-2">
          {showAttach ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                onClick={handleAttachClick}
                aria-label={t('composer.attach')}
                className="rounded-full"
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
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {/*
           * The voice control, back in the composer (Decision 19, revisited).
           *
           * The morph is the original: a circle holding a mic that crossfades
           * into the live waveform, expanding rightward into a pill that
           * reveals a stop square. That part was always good work and the
           * waveform was always real audio; what was indefensible was the old
           * button pasting a fixed sentence the client never said. It now
           * transcribes what they actually say.
           *
           * Not rendered at all where the browser has no recognition. A
           * microphone that cannot hear is the original defect wearing a
           * `disabled` attribute, and Firefox would have shown one.
           */}
          {dictation.supported ? (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={dictation.recording ? dictation.stop : dictation.start}
              aria-label={
                dictation.recording ? t('voice.stop') : t('voice.start')
              }
              aria-pressed={dictation.recording}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                // Idle: a true circle with the second track collapsed.
                // Recording: a pill with symmetric insets and a gap between
                // the waveform and the stop square. `py` is zeroed in both so
                // the height stays the full h-9.
                'grid h-9 items-center rounded-full duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                dictation.recording
                  ? 'grid-cols-[auto_1fr] gap-1.5 px-2.5 py-0 sm:px-2.5 sm:py-0'
                  : 'grid-cols-[auto_0fr] gap-0 p-0 sm:p-0',
              )}
            >
              {/*
               * Mic and waveform share one grid cell so `place-items-center`
               * centres each. Not absolute: an absolutely-positioned child is
               * not a grid item, so it would pin to the cell's top-left and
               * tuck the waveform into the pill's rounded corner.
               */}
              <span className="grid aspect-square h-full place-items-center">
                <Mic
                  aria-hidden="true"
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity',
                    dictation.recording && 'opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity',
                    dictation.recording ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <VoiceWaveform active={dictation.recording} />
                </span>
              </span>
              <span className="grid min-w-0 place-items-center overflow-hidden">
                <Square
                  aria-hidden="true"
                  className={cn(
                    'size-3 fill-current transition-opacity',
                    dictation.recording ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </span>
            </button>
          ) : null}

          {/*
           * Send. While `busy` it becomes a Stop control (square icon ->
           * `onStop`), enabled regardless of the (empty) input.
           */}
          <Button
            type={busy ? 'button' : 'submit'}
            size="icon"
            onClick={busy ? onStop : undefined}
            className="rounded-full"
            disabled={
              busy
                ? false
                : disabled || (value.trim().length === 0 && !attachmentsCanSend)
            }
            aria-label={
              busy
                ? (labels?.stop ?? t('composer.stop'))
                : (labels?.send ?? t('composer.send'))
            }
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
