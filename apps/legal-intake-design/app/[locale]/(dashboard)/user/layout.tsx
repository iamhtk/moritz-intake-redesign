import { Settings2, ArrowLeft } from '@repo/ui/icons';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { getMockUser } from '@/components/playground/auth-stubs';
import { H3 } from '@/components/design/design-system/typography';
import { UserNav } from './user-nav';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tNav = await getTranslations('navigation');
  const user = await getMockUser();
  const isCompanyOwner = user.role === 'OWNER';
  const hasCompany = !!user.company.id;

  return (
    <div>
      <div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>
      <H3 asChild className="flex flex-row items-center gap-2 py-6">
        <h1>
          <Settings2 />
          {tNav('settings')}
        </h1>
      </H3>
      <div className="relative flex h-full flex-col gap-4 scroll-smooth md:flex-row md:gap-12">
        <aside className="w-full shrink-0 overflow-y-auto md:sticky md:top-6 md:h-[calc(100vh-4rem)] md:w-64 md:self-start">
          <div className="flex flex-col gap-4">
            <UserNav isCompanyOwner={isCompanyOwner} hasCompany={hasCompany} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
