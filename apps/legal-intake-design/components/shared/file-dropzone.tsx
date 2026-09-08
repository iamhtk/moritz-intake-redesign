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
}

export function FileDropzone({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  id,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors',
        isDragActive
          ? 'border-foreground/50 bg-muted/60'
          : 'border-border bg-muted/30 hover:border-foreground/30 hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload files by dragging and dropping or clicking to browse"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
      />

      <span className="border-border bg-background text-muted-foreground group-hover:text-foreground flex size-11 items-center justify-center rounded-full border transition-colors">
        <UploadCloud className="size-5" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm">
          <span className="text-muted-foreground">{t('dropzoneText')} </span>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                fileInputRef.current?.click();
              }
            }}
            className="text-foreground rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none"
          >
            {t('dropzoneButton')}
          </button>
        </p>
        <p className="text-muted-foreground text-xs">{t('attachmentHint')}</p>
      </div>
    </div>
  );
}
