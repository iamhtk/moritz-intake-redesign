import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/design/design-system/card';
import { Button } from '@/components/design/design-system/button';
import { AlertTriangle, Building2, FilePlus, Wand2 } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { MOCK_CASES } from '@/lib/mocks/cases';

export default async function AdminOverviewPage() {
  const tOverview = await getTranslations('admin.overview');
  const tEnterprise = await getTranslations('admin.company.createEnterprise');
  const staleCount = MOCK_CASES.filter(
    (c) =>
      c.status === 'IN_PROGRESS' &&
      new Date(c.updatedAt).getTime() < Date.now() - 5 * 86_400_000,
  ).length;

  return (
    <div className="flex flex-wrap gap-4">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>{tOverview('createCase.title')}</CardTitle>
          <CardDescription>
            {tOverview('createCase.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/cases/new">
              <FilePlus data-icon="inline-start" aria-hidden />
              {tOverview('createCase.cta')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="w-96">
        <CardHeader>
          <CardTitle>{tEnterprise('title')}</CardTitle>
          <CardDescription>{tEnterprise('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/companies/new-enterprise">
              <Building2 data-icon="inline-start" aria-hidden />
              {tEnterprise('navLabel')}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {staleCount > 0 && (
        <Card className="border-warning/40 w-96">
          <CardHeader>
            <CardAction>
              <AlertTriangle className="text-warning size-5" />
            </CardAction>
            <CardTitle>Stale in-progress cases</CardTitle>
            <CardDescription>
              {staleCount} case{staleCount === 1 ? '' : 's'} have not been
              updated in over 5 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/cases?status=IN_PROGRESS">
                Review stale cases
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="w-96">
        <CardHeader>
          <CardTitle>Backfill case numbers</CardTitle>
          <CardDescription>
            Assign sequential M-YYYY-#### case numbers to any legacy records
            missing them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Wand2 data-icon="inline-start" aria-hidden />
            Run backfill
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            Last run: 2026-05-12 · backfilled 14 cases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
