'use client';

import { useState } from 'react';
import { Send, X } from '@repo/ui/icons';
import { Field, FieldDescription, FieldLabel } from '@repo/ui/components/field';
import { Button } from '@/components/design/design-system/button';
import { Textarea } from '@/components/design/design-system/textarea';
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/design/foundations/components/attachment';
import { DocumentFileIcon } from '@/components/design/documents/document-version-row';
import { FileDropzone } from '@/components/shared/file-dropzone';
import { formatFileSize } from '@/lib/utils';

/**
 * How a lawyer hands work in. Deliberately a form and not a chat: the lawyer is
 * delivering a work product against a brief, not holding a conversation, and the
 * file is the point. Behind it the submission is recorded as a conversation for
 * QA to read, but nothing about that belongs on this screen.
 */
/**
 * What is attached to the submission. The lawyer's own upload carries a real
 * `File`; a revised draft adopted from the drafting agent is a document that
 * already exists on the case, so it has a name but no local file behind it.
 */
type PendingFile = { name: string; size?: number };

export function SubmitWorkForm({
  round,
  attached,
  disabled,
  onSubmit,
}: {
  /** Which round this will be, so a resubmission can say so. */
  round: number;
  /**
   * Pre-attached document — the drafting agent's revision, when the lawyer chose
   * to build on it. Remount the form (via `key`) to change it.
   */
  attached?: PendingFile;
  disabled?: boolean;
  onSubmit: (fileName: string, comment: string) => void;
}) {
  const [file, setFile] = useState<PendingFile | null>(attached ?? null);
  const [comment, setComment] = useState('');
  const isRevision = round > 1;

  const submit = () => {
    if (!file || disabled) return;
    onSubmit(file.name, comment.trim());
    setFile(null);
    setComment('');
  };

  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-foreground text-sm font-medium">
          {isRevision ? 'Submit revised work' : 'Submit your work'}
        </h4>
        <p className="text-muted-foreground text-sm">
          {attached
            ? 'The revised draft is attached. Replace it with your own edit if you took it further, then send it back through the checks.'
            : isRevision
              ? 'Upload the corrected document. It goes back through the same checks, and the earlier rounds stay on the record.'
              : 'Upload the finished document and add anything the reviewer should know. It is checked before it reaches the client.'}
        </p>
      </div>

      {file ? (
        <Attachment className="w-full" state="done">
          <AttachmentMedia>
            <DocumentFileIcon name={file.name} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{file.name}</AttachmentTitle>
            <AttachmentDescription>
              {file.size === undefined
                ? 'Revised draft from Moritz drafting'
                : formatFileSize(file.size)}
            </AttachmentDescription>
          </AttachmentContent>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${file.name}`}
            onClick={() => setFile(null)}
          >
            <X />
          </Button>
        </Attachment>
      ) : (
        <FileDropzone
          id="lawyer-work-submission"
          accept=".doc,.docx,.pdf"
          multiple={false}
          disabled={disabled}
          onFilesSelected={(files) => setFile(files[0] ?? null)}
        />
      )}

      <Field>
        <FieldLabel htmlFor="lawyer-work-comment">Comments</FieldLabel>
        <FieldDescription>
          Anything the reviewer should know — positions you took, what you left
          open, where you want a second look. Optional.
        </FieldDescription>
        <Textarea
          id="lawyer-work-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="I held the 30-day cure period as instructed and left the force majeure carve-out out of scope."
          disabled={disabled}
        />
      </Field>

      <Button onClick={submit} disabled={!file || disabled}>
        <Send data-icon="inline-start" />
        {isRevision ? 'Resubmit for review' : 'Submit for review'}
      </Button>
    </section>
  );
}
