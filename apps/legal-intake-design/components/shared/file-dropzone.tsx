'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import { useTranslations } from 'next-intl';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  id: string;
  /**
   * Extra classes on the outer target. Additive, so every existing caller keeps
   * the shape it had; the intake uses it to sit this under a composer at full
   * column width, which wants less vertical padding than a form field does.
   */
  className?: string;
  /** Overrides the "Drag and drop or" lead. */
  label?: string;
  /** Overrides the supported-types line below it. */
  hint?: string;
  /** Overrides the "Attach a File" link. */
  buttonLabel?: string;
}

export function FileDropzone({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  id,
  className,
  label,
  hint,
  buttonLabel,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounter = useRef(0);
  const t = useTranslations('cases.create');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current += 1;
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    dragCounter.current = 0;
    setIsDragActive(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    const files: File[] = [];

    // Extract files from DataTransferItemList
    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item && item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    } else if (dt.files && dt.files.length > 0) {
      // Fallback to DataTransferFileList
      files.push(...Array.from(dt.files));
    }

    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    // The keyboard route into this zone is the labelled button inside it, not
    // the zone; see the note on `onClick`.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={cn(
        'group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors',
        isDragActive
          ? 'border-foreground/50 bg-muted/60'
          : 'border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        className,
      )}
      /*
       * Not a tab stop, and not `role="button"` (T34).
       *
       * It was both, with the real `<button>` inside it also focusable, so one
       * action had two keyboard stops and the outer one wrapped a button in a
       * button. The click and drop targets are unchanged: the whole area still
       * opens the picker on a click and still takes a drop. What the keyboard
       * gets is the control that says what it does, which is the link below.
       *
       * Which is also the answer to the two rules disabled below, and the
       * reason they are disabled here rather than switched off in the config.
       * Both are asking "how does a keyboard reach this?" — and the honest
       * answer is that it does not reach *this*, it reaches the labelled
       * button inside it, which is a real `<button>` with a real
       * `aria-label` and its own focus ring. Giving this div a `tabIndex` and
       * a key handler would put the exact duplicate stop back that T34
       * removed; giving it `role="button"` would nest one inside another.
       * Drag-and-drop is mouse-only by nature and the keyboard alternative is
       * the requirement — that requirement is met, ten lines down.
       */
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={handleFileInputChange}
        aria-hidden="true"
        /*
         * Out of the tab order (T34).
         *
         * `sr-only` hides it visually and `aria-hidden` hides it from the
         * accessibility tree, but neither takes it off the tab ring, so it was
         * a focus stop with no name, no visible position on screen and no ring
         * -- measured on the confirmation, between the dropzone's own link and
         * the source link below it. The labelled button beside it is the way in.
         */
        tabIndex={-1}
      />

      <span className="border-border bg-background text-muted-foreground group-hover:text-foreground flex size-11 items-center justify-center rounded-full border transition-colors">
        <UploadCloud className="size-5" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm">
          <span className="text-muted-foreground">
            {label ?? t('dropzoneText')}{' '}
          </span>
          {/*
           * The one keyboard stop for this zone, so it needs a ring and a name
           * that stands on its own (T34).
           *
           * It had `focus-visible:outline-none` and nothing in its place, which
           * made it an invisible stop: tabbing onto it showed no change at all
           * and the only way to find it was to guess. The label is also its own
           * accessible name now, since the words beside it ("Drop your
           * contracts or letters here, or") are not part of the control.
           */}
          <button
            type="button"
            disabled={disabled}
            aria-label={t('dropzoneLabel')}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                fileInputRef.current?.click();
              }
            }}
            className="text-foreground focus-visible:outline-ring focus-visible:outline-solid mz-tap relative rounded-[0.5rem] font-medium underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {buttonLabel ?? t('dropzoneButton')}
          </button>
        </p>
        <p className="text-muted-foreground text-xs">
          {hint ?? t('attachmentHint')}
        </p>
      </div>
    </div>
  );
}
