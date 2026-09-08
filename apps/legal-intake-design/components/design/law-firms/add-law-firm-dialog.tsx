'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';
import { Label } from '@repo/ui/components/label';
import { cn } from '@repo/ui/lib/utils';

import {
  Banner,
  BannerDescription,
  BannerTitle,
} from '@/components/design/foundations/components/banner';
import { Button } from '@/components/design/design-system/button';
import { Input } from '@/components/design/design-system/input';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/design/foundations/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/design/foundations/components/select';
import { TextLink } from '@/components/design/foundations/components/text';
import { Switch } from '@/components/design/foundations/components/switch';
import type { Company } from '@/lib/types';
import type { LawFirmSummary } from '@/lib/mocks/companies';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (summary: LawFirmSummary) => void;
};

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'NO', label: 'Norway' },
  { code: 'SE', label: 'Sweden' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'NL', label: 'Netherlands' },
];

type FormState = {
  name: string;
  country: string;
  website: string;
  workosOrgId: string;
  scimDomains: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  country: 'US',
  website: '',
  workosOrgId: '',
  scimDomains: '',
};

export function AddLawFirmDialog({ open, onOpenChange, onCreate }: Props) {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [showErrors, setShowErrors] = React.useState(false);
  const [ssoEnabled, setSsoEnabled] = React.useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = {
    name: form.name.trim() ? null : 'Firm name is required.',
    workosOrgId:
      ssoEnabled && !form.workosOrgId.trim()
        ? 'WorkOS organization ID is required when SSO is enabled.'
        : null,
    scimDomains:
      ssoEnabled && !form.scimDomains.trim()
        ? 'At least one SCIM domain is required when SSO is enabled.'
        : null,
  };
  const isValid = Object.values(errors).every((e) => e === null);

  const firstInvalidFieldId = errors.name
    ? 'firm-name'
    : errors.workosOrgId
      ? 'firm-workos-org'
      : errors.scimDomains
        ? 'firm-scim-domains'
        : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      // Bring the first invalid field into view since the form can scroll.
      if (firstInvalidFieldId) {
        requestAnimationFrame(() => {
          const field = document.getElementById(firstInvalidFieldId);
          field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          field?.focus({ preventScroll: true });
        });
      }
      return;
    }

    const now = new Date().toISOString();
    const id = `cmp_legal_${Math.random().toString(36).slice(2, 8)}`;
    const scimDomains = ssoEnabled
      ? form.scimDomains
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)
      : [];

    const company: Company = {
      id,
      name: form.name.trim(),
      type: 'LEGAL',
      description: null,
      orgNumber: null,
      companyUrl: form.website.trim() || null,
      whitelisted: false,
      size: 'SMALL',
      paymentPlan: 'TRIAL',
      country: form.country,
      email: null,
      phone: null,
      specialties: [],
      workosOrganizationId: ssoEnabled ? form.workosOrgId.trim() || null : null,
      scimDomains,
      auditLogSiemEnabled: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    onCreate({
      company,
      members: [],
      primaryContact: null,
      owner: null,
      memberCount: 0,
      totalCases: 0,
      inProgressCases: 0,
      closedCases: 0,
    });

    toast.success(`${company.name} added (mock).`);
    setForm(EMPTY_FORM);
    setShowErrors(false);
    setSsoEnabled(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setForm(EMPTY_FORM);
          setShowErrors(false);
          setSsoEnabled(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        size="xl"
        className="flex max-h-[calc(100dvh-5rem)] flex-col sm:max-h-[calc(100dvh-2rem)]"
      >
        <DialogHeader>
          <DialogTitle>Add law firm</DialogTitle>
          <DialogDescription>
            Create a new law firm on the platform. You can fill in the rest of
            the details later from the firm&rsquo;s page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="min-h-0 flex-1 space-y-5 overflow-y-auto">
            <Field data-invalid={showErrors && !!errors.name}>
              <FieldLabel htmlFor="firm-name">Firm name</FieldLabel>
              <Input
                id="firm-name"
                value={form.name}
                onChange={(e) => set('name', e.currentTarget.value)}
                placeholder="e.g. Hartwell Legal"
                aria-invalid={showErrors && !!errors.name}
              />
              {showErrors && errors.name && (
                <FieldError>{errors.name}</FieldError>
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firm-country">
                  Country / jurisdiction
                </FieldLabel>
                <Select
                  value={form.country}
                  onValueChange={(v) => set('country', v)}
                >
                  <SelectTrigger id="firm-country" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="firm-website">Website</FieldLabel>
                <Input
                  id="firm-website"
                  type="url"
                  value={form.website}
                  onChange={(e) => set('website', e.currentTarget.value)}
                  placeholder="https://www.firm.com"
                />
              </Field>
            </div>

            <div
              className={cn(
                'pt-5 transition-colors duration-300',
                ssoEnabled ? 'border-t' : 'border-t border-transparent',
              )}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="firm-sso-toggle"
                    className="w-fit text-base/6 font-medium sm:text-sm"
                  >
                    <span>
                      Enterprise SSO setup{' '}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </span>
                  </Label>
                  <p className="text-muted-foreground text-base/6 sm:text-sm">
                    Turn on to configure WorkOS SSO and SCIM now. You can always
                    set this up later from the firm&rsquo;s page.
                  </p>
                </div>
                <Switch
                  id="firm-sso-toggle"
                  checked={ssoEnabled}
                  onCheckedChange={setSsoEnabled}
                />
              </div>

              <div
                aria-hidden={!ssoEnabled}
                className={cn(
                  'grid transition-all duration-300 ease-out',
                  ssoEnabled
                    ? 'mt-4 grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="space-y-4 overflow-hidden">
                  <Banner className="text-base/6 sm:text-sm/6">
                    <BannerTitle>How it works</BannerTitle>
                    <BannerDescription className="text-base/6 sm:text-sm/6">
                      <ol className="ml-4 list-decimal space-y-0.5">
                        <li>
                          Create the org &amp; email domain(s) in{' '}
                          <TextLink
                            href="https://dashboard.workos.com"
                            target="_blank"
                            rel="noreferrer"
                          >
                            WorkOS
                          </TextLink>
                          .
                        </li>
                        <li>
                          Copy the org ID and domain(s) into the fields below.
                        </li>
                        <li>
                          Add the customer&rsquo;s IT admin in WorkOS — they
                          finish SSO/SCIM via the emailed admin-portal link.
                        </li>
                      </ol>
                    </BannerDescription>
                  </Banner>

                  <Field data-invalid={showErrors && !!errors.workosOrgId}>
                    <FieldLabel htmlFor="firm-workos-org">
                      WorkOS organization ID
                    </FieldLabel>
                    <Input
                      id="firm-workos-org"
                      value={form.workosOrgId}
                      onChange={(e) =>
                        set('workosOrgId', e.currentTarget.value)
                      }
                      placeholder="org_..."
                      aria-invalid={showErrors && !!errors.workosOrgId}
                    />
                    {showErrors && errors.workosOrgId && (
                      <FieldError>{errors.workosOrgId}</FieldError>
                    )}
                  </Field>

                  <Field data-invalid={showErrors && !!errors.scimDomains}>
                    <FieldLabel htmlFor="firm-scim-domains">
                      SCIM domains
                    </FieldLabel>
                    <Input
                      id="firm-scim-domains"
                      value={form.scimDomains}
                      onChange={(e) =>
                        set('scimDomains', e.currentTarget.value)
                      }
                      placeholder="example.com, corp.example.com"
                      aria-invalid={showErrors && !!errors.scimDomains}
                    />
                    <FieldDescription>
                      Comma-separated list of email domains. Only users whose
                      email matches one of these can sign in.
                    </FieldDescription>
                    {showErrors && errors.scimDomains && (
                      <FieldError>{errors.scimDomains}</FieldError>
                    )}
                  </Field>
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add law firm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
