'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Play,
  ShieldCheck,
} from '@repo/ui/icons';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';

import { Button } from '@/components/design/design-system/button';
import { Textarea } from '@/components/design/design-system/textarea';
import { H4, Muted } from '@/components/design/design-system/typography';
import {
  Alert,
  AlertAction,
  AlertCancel,
  AlertContent,
  AlertDescription,
  AlertFooter,
  AlertHeader,
  AlertTitle,
  AlertTrigger,
} from '@/components/design/foundations/components/alert';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { Badge } from '@/components/design/foundations/components/badge';
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@/components/design/foundations/components/banner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/design/foundations/components/empty';
import { Spinner } from '@/components/design/foundations/components/spinner';
import {
  DocumentFileIcon,
  downloadDocument,
} from '@/components/design/documents/document-version-row';
import { FileDropzone } from '@/components/shared/file-dropzone';
import type { Document, LegalCase } from '@/lib/types';

type ReviewStage =
  | 'ready'
  | 'reviewing'
  | 'ready_to_submit'
  | 'evaluating'
  | 'blocked'
  | 'passed'
  | 'delivered';

const STAGE_COPY: Record<
  ReviewStage,
  {
    labelKey:
      | 'status.ready'
      | 'status.reviewing'
      | 'status.readyToSubmit'
      | 'status.evaluating'
      | 'status.blocked'
      | 'status.passed'
      | 'status.delivered';
    variant: 'info' | 'warning' | 'destructive' | 'success';
  }
> = {
  ready: { labelKey: 'status.ready', variant: 'info' },
  reviewing: { labelKey: 'status.reviewing', variant: 'warning' },
  ready_to_submit: {
    labelKey: 'status.readyToSubmit',
    variant: 'info',
  },
  evaluating: { labelKey: 'status.evaluating', variant: 'info' },
  blocked: { labelKey: 'status.blocked', variant: 'destructive' },
  passed: { labelKey: 'status.passed', variant: 'success' },
  delivered: { labelKey: 'status.delivered', variant: 'success' },
};

function WorkflowStep({
  label,
  detail,
  complete,
  current,
}: {
  label: string;
  detail: string;
  complete: boolean;
  current: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={
          complete
            ? 'bg-success text-success-foreground flex size-6 shrink-0 items-center justify-center rounded-full'
            : current
              ? 'bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full'
              : 'bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full'
        }
      >
        {complete ? <Check className="size-3.5" /> : null}
      </span>
      <div className="min-w-0 pb-4">
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </div>
    </li>
  );
}

