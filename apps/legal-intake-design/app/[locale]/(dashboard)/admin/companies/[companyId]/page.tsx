import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from '@repo/ui/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@/components/design/design-system/button';
import { Label } from '@repo/ui/components/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { FormattedDate } from '@/components/formatted-date';
import CasesTable from '@/components/cases/cases-table';
import { getCompanyById, MOCK_COMPANY_MEMBERS } from '@/lib/mocks/companies';
import { getCasesForCompany } from '@/lib/mocks/cases';
import { Archive, Trash2, RotateCcw, Merge } from '@repo/ui/icons';

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function AdminCompanyDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  const company = getCompanyById(companyId);
  if (!company) notFound();

  const members = MOCK_COMPANY_MEMBERS[company.id] ?? [];
  const cases = getCasesForCompany(company.id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/admin/companies">
          <ArrowLeft className="h-4 w-4" /> Back to companies
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
              <Badge variant="secondary">{company.type}</Badge>
              {company.deletedAt ? (
                <Badge variant="destructive">Archived</Badge>
              ) : company.whitelisted ? (
                <Badge variant="success">Whitelisted</Badge>
              ) : (
                <Badge variant="warning">Pending</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail label="Org. number">{company.orgNumber ?? '—'}</Detail>
            <Detail label="Country">{company.country}</Detail>
            <Detail label="Company URL">
              {company.companyUrl ? (
                <a className="underline" href={company.companyUrl}>
                  {company.companyUrl}
                </a>
              ) : (
                '—'
              )}
            </Detail>
            <Detail label="Plan">{company.paymentPlan}</Detail>
            <Detail label="Size">{company.size}</Detail>
            <Detail label="WorkOS organisation">
              {company.workosOrganizationId ?? '—'}
            </Detail>
            <Detail label="SCIM domains">
              {company.scimDomains.length === 0
                ? '—'
                : company.scimDomains.join(', ')}
            </Detail>
            <Detail label="SIEM enabled">
              {company.auditLogSiemEnabled ? 'Yes' : 'No'}
            </Detail>
            <Detail label="Created">
              <FormattedDate date={company.createdAt} />
            </Detail>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {company.deletedAt ? (
              <Button variant="outline" className="gap-1">
                <RotateCcw className="h-4 w-4" /> Restore
              </Button>
            ) : (
              <>
                <Button variant="outline" className="gap-1">
                  <Merge className="h-4 w-4" /> Merge
                </Button>
                <Button variant="outline" className="gap-1">
                  <Archive className="h-4 w-4" /> Archive
                </Button>
                <Button variant="destructive" className="gap-1">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Members of {company.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-muted-foreground py-4 text-sm">No users.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.membershipId}>
                    <TableCell>
                      <Link
                        href={`/admin/users/${m.userId}`}
                        className="font-medium hover:underline"
                      >
                        {m.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {m.enabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="destructive">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <FormattedDate date={m.createdAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <CardDescription>
            Cases owned or assigned to {company.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CasesTable
            cases={cases}
            basePath="/admin/cases"
            showCustomer
            showQuoteAmount
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="text-sm">{children}</div>
    </div>
  );
}
