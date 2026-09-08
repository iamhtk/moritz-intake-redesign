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
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@/components/design/design-system/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/design-system/select';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { Check, ChevronRight, Loader2 } from '@repo/ui/icons';
import { MOCK_CASE_TYPES } from '@/lib/mocks/case-types';
import { MOCK_COMPANIES } from '@/lib/mocks/companies';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';

const STEPS = [
  { id: 'caseInformation', label: 'Case information' },
  { id: 'confirmAndSubmit', label: 'Review & submit' },
] as const;

export function AdminCaseCreationSection() {
  const [step, setStep] =
    useState<(typeof STEPS)[number]['id']>('caseInformation');
  const [title, setTitle] = useState('');
  const [caseTypeId, setCaseTypeId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const clientCompanies = MOCK_COMPANIES.filter((c) => c.type === 'NON_LEGAL');

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Case created (mocked).');
      router.push('/admin/cases');
    }, 800);
  };

  return (
    <div className="space-y-4">
      <ol className="flex items-center gap-3 text-sm">
        {STEPS.map((s, idx) => {
          const isActive = step === s.id;
          const isDone = STEPS.findIndex((x) => x.id === step) > idx;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'border-primary'
                      : 'text-muted-foreground'
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span
                className={isActive ? 'font-medium' : 'text-muted-foreground'}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              )}
            </li>
          );
        })}
      </ol>

      {step === 'caseInformation' && (
        <Card>
          <CardHeader>
            <CardTitle>Case information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel htmlFor="title">Case title</FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Supplier renewal clause: California"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Client company</FieldLabel>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Case type</FieldLabel>
                <Select value={caseTypeId} onValueChange={setCaseTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a case type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CASE_TYPES.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what the client needs help with, what materials are provided, etc."
              />
            </Field>
            <div className="flex justify-end">
              <Button onClick={() => setStep('confirmAndSubmit')}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirmAndSubmit' && (
        <Card>
          <CardHeader>
            <CardTitle>Review & submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">Title</Label>
                <div className="font-medium">{title || 'Not set'}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Client</Label>
                <div className="font-medium">
                  {MOCK_COMPANIES.find((c) => c.id === companyId)?.name ??
                    'Not set'}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Case type
                </Label>
                <div className="font-medium">
                  {MOCK_CASE_TYPES.find((c) => c.id === caseTypeId)?.name ??
                    'Not set'}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Description
              </Label>
              <pre className="bg-muted/40 mt-1 whitespace-pre-wrap rounded-md p-3 text-xs">
                {description || 'Not set'}
              </pre>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('caseInformation')}
              >
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit case
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
