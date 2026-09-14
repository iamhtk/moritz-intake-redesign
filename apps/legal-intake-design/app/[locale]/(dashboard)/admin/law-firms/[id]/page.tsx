import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Mail, MapPin, Phone } from '@repo/ui/icons';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import { Badge } from '@/components/design/foundations/components/badge';
import { Label } from '@repo/ui/components/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/design/foundations/components/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import CasesTable from '@/components/cases/cases-table';
import { FormattedDate } from '@/components/formatted-date';
import { getLawFirmSummary } from '@/lib/mocks/companies';
import { getCasesForCompany } from '@/lib/mocks/cases';
import type { CompanyMember, FirmMemberType } from '@/lib/types';

export const metadata: Metadata = { title: 'Law firm' };

const MEMBER_TYPE_LABELS: Record<FirmMemberType, string> = {
  LAWYER: 'Lawyer',
  ASSISTANT: 'Assistant',
  OTHER: 'Other',
};

const COUNTRY_LABELS: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  NO: 'Norway',
  SE: 'Sweden',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminLawFirmDetailPage({ params }: PageProps) {
  const { id } = await params;
  const summary = getLawFirmSummary(id);
  if (!summary) notFound();

  const { company, members, primaryContact } = summary;
  const cases = getCasesForCompany(company.id);
  const countryLabel = COUNTRY_LABELS[company.country] ?? company.country;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/admin/law-firms">
          <ArrowLeft className="h-4 w-4" /> Back to law firms
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{company.name}</CardTitle>
              <CardDescription>
                {company.description ?? 'No description'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.deletedAt ? (
                <Badge variant="secondary">Archived</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {countryLabel}
            </span>
            {company.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {company.email}
              </span>
            )}
            {company.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {company.phone}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">
            Members ({summary.memberCount})
          </TabsTrigger>
          <TabsTrigger value="cases">Cases ({summary.totalCases})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-4">
          <div>
            <h2 className="font-semibold">Firm information</h2>
            <p className="text-muted-foreground text-sm">
              Read-only for now — editing is part of a later phase.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail label="Org. number">{company.orgNumber ?? '—'}</Detail>
            <Detail label="Country / jurisdiction">{countryLabel}</Detail>
            <Detail label="Website">
              {company.companyUrl ? (
                <a className="underline" href={company.companyUrl}>
                  {company.companyUrl}
                </a>
              ) : (
                '—'
              )}
            </Detail>
            <Detail label="Email">{company.email ?? '—'}</Detail>
            <Detail label="Phone">{company.phone ?? '—'}</Detail>
            <Detail label="Plan" className="capitalize">
              {company.paymentPlan.toLowerCase()}
            </Detail>
            <Detail label="Specialties">
              {company.specialties.length === 0
                ? '—'
                : company.specialties.join(', ')}
            </Detail>
            <Detail label="Main point of contact">
              {primaryContact ? primaryContact.name : '—'}
            </Detail>
            <Detail label="Date joined">
              <FormattedDate date={company.createdAt} />
            </Detail>
          </dl>
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-4">
          <div>
            <h2 className="font-semibold">Members</h2>
            <p className="text-muted-foreground text-sm">
              Lawyers, assistants, and other staff at {company.name}.
            </p>
          </div>
          {members.length === 0 ? (
            <div className="text-muted-foreground py-4 text-sm">
              No members.
            </div>
          ) : (
            <ul className="divide-border divide-y">
              {members.map((m) => (
                <MemberRow key={m.membershipId} member={m} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="cases" className="mt-4 space-y-4">
          <div>
            <h2 className="font-semibold">Cases</h2>
            <p className="text-muted-foreground text-sm">
              Cases owned or assigned to {company.name}.
            </p>
          </div>
          <CasesTable
            cases={cases}
            basePath="/admin/cases"
            showCustomer
            showQuoteAmount
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MemberRow({ member }: { member: CompanyMember }) {
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{member.name}</span>
          {member.isPrimaryContact && (
            <Badge variant="success" className="font-normal">
              Main contact
            </Badge>
          )}
          {member.role === 'OWNER' && (
            <Badge variant="secondary" className="font-normal">
              Owner
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground text-xs">
          {member.title ? `${member.title} · ` : ''}
          {member.email}
        </div>
      </div>
      <Badge
        variant={member.memberType === 'LAWYER' ? 'secondary' : 'outline'}
        className="font-normal"
      >
        {MEMBER_TYPE_LABELS[member.memberType]}
      </Badge>
    </li>
  );
}

function Detail({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className={`text-sm ${className ?? ''}`}>{children}</div>
    </div>
  );
}
