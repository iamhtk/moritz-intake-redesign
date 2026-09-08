'use client';

import { useState, useRef, useCallback, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@repo/ui/components/banner';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { AlertCircle, ChevronLeft, Loader2, X } from '@repo/ui/icons';
import { Field, FieldLabel } from '@repo/ui/components/field';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { describeFile } from '@/components/design/new-case/file-utils';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { type CreateLegalCaseStep } from '@/components/cases/create-legal-case-constants';
import { formatFileSize, generateId } from '@/lib/utils';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { UploadProgressDialog } from '@/components/cases/upload-progress-dialog';
import { RichTextEditor } from '@/components/rich-text/rich-text-editor';
import { CollapsibleRichText } from '@/components/rich-text/collapsible-rich-text';
import {
  coerceRichText,
  isRichTextEmpty,
} from '@/components/rich-text/rich-text-utils';
import { Muted } from '@/components/design/design-system/typography';
import { Heading } from '@/components/design/foundations/components/heading';
import { OnboardingProgressDots } from '@/components/design/onboarding/onboarding-progress';
import {
  useNavigationGuard,
  useUnsavedChangesGuard,
} from '@/components/navigation/navigation-guard-context';

// Mirrors prod's MAX_FILE_SIZE_BYTES / next.config.js bodySizeLimit.
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

type SelectedAttachment = {
  id: string;
  file: File;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
};

interface CreateLegalMatterFormProps {
  step: CreateLegalCaseStep;
  onStepChange: (step: CreateLegalCaseStep) => void;
}

export default function CreateLegalMatterForm({
  step,
  onStepChange,
}: CreateLegalMatterFormProps) {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedAttachment[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [createdCase, setCreatedCase] = useState<{
    id: string;
    caseNumber: number;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const createdCaseId = createdCase?.id ?? null;

  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations('cases.create');
  const common = useTranslations('common');
  const router = useRouter();

  const resetError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  const isPreview = step === 'preview';
  const parsedPrompt = coerceRichText(prompt);
  const isPromptEmpty = isRichTextEmpty(parsedPrompt.doc);
  const trimmedTitle = title.trim();
  const oversizedFiles = selectedFiles.filter(
    (attachment) => attachment.file.size > MAX_FILE_SIZE_BYTES,
  );
  const hasOversizedFiles = oversizedFiles.length > 0;
  const maxFileSizeLabel = formatFileSize(MAX_FILE_SIZE_BYTES);
  const attachmentTooLargeMessage = t('attachmentTooLarge', {
    limit: maxFileSizeLabel,
  });
  const removeAttachmentLabel = t('removeAttachment');
  const attachmentStatusLabels = {
    uploading: t('attachmentUploading'),
    success: t('attachmentUploadSuccess'),
    failed: t('attachmentUploadFailedInline'),
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) =>
      prev.filter((attachment) => attachment.id !== id),
    );
    resetError();
  };

  const createAttachment = useCallback((file: File): SelectedAttachment => {
    return { id: generateId(), file, status: 'idle' };
  }, []);

  const setAttachmentStatus = useCallback(
    (
      id: string,
      status: SelectedAttachment['status'],
      errorMessage?: string,
    ) => {
      setSelectedFiles((prev) =>
        prev.map((attachment) =>
          attachment.id === id
            ? {
                ...attachment,
                status,
                errorMessage: status === 'error' ? errorMessage : undefined,
              }
            : attachment,
        ),
      );
    },
    [],
  );

  const goToReceipt = useCallback(
    (caseId: string) => {
      setIsRedirecting(true);
      router.replace(`/client/new/receipt?caseId=${caseId}`);
    },
    [router],
  );

  const isDraftEmpty = isPromptEmpty && !trimmedTitle;

  const navigationGuard = useNavigationGuard();
  const hasUnsavedChanges =
    (!isDraftEmpty || selectedFiles.length > 0) &&
    !isRedirecting &&
    !createdCase;
  useUnsavedChangesGuard(hasUnsavedChanges);

  const handleSaveDraft = async () => {
    if (isSubmitting || isSavingDraft || isRedirecting) return;
    if (hasOversizedFiles) {
      toast.error(common('error.title'), {
        description: attachmentTooLargeMessage,
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      // Stand-in for trpc.legalCases.saveDraft.useMutation in production.
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success(t('draftSaved'));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isRedirecting) return;

    if (step === 'input') {
      if (isPromptEmpty) {
        return;
      }
      if (hasOversizedFiles) {
        toast.error(common('error.title'), {
          description: attachmentTooLargeMessage,
        });
        return;
      }
      setTitle(trimmedTitle);
      onStepChange('preview');
      return;
    }

    if (createdCase) {
      goToReceipt(createdCase.id);
      return;
    }

    const attachments = selectedFiles;
    if (hasOversizedFiles) {
      toast.error(common('error.title'), {
        description: attachmentTooLargeMessage,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Stand-in for trpc.legalCases.create.useMutation in production.
      await new Promise((resolve) => setTimeout(resolve, 600));
      const result = {
        legalCaseId: 'case_new_mock',
        caseNumber: 9999,
      };
      setCreatedCase({
        id: result.legalCaseId,
        caseNumber: result.caseNumber,
      });

      let uploadFailed = false;
      if (attachments.length > 0) {
        setShowUploadDialog(true);

        await Promise.all(
          attachments.map(async (attachment) => {
            setAttachmentStatus(attachment.id, 'uploading');
            try {
              // Stand-in for trpc.documents.upload.useMutation in production.
              await new Promise((resolve) => setTimeout(resolve, 350));
              setAttachmentStatus(attachment.id, 'success');
            } catch (uploadError) {
              uploadFailed = true;
              const inlineMessage =
                uploadError instanceof Error && uploadError.message
                  ? uploadError.message
                  : attachmentStatusLabels.failed;
              setAttachmentStatus(attachment.id, 'error', inlineMessage);
            }
          }),
        );
      }

      if (attachments.length === 0 || !uploadFailed) {
        goToReceipt(result.legalCaseId);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError : new Error(t('error')),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex min-h-[60vh] flex-col gap-8 pb-8"
    >
      <div key={step} className="mz-animate-step flex flex-col gap-8">
        <header className="space-y-2">
          <Heading level={2}>
            {isPreview ? t('steps.preview.title') : t('steps.input.title')}
          </Heading>
          <Muted>
            {isPreview
              ? t('steps.preview.description')
              : t('steps.input.description')}
          </Muted>
        </header>

        {isPreview ? (
          <PreviewStep
            attachments={selectedFiles}
            prompt={prompt}
            title={title}
            promptLabel={t('label')}
            titleLabel={t('titleLabel')}
            attachmentLabel={t('attachmentLabel')}
            noAttachmentLabel={t('reviewNoAttachment')}
            attachmentTooLargeMessage={attachmentTooLargeMessage}
          />
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="title">{t('titleLabel')}</FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(event) => {
                  resetError();
                  setTitle(event.target.value);
                }}
                placeholder={t('titlePlaceholder')}
                disabled={isSubmitting}
              />
            </Field>

            <RichTextEditor
              id="prompt"
              name="prompt"
              label={t('label')}
              placeholder={t('placeholder')}
              defaultValue={prompt}
              disabled={isSubmitting}
              onChange={(value) => {
                resetError();
                setPrompt(value);
              }}
              hideMetadataFeatures
            />

            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="case-attachment" className="mb-3 block">
                  {t('attachmentSectionTitle')}
                </FieldLabel>
                <FileDropzone
                  id="case-attachment"
                  multiple
                  disabled={isSubmitting}
                  onFilesSelected={(files) => {
                    const attachments = files.map(createAttachment);

                    setSelectedFiles((prev) => {
                      const combined = [...prev, ...attachments];
                      const unique = combined.filter(
                        (item, index) =>
                          combined.findIndex(
                            (other) =>
                              other.file.name === item.file.name &&
                              other.file.size === item.file.size &&
                              other.file.lastModified ===
                                item.file.lastModified,
                          ) === index,
                      );
                      return unique;
                    });

                    if (
                      attachments.some(
                        (attachment) =>
                          attachment.file.size > MAX_FILE_SIZE_BYTES,
                      )
                    ) {
                      toast.error(common('error.title'), {
                        description: attachmentTooLargeMessage,
                      });
                    }
                    resetError();
                  }}
                />
              </div>
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((attachment) => (
                      <AttachmentRow
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={handleRemoveFile}
                        removeLabel={removeAttachmentLabel}
                        removeDisabled={isSubmitting}
                      />
                    ))}
                  </div>
                  {hasOversizedFiles ? (
                    <p className="text-destructive text-xs">
                      {attachmentTooLargeMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        )}

        {error && (
          <Banner variant="destructive">
            <AlertCircle />
            <BannerTitle>{common('error.title')}</BannerTitle>
            <BannerDescription>
              {error instanceof Error ? error.message : t('error')}
            </BannerDescription>
          </Banner>
        )}
      </div>

      <div className="mt-auto space-y-5 pt-2">
        <Button
          type="submit"
          className="w-full"
          disabled={
            (isPreview ? !trimmedTitle : isPromptEmpty || !trimmedTitle) ||
            isSubmitting ||
            isSavingDraft ||
            hasOversizedFiles
          }
        >
          {isSubmitting ? (
            <Loader2
              data-icon="inline-start"
              aria-hidden
              className="animate-spin"
            />
          ) : null}
          {isPreview
            ? createdCaseId
              ? t('continue')
              : t('submit')
            : t('next')}
        </Button>

        <div className="flex items-center justify-between gap-3">
          {isPreview ? (
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground -ms-3"
              onClick={() => onStepChange('input')}
              disabled={isSubmitting || isSavingDraft}
            >
              <ChevronLeft data-icon="inline-start" />
              {t('back')}
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="text-muted-foreground hover:text-foreground -ms-3"
            >
              <Link
                href="/client"
                onClick={(event) => {
                  if (navigationGuard?.isBlocked()) {
                    event.preventDefault();
                    navigationGuard.navigate('/client');
                  }
                }}
              >
                {t('cancel')}
              </Link>
            </Button>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSaveDraft}
              disabled={
                isSubmitting ||
                isSavingDraft ||
                hasOversizedFiles ||
                isDraftEmpty
              }
            >
              {isSavingDraft ? t('savingDraft') : t('saveAsDraft')}
            </Button>
            <OnboardingProgressDots current={isPreview ? 2 : 1} total={2} />
          </div>
        </div>
      </div>

      <UploadProgressDialog
        open={showUploadDialog}
        totalFiles={selectedFiles.length}
        uploadedFiles={
          selectedFiles.filter(
            (f) => f.status === 'success' || f.status === 'error',
          ).length
        }
        failedFiles={selectedFiles
          .filter((f) => f.status === 'error')
          .map((f) => ({
            id: f.id,
            name: f.file.name,
            errorMessage: f.errorMessage,
          }))}
        onClose={() => {
          setShowUploadDialog(false);
          if (createdCase) {
            goToReceipt(createdCase.id);
          }
        }}
      />
    </form>
  );
}

function PreviewStep({
  promptLabel,
  prompt,
  titleLabel,
  title,
  attachmentLabel,
  attachments,
  noAttachmentLabel,
  attachmentTooLargeMessage,
}: {
  promptLabel: string;
  prompt: string;
  titleLabel: string;
  title: string;
  attachmentLabel: string;
  attachments: SelectedAttachment[];
  noAttachmentLabel: string;
  attachmentTooLargeMessage: string;
}) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{titleLabel}</p>
          <p className="text-foreground text-sm leading-6">{title}</p>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium">{promptLabel}</p>
        <CollapsibleRichText value={prompt} className="text-sm leading-6" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">{attachmentLabel}</p>
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <AttachmentRow key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : (
          <Muted>{noAttachmentLabel}</Muted>
        )}
        {attachments.some(
          (attachment) => attachment.file.size > MAX_FILE_SIZE_BYTES,
        ) ? (
          <p className="text-destructive text-sm">
            {attachmentTooLargeMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AttachmentRow({
  attachment,
  onRemove,
  removeLabel,
  removeDisabled,
}: {
  attachment: SelectedAttachment;
  onRemove?: (id: string) => void;
  removeLabel?: string;
  removeDisabled?: boolean;
}) {
  const isOversized = attachment.file.size > MAX_FILE_SIZE_BYTES;
  const { Icon, colorClass } = describeFile(attachment.file.name);

  return (
    <Attachment
      size="sm"
      state={isOversized ? 'error' : 'done'}
      className="bg-muted/50 max-w-56 gap-0.5 border-transparent"
    >
      <AttachmentMedia className="size-8 bg-transparent [&>svg]:size-5">
        <Icon className={colorClass} aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{attachment.file.name}</AttachmentTitle>
      </AttachmentContent>
      {onRemove ? (
        <AttachmentActions className="self-center">
          <AttachmentAction
            className="size-5"
            onClick={() => onRemove(attachment.id)}
            disabled={removeDisabled}
            aria-label={removeLabel}
          >
            <X aria-hidden="true" />
          </AttachmentAction>
        </AttachmentActions>
      ) : null}
    </Attachment>
  );
}