export function LegalAiFirstDraft({
  legalCase,
  documents,
  hideEmptyState = false,
  onUploadReviewedVersion,
  onApproveDocument,
  onDeliverDocument,
}: {
  legalCase: LegalCase;
  documents: Document[];
  /** Suppress the "not ready yet" state when something else already says where the draft is. */
  hideEmptyState?: boolean;
  onUploadReviewedVersion: (
    source: Document,
    file: File,
    reviewNote?: string,
  ) => Document;
  onApproveDocument: (documentId: string) => void;
  onDeliverDocument: (documentId: string) => void;
}) {
  const t = useTranslations('lawyerReview');
  const aiDraft = useMemo(
    () =>
      documents
        .filter((document) => document.uploaderActor === 'ai')
        .sort((a, b) => b.version - a.version)[0],
    [documents],
  );
  const latestReviewedVersion = useMemo(
    () =>
      aiDraft
        ? documents
            .filter(
              (document) =>
                document.familyId === aiDraft.familyId &&
                document.uploaderActor === 'legal',
            )
            .sort((a, b) => b.version - a.version)[0]
        : undefined,
    [aiDraft, documents],
  );
  const [reviewedVersionId, setReviewedVersionId] = useState<string | null>(
    latestReviewedVersion?.id ?? null,
  );
  const reviewedVersion =
    documents.find((document) => document.id === reviewedVersionId) ??
    latestReviewedVersion;
  const [stage, setStage] = useState<ReviewStage>(
    reviewedVersion?.status === 'delivered'
      ? 'delivered'
      : reviewedVersion
        ? 'ready_to_submit'
        : 'ready',
  );
  const [reviewNote, setReviewNote] = useState('');
  const [evalAttempts, setEvalAttempts] = useState(0);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const startWordReview = (action: 'open' | 'download') => {
    if (!aiDraft) return;
    setStage('reviewing');
    if (action === 'download') {
      downloadDocument(aiDraft);
    } else {
      toast.success('Opening the AI draft in Microsoft Word', {
        description:
          'Word integration is simulated in the Design Playground. Download the DOCX to continue.',
      });
    }
  };

  const uploadReviewedVersion = (files: File[]) => {
    const file = files[0];
    if (!file || !aiDraft) return;
    if (!/\.docx?$/i.test(file.name)) {
      toast.error('Upload a Word document', {
        description: 'The reviewed work product must be a DOC or DOCX file.',
      });
      return;
    }
    const created = onUploadReviewedVersion(aiDraft, file, reviewNote);
    setReviewedVersionId(created.id);
    setReviewNote('');
    setStage('ready_to_submit');
    toast.success(
      reviewedVersion
        ? `Revised version v${created.version} uploaded`
        : `Lawyer-reviewed version v${created.version} uploaded`,
      {
        description: 'The previous versions remain available in Documents.',
      },
    );
  };

  const runSubmissionEval = () => {
    if (!reviewedVersion || stage === 'evaluating') return;
    setStage('evaluating');
    setTimeout(() => {
      const nextAttempt = evalAttempts + 1;
      setEvalAttempts(nextAttempt);
      setStage(nextAttempt === 1 ? 'blocked' : 'passed');
      if (nextAttempt === 1) {
        toast.error('Submission eval found a blocking issue');
      } else {
        onApproveDocument(reviewedVersion.id);
        toast.success('Submission eval passed');
      }
    }, 1800);
  };

  const deliver = () => {
    if (!reviewedVersion) return;
    onDeliverDocument(reviewedVersion.id);
    setStage('delivered');
    toast.success('Final document delivered to the client', {
      description: 'The client can now download the lawyer-approved version.',
    });
  };

  const approveOverride = () => {
    if (!overrideReason.trim() || !reviewedVersion) return;
    onApproveDocument(reviewedVersion.id);
    setStage('passed');
    setOverrideOpen(false);
    setOverrideReason('');
    toast.success('Authorized override recorded', {
      description: 'The justification is attached to the submission eval.',
    });
  };

  if (!aiDraft) {
    if (hideEmptyState) return null;
    return (
      <Empty className="mz-animate-step">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>{t('draft.missingTitle')}</EmptyTitle>
          <EmptyDescription>{t('draft.missingDescription')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const stageCopy = STAGE_COPY[stage];
  const uploadDescription =
    stage === 'blocked'
      ? t('upload.blockedDescription')
      : reviewedVersion
        ? t('upload.replaceDescription')
        : t('upload.description');

  return (
    <div className="mz-animate-step space-y-6">
      <div className="flex items-start justify-between gap-3">
        <Muted>{t('intro')}</Muted>
        <Badge variant={stageCopy.variant}>{t(stageCopy.labelKey)}</Badge>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t('progress.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol>
            <WorkflowStep
              label={t('progress.preEval')}
              detail={t('progress.preEvalDetail')}
              complete
              current={false}
            />
            <WorkflowStep
              label={t('progress.lawyer')}
              detail={t('progress.lawyerDetail')}
              complete={stage !== 'ready' && stage !== 'reviewing'}
              current={stage === 'ready' || stage === 'reviewing'}
            />
            <WorkflowStep
              label={t('progress.submission')}
              detail={t('progress.submissionDetail')}
              complete={stage === 'passed' || stage === 'delivered'}
              current={
                stage === 'ready_to_submit' ||
                stage === 'evaluating' ||
                stage === 'blocked'
              }
            />
            <WorkflowStep
              label={t('progress.delivery')}
              detail={t('progress.deliveryDetail')}
              complete={stage === 'delivered'}
              current={stage === 'passed'}
            />
          </ol>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <H4>{t('draft.title')}</H4>
          <Muted>{t('draft.internal')}</Muted>
        </div>
        <Attachment className="w-full">
          <AttachmentMedia>
            <DocumentFileIcon name={aiDraft.name} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{aiDraft.name}</AttachmentTitle>
            <AttachmentDescription>
              {t('draft.meta', { version: aiDraft.version })}
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => startWordReview('open')}>
            <ExternalLink data-icon="inline-start" />
            {t('draft.openWord')}
          </Button>
          <Button variant="outline" onClick={() => startWordReview('download')}>
            <Download data-icon="inline-start" />
            {t('draft.download')}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <H4>
            {reviewedVersion ? t('upload.revisedTitle') : t('upload.title')}
          </H4>
          <Muted>{uploadDescription}</Muted>
        </div>
        <Field>
          <FieldLabel htmlFor="lawyer-review-note">
            {t('upload.note')}
          </FieldLabel>
          <FieldDescription>{t('upload.noteDescription')}</FieldDescription>
          <Textarea
            id="lawyer-review-note"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder={t('upload.notePlaceholder')}
          />
        </Field>
        <FileDropzone
          id="lawyer-reviewed-document"
          accept=".doc,.docx"
          multiple={false}
          onFilesSelected={uploadReviewedVersion}
        />

        {reviewedVersion ? (
          <Attachment className="w-full" state="done">
            <AttachmentMedia>
              <DocumentFileIcon name={reviewedVersion.name} />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{reviewedVersion.name}</AttachmentTitle>
              <AttachmentDescription>
                {t('upload.meta', { version: reviewedVersion.version })}
                {reviewedVersion.reviewNote
                  ? ` · Note: ${reviewedVersion.reviewNote}`
                  : ''}
              </AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        ) : null}
      </section>

      {stage === 'evaluating' ? (
        <Banner>
          <Spinner aria-label="Submission eval running" />
          <BannerTitle>{t('eval.runningTitle')}</BannerTitle>
          <BannerDescription>{t('eval.runningDescription')}</BannerDescription>
        </Banner>
      ) : null}

      {stage === 'blocked' ? (
        <Banner variant="destructive">
          <AlertTriangle />
          <BannerTitle>{t('eval.blockedTitle')}</BannerTitle>
          <BannerDescription>
            <p>{t('eval.blockedFinding')}</p>
            <p>{t('eval.blockedAction')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOverrideOpen(true)}
            >
              {t('eval.override')}
            </Button>
          </BannerDescription>
        </Banner>
      ) : null}

      {stage === 'passed' || stage === 'delivered' ? (
        <Banner variant="success">
          <CheckCircle2 />
          <BannerTitle>
            {stage === 'delivered' ? t('delivery.delivered') : t('eval.passed')}
          </BannerTitle>
          <BannerDescription>
            {stage === 'delivered'
              ? t('delivery.deliveredDescription')
              : t('eval.passedDescription')}
          </BannerDescription>
        </Banner>
      ) : null}

      {reviewedVersion && stage !== 'delivered' ? (
        <div className="flex flex-wrap gap-2">
          {stage !== 'passed' ? (
            <Button
              onClick={runSubmissionEval}
              disabled={stage === 'evaluating'}
            >
              {stage === 'evaluating' ? (
                <Spinner data-icon="inline-start" />
              ) : stage === 'blocked' ? (
                <Play data-icon="inline-start" />
              ) : (
                <ShieldCheck data-icon="inline-start" />
              )}
              {stage === 'evaluating'
                ? t('eval.running')
                : stage === 'blocked'
                  ? t('eval.runAgain')
                  : t('eval.run')}
            </Button>
          ) : (
            <Alert>
              <AlertTrigger asChild>
                <Button>
                  <FileCheck2 data-icon="inline-start" />
                  {t('delivery.button')}
                </Button>
              </AlertTrigger>
              <AlertContent>
                <AlertHeader>
                  <AlertTitle>{t('delivery.title')}</AlertTitle>
                  <AlertDescription>
                    {t('delivery.description', {
                      version: reviewedVersion.version,
                    })}
                  </AlertDescription>
                </AlertHeader>
                <AlertFooter>
                  <AlertCancel>{t('cancel')}</AlertCancel>
                  <AlertAction onClick={deliver}>
                    {t('delivery.confirm')}
                  </AlertAction>
                </AlertFooter>
              </AlertContent>
            </Alert>
          )}
        </div>
      ) : null}

      {stage === 'delivered' ? (
        <Button
          variant="outline"
          onClick={() => downloadDocument(reviewedVersion!)}
        >
          <Download data-icon="inline-start" />
          {t('delivery.download')}
        </Button>
      ) : null}

      {legalCase.draftResponseMarkdown ? (
        <Banner>
          <FileText />
          <BannerTitle>Draft message available</BannerTitle>
          <BannerDescription>
            The AI also prepared response copy. Use the case conversation to
            adapt and send it after the document is delivered.
          </BannerDescription>
        </Banner>
      ) : null}

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{t('override.title')}</DialogTitle>
            <DialogDescription>{t('override.description')}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="submission-eval-override">
              {t('override.label')}
            </FieldLabel>
            <FieldDescription>{t('override.help')}</FieldDescription>
            <Textarea
              id="submission-eval-override"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder={t('override.placeholder')}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={approveOverride} disabled={!overrideReason.trim()}>
              {t('override.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
