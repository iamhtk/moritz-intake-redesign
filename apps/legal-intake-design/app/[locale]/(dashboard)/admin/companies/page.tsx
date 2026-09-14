import type { Metadata } from 'next';
import { CompaniesTable } from '@/components/companies/companies-table';
import { H3, Muted } from '@/components/design/design-system/typography';
import { Button } from '@/components/design/design-system/button';
import { Link } from '@/i18n/navigation';
import { Building2 } from '@repo/ui/icons';

export const metadata: Metadata = { title: 'Companies' };

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <H3 asChild>
            <h1>Companies</h1>
          </H3>
          <Muted>All client and firm accounts.</Muted>
        </div>
        <Button asChild>
          <Link href="/admin/companies/new-enterprise" className="gap-2">
            <Building2 className="h-4 w-4" /> New enterprise
          </Link>
        </Button>
      </header>
      <CompaniesTable basePath="/admin/companies" />
    </div>
  );
}
