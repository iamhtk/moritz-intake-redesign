'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import { Textarea } from '@/components/design/design-system/textarea';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from '@repo/ui/icons';
import { toast } from 'sonner';
import type { CaseTemplate } from '@/lib/types';

type Props = {
  caseTypeId: string;
  mode: 'create' | 'edit';
  initialValues: CaseTemplate | null;
};

export function TemplateEditor({ caseTypeId, mode, initialValues }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [previewText, setPreviewText] = useState(
    initialValues?.previewText ?? '',
  );
  const [dataRequirements, setDataRequirements] = useState(
    (initialValues?.dataRequirements ?? []).join(', '),
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href={`/admin/case-types/${caseTypeId}`}>
          <ArrowLeft className="h-4 w-4" /> Back to case type
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'New template' : 'Edit template'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="reqs">
              Data requirements (comma-separated)
            </FieldLabel>
            <Input
              id="reqs"
              value={dataRequirements}
              onChange={(e) => setDataRequirements(e.target.value)}
              placeholder="clientCompany, contractDate, section"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preview">Preview text</FieldLabel>
            <Textarea
              id="preview"
              rows={10}
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="font-mono text-sm"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/case-types/${caseTypeId}`}>Cancel</Link>
            </Button>
            <Button onClick={() => toast.success('Template saved (mock).')}>
              {mode === 'create' ? 'Create template' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
