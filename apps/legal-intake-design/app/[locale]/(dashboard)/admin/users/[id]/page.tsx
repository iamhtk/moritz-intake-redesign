import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from '@repo/ui/icons';
import { Button } from '@/components/design/design-system/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Label } from '@repo/ui/components/label';
import { Badge } from '@repo/ui/components/badge';
import { FormattedDate } from '@/components/formatted-date';
import { MOCK_USERS } from '@/lib/mocks/users';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{user.display_name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Detail label="Company">
              <Link
                href={`/admin/companies/${user.company.id}`}
                className="underline"
              >
                {user.company.name}
              </Link>
            </Detail>
            <Detail label="Role">
              <Badge variant="secondary">{user.role}</Badge>
            </Detail>
            <Detail label="Status">
              {user.enabled ? (
                <Badge variant="success">Enabled</Badge>
              ) : (
                <Badge variant="destructive">Disabled</Badge>
              )}
            </Detail>
            <Detail label="Email verified">
              {user.emailVerified ? (
                <FormattedDate date={user.emailVerified} />
              ) : (
                '—'
              )}
            </Detail>
            <Detail label="Phone">{user.phone ?? '—'}</Detail>
            <Detail label="Phone verified">
              {user.phoneVerified ? (
                <FormattedDate date={user.phoneVerified} />
              ) : (
                '—'
              )}
            </Detail>
            <Detail label="Description" className="sm:col-span-3">
              {user.description ?? '—'}
            </Detail>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
