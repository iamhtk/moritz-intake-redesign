'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Button } from '@/components/design/design-system/button';
import { cn } from '@repo/ui/lib/utils';
import { Muted } from '@/components/design/design-system/typography';

type FailedFile = {
  id: string;
  name: string;
  errorMessage?: string;
};

interface UploadProgressDialogProps {
  open: boolean;
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: FailedFile[];
  onClose: () => void;
}

export function UploadProgressDialog({
  open,
  totalFiles,
  uploadedFiles,
  failedFiles,
  onClose,
}: UploadProgressDialogProps) {
  const t = useTranslations('cases.create.uploadProgress');

  const isUploading = uploadedFiles + failedFiles.length < totalFiles;
  const hasFailures = failedFiles.length > 0;
  const progressPercent =
    totalFiles > 0 ? Math.round((uploadedFiles / totalFiles) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent
        className="sm:max-w-2xl"
        onPointerDownOutside={(e) => {
          // Prevent closing while uploading
          if (isUploading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing while uploading
          if (isUploading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isUploading
              ? t('uploadingAttachments', { count: totalFiles })
              : hasFailures
                ? t('filesNotUploaded', {
                    failed: failedFiles.length,
                    total: totalFiles,
                  })
                : t('uploadComplete')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    isUploading
                      ? 'bg-blue-600'
                      : hasFailures
                        ? 'bg-destructive'
                        : 'bg-gray-400',
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-sm font-normal">
                {t('percentDone', { percent: progressPercent })}
              </div>
            </div>
          )}

          {/* Failed Files List */}
          {hasFailures && !isUploading && (
            <>
              <div className="max-h-[240px] space-y-3 overflow-y-auto">
                {failedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start justify-between gap-3 rounded-md border px-4 py-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-normal text-gray-900">
                        {file.name}
                      </div>
                      {file.errorMessage && (
                        <div className="text-destructive text-sm">
                          {file.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Muted>{t('uploadFailedDescription')}</Muted>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} disabled={isUploading} variant="default">
            {hasFailures && !isUploading ? t('continue') : t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
