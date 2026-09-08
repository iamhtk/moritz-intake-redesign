'use client';

import { useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@/components/design/design-system/button';
import {
  validateImageFile,
  resizeAndCompressImage,
  type ImageValidationResult,
} from '@/lib/image-utils';
import { Building2, Camera, Trash2, Upload, User } from '@repo/ui/icons';

export interface EditPhotoProps {
  currentImage?: string | null;
  onImageChange: (imageData: string | null) => void;
  disabled?: boolean;
  userName?: string;
  /**
   * `avatar` (default) is the round personal profile picture; `logo` is a
   * squircle company/firm logo with a building fallback and logo-specific copy
   * (sourced from the `registration.logo` messages).
   */
  variant?: 'avatar' | 'logo';
}

export function EditPhoto({
  currentImage,
  onImageChange,
  disabled = false,
  userName,
  variant = 'avatar',
}: EditPhotoProps) {
  const t = useTranslations(
    variant === 'logo' ? 'registration.logo' : 'registration.photo',
  );
  const isLogo = variant === 'logo';
  const FallbackIcon = isLogo ? Building2 : User;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);

      try {
        // Validate file
        const validation: ImageValidationResult = validateImageFile(file);
        if (!validation.valid && validation.error) {
          // Dynamic translation key based on validation error
          toast.error(
            t(
              `errors.${validation.error}` as
                | 'errors.tooLarge'
                | 'errors.invalidFormat'
                | 'errors.uploadFailed',
            ),
          );
          return;
        }

        // Resize and compress image
        const base64Image = await resizeAndCompressImage(file, 1, 512, 512);

        // Update parent component
        onImageChange(base64Image);
      } catch (error) {
        console.error('Failed to process image:', error);
        toast.error(t('errors.uploadFailed'));
      } finally {
        setIsProcessing(false);
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onImageChange, t],
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    onImageChange(null);
  }, [onImageChange]);

  const hasImage = Boolean(currentImage);

  return (
    <div className="flex items-center gap-4">
      {/* The preview doubles as the upload/change target: clicking (or focusing
          and pressing it) opens the file picker, with an overlay cueing the
          action on hover/focus and showing the spinner while processing. */}
      <button
        type="button"
        onClick={handleUploadClick}
        disabled={disabled || isProcessing}
        aria-label={hasImage ? t('change') : t('upload')}
        className={cn(
          'bg-muted text-muted-foreground group relative size-24 shrink-0 cursor-pointer overflow-hidden outline-none',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isLogo ? 'rounded-2xl' : 'rounded-full',
        )}
      >
        {currentImage ? (
          <Image
            src={currentImage}
            alt={userName || t('label')}
            fill
            className={isLogo ? 'object-contain p-2' : 'object-cover'}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <FallbackIcon className="size-8" strokeWidth={1.5} />
          </span>
        )}

        <span
          className={cn(
            'bg-foreground/45 text-background absolute inset-0 flex items-center justify-center opacity-0 transition-opacity',
            'group-hover:opacity-100 group-focus-visible:opacity-100',
            isProcessing && 'opacity-100',
          )}
        >
          {isProcessing ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Camera className="size-5" strokeWidth={1.75} />
          )}
        </span>
      </button>

      <div className="space-y-1.5">
        {hasImage ? (
          // The preview itself is the change affordance (click to re-pick), so
          // we keep the explicit action to just a quiet Remove.
          <div className="-ms-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isProcessing}
            >
              <Trash2 data-icon="inline-start" className="size-4" />
              {t('remove')}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || isProcessing}
          >
            <Upload data-icon="inline-start" className="size-4" />
            {t('upload')}
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />
    </div>
  );
}
