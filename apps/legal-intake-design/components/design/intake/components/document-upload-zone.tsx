'use client';

import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@repo/ui/components/banner';
import { Button } from '@/components/design/design-system/button';
import { FileText, Upload, X } from '@repo/ui/icons';
import { cn } from '@repo/ui/lib/utils';
import type { FileMeta } from '../intake-types';
import { ExtractionShimmer } from './extraction-shimmer';

type DocumentUploadZoneProps = {
  files: FileMeta[];
  extracting: boolean;
  extractionError: string | null;
  onAddFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  onDismissError: () => void;
};

const ACCEPTED = '.pdf,.doc,.docx,image/*';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Multi-file drop zone with a browse/upload affordance and a list of uploaded
 * file chips. Extraction shimmer / error states are driven by the parent (mock
 * extraction lives in the flow).
 */
export function DocumentUploadZone({
  files,
  extracting,
  extractionError,
  onAddFiles,
  onRemove,
  onDismissError,
}: DocumentUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onAddFiles(Array.from(fileList));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          'hover:border-primary/60 hover:bg-accent/40 cursor-pointer',
          'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
          isDragging && 'border-primary bg-primary/5',
        )}
      >
        <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
          <Upload aria-hidden="true" className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">Drop it here, or browse</p>
        <p className="text-muted-foreground text-xs">
          PDF, DOCX, or images — you can add more than one
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload aria-hidden="true" className="h-4 w-4" />
            Browse and upload
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {extracting ? <ExtractionShimmer /> : null}

      {extractionError ? (
        <Banner variant="destructive">
          <BannerTitle>We couldn&apos;t read that file.</BannerTitle>
          <BannerDescription className="flex flex-col items-start gap-2">
            <span>{extractionError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDismissError}
            >
              Try another file or skip
            </Button>
          </BannerDescription>
        </Banner>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="bg-background flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                <FileText aria-hidden="true" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Remove ${file.name}`}
                onClick={() => onRemove(index)}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
